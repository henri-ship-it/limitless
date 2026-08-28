'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

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

  await supabase
    .from('member_journal')
    .upsert(
      { member_id: userId, entry_number: entry, data, updated_at: new Date().toISOString() },
      { onConflict: 'member_id,entry_number' },
    )
}

/** Turns the personalised nudges on or off for the signed-in member. */
export async function setNudgePreference(enabled: boolean) {
  const session = await requireMember()
  if (!session) return

  await session.supabase.rpc('set_personalised_nudges', { enabled })
  revalidatePath('/')
}
