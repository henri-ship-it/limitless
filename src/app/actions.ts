'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { getMember } from '@/lib/member'
import { closingEntry, isWritten, weekTick } from '@/lib/week-close'
import { journalEntries } from '@/content/journal'
import type { EntryData } from '@/content/journal-fields'

async function requireMember() {
  if (!supabaseConfigured) return null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  return { supabase, userId: user.id }
}

export async function toggleWeek(week: number, done: boolean) {
  const session = await requireMember()
  if (!session) return
  const { supabase, userId } = session

  if (done) {
    await supabase.from('member_progress').upsert({ member_id: userId, week_number: week })
  } else {
    await supabase
      .from('member_progress')
      .delete()
      .eq('member_id', userId)
      .eq('week_number', week)
  }

  revalidatePath('/', 'layout')
}

export async function toggleChecklistItem(key: string, done: boolean) {
  const session = await requireMember()
  if (!session) return
  const { supabase, userId } = session

  if (done) {
    await supabase.from('member_checklist').upsert({ member_id: userId, item_key: key })
  } else {
    await supabase.from('member_checklist').delete().eq('member_id', userId).eq('item_key', key)
  }

  revalidatePath('/', 'layout')
}

/** Saves one journal entry. Called on a debounce as the member types. */
export async function saveJournalEntry(entry: number, data: unknown) {
  const session = await requireMember()
  if (!session) return
  const { supabase, userId } = session

  /*
   * What the huddle said before this save, read only on the entry that closes a
   * week, which is one save in seven. It is the difference between a member
   * taking back what they wrote and a member who never wrote it, and those two
   * have to be told apart before a week's tick is removed.
   */
  const week = journalEntries.find((e) => e.n === entry)?.week
  const closes = week !== undefined && closingEntry(week) === entry
  let wasWritten = false

  if (closes) {
    const { data: before } = await supabase
      .from('member_journal')
      .select('data')
      .eq('member_id', userId)
      .eq('entry_number', entry)
      .maybeSingle()

    wasWritten = isWritten(entry, (before?.data ?? null) as EntryData | null)
  }

  await supabase
    .from('member_journal')
    .upsert(
      { member_id: userId, entry_number: entry, data, updated_at: new Date().toISOString() },
      { onConflict: 'member_id,entry_number' },
    )

  if (closes) await closeWeek(week!, data as EntryData, wasWritten, supabase, userId)
}

/**
 * Keeps the week's completion in step with its huddle.
 *
 * The huddle closes the week, so the tick is a reading of that entry rather
 * than a thing a member sets. Written here, on the save, rather than derived on
 * every read: the sidebar draws sixteen weeks on every page of the platform and
 * `member_progress` is one small row per week, where deriving it would mean
 * reading a hundred and twelve journal rows to render a list of titles.
 *
 * Clearing is deliberately narrow. A tick comes off only when the huddle had
 * something in it and no longer does, which is a member taking back what they
 * wrote. It must not come off merely because an empty huddle was saved, and the
 * cohort already running is the reason: their weeks were ticked by an older
 * rule that watched them read the digest, so every one of those huddles is
 * blank. Clearing on a blank save would take a member's record off them for
 * typing a line into the schedule on a page they had never answered.
 */
async function closeWeek(
  week: number,
  data: EntryData,
  wasWritten: boolean,
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const action = weekTick(wasWritten, isWritten(closingEntry(week)!, data))
  if (action === 'leave') return

  if (action === 'set') {
    await supabase.from('member_progress').upsert({ member_id: userId, week_number: week })
  } else {
    await supabase
      .from('member_progress')
      .delete()
      .eq('member_id', userId)
      .eq('week_number', week)
  }

  // The week ticks sit in the sidebar on every page.
  revalidatePath('/', 'layout')
}

/** Turns the personalised nudges on or off for the signed-in member. */
export async function setNudgePreference(enabled: boolean) {
  const session = await requireMember()
  if (!session) return

  await session.supabase.rpc('set_personalised_nudges', { enabled })
  revalidatePath('/')
}

/** Deletes everything the member has written. Theirs to do, not ours. */
export async function wipeMyEntries() {
  const session = await requireMember()
  if (!session) return

  const { supabase, userId } = session

  /*
   * The photographs go first. A foreign key reaches the row that records one,
   * but not the file itself, so deleting only the rows would leave the pages
   * they photographed sitting in storage with nothing pointing at them.
   */
  const { data: photos } = await supabase
    .from('member_photos')
    .select('path')
    .eq('member_id', userId)

  if (photos?.length) {
    await supabase.storage.from('journal-photos').remove(photos.map((row) => row.path))
  }

  await supabase.rpc('wipe_my_entries')
  // Week ticks live in the sidebar on every page, so the layout has to go too.
  revalidatePath('/', 'layout')
}

/** Notes that a member arrived from somewhere, such as the weekly digest. */
export async function recordArrival(source: string, path: string) {
  const session = await requireMember()
  if (!session) return

  await session.supabase.rpc('record_arrival', { source, page: path })
}

/**
 * Records the other address a member answers scorecards from.
 *
 * Admins only, and deliberately not something a member can set for themselves:
 * it decides whose profile an incoming scorecard attaches to, so a member
 * setting their own could attach one to somebody else.
 */
export async function setAltEmail(memberId: string, email: string) {
  const session = await requireMember()
  if (!session) return { error: 'Not signed in' }

  const { data: me } = await session.supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.userId)
    .single()

  if (!me?.is_admin) return { error: 'Not allowed' }

  const trimmed = email.trim().toLowerCase()
  if (trimmed && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { error: 'That does not look like an address.' }
  }

  const { error } = await session.supabase
    .from('profiles')
    .update({ alt_email: trimmed || null })
    .eq('id', memberId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/${memberId}`)
  return { error: null }
}

/**
 * Switches the platform between the sixteen week programme and Elite.
 *
 * A cookie rather than anything on their record: this is a way of looking at
 * the platform, not a fact about the person, and it should not follow them
 * around once they have looked. Admin only, checked here rather than trusted
 * from the button, since a cookie anybody can set is not a permission.
 */
