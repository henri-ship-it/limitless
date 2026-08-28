import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'
import { getMember } from './member'
import { currentWeek } from './cohort'
import { weeks, type Tier } from '@/content/programme'
import { journalEntries } from '@/content/journal'

export { since, readable } from './format'

export type MemberRow = {
  id: string
  email: string
  firstName: string | null
  phone: string | null
  tier: Tier
  isAdmin: boolean
  personalisedNudges: boolean
  lastSeenAt: string | null
  /** Seconds on the platform, all time. */
  secondsSpent: number
  weeksComplete: number
  entriesWritten: number
  /** The most recent entry they touched, which says more than a login does. */
  lastWroteAt: string | null
}

export type CohortSummary = {
  members: MemberRow[]
  signedIn: number
  activeThisWeek: number
  notStarted: number
  currentWeek: number
}

/*
 * Sign-in times live in Supabase's auth schema, which a member's own session
 * cannot read. Every caller here has already been checked as an admin.
 */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

/** Nobody who is not an admin gets past here. */
export async function requireAdmin() {
  const member = await getMember()
  return member?.isAdmin ? member : null
}

/**
 * Everyone on the programme, with enough to see who is drifting.
 *
 * Journal content is deliberately not loaded here. The list answers "who needs
 * a word", and reading what somebody wrote is a separate, deliberate step.
 */
export async function getCohort(): Promise<CohortSummary> {
  const week = currentWeek()

  if (!supabaseConfigured) {
    return { members: [], signedIn: 0, activeThisWeek: 0, notStarted: 0, currentWeek: week }
  }

  const supabase = await createClient()

  const service = serviceClient()

  const [{ data: profiles }, { data: progress }, { data: journal }, { data: time }, users] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, first_name, phone, tier, is_admin, personalised_nudges, last_seen_at'),
      supabase.from('member_progress').select('member_id, week_number'),
      supabase.from('member_journal').select('member_id, updated_at'),
      supabase.from('member_time').select('member_id, seconds'),
      service.auth.admin.listUsers({ perPage: 1000 }),
    ])

  /*
   * Last seen has two sources. The column only records page loads since it was
   * added, so on its own it reports "never" for people who have plainly been
   * in. Supabase has recorded every sign-in all along, so the later of the two
   * is the honest answer.
   */
  const signedInAt = new Map<string, string>()
  for (const u of users.data?.users ?? []) {
    if (u.last_sign_in_at) signedInAt.set(u.id, u.last_sign_in_at)
  }

  const secondsBy = new Map<string, number>()
  for (const row of time ?? []) {
    secondsBy.set(row.member_id, (secondsBy.get(row.member_id) ?? 0) + row.seconds)
  }

  const weeksBy = new Map<string, number>()
  for (const row of progress ?? []) {
    weeksBy.set(row.member_id, (weeksBy.get(row.member_id) ?? 0) + 1)
  }

  const entriesBy = new Map<string, number>()
  const wroteBy = new Map<string, string>()
  for (const row of journal ?? []) {
    entriesBy.set(row.member_id, (entriesBy.get(row.member_id) ?? 0) + 1)
    const seen = wroteBy.get(row.member_id)
    if (!seen || row.updated_at > seen) wroteBy.set(row.member_id, row.updated_at)
  }

  const members: MemberRow[] = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      email: p.email,
      firstName: p.first_name,
      phone: p.phone,
      tier: p.tier as Tier,
      isAdmin: p.is_admin,
      personalisedNudges: p.personalised_nudges,
      lastSeenAt: latest(p.last_seen_at, signedInAt.get(p.id) ?? null),
      secondsSpent: secondsBy.get(p.id) ?? 0,
      weeksComplete: weeksBy.get(p.id) ?? 0,
      entriesWritten: entriesBy.get(p.id) ?? 0,
      lastWroteAt: wroteBy.get(p.id) ?? null,
    }))
    .sort((a, b) => {
      // Quietest first: this list is for spotting who has gone missing.
      const at = a.lastSeenAt ? Date.parse(a.lastSeenAt) : 0
      const bt = b.lastSeenAt ? Date.parse(b.lastSeenAt) : 0
      return at - bt
    })

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  return {
    members,
    currentWeek: week,
    signedIn: members.filter((m) => m.lastSeenAt).length,
    activeThisWeek: members.filter((m) => m.lastSeenAt && Date.parse(m.lastSeenAt) > weekAgo).length,
    notStarted: members.filter((m) => !m.lastSeenAt).length,
  }
}

function latest(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return Date.parse(a) > Date.parse(b) ? a : b
}

/** One member, with everything they have written. */
export async function getMemberDetail(id: string) {
  if (!supabaseConfigured) return null

  const supabase = await createClient()
  const service = serviceClient()

  const [{ data: profile }, { data: progress }, { data: journal }, { data: time }, users] =
    await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, email, first_name, phone, tier, personalised_nudges, last_seen_at, created_at, assessment',
        )
        .eq('id', id)
        .single(),
      supabase.from('member_progress').select('week_number').eq('member_id', id),
      supabase
        .from('member_journal')
        .select('entry_number, data, updated_at')
        .eq('member_id', id)
        .order('entry_number'),
      supabase.from('member_time').select('path, seconds').eq('member_id', id),
      service.auth.admin.listUsers({ perPage: 1000 }),
    ])

  const { data: arrivals } = await supabase
    .from('member_arrivals')
    .select('source, path, at')
    .eq('member_id', id)
    .order('at', { ascending: false })
    .limit(20)

  if (!profile) return null

  const signedIn = users.data?.users.find((u) => u.id === id)?.last_sign_in_at ?? null

  return {
    profile: { ...profile, last_seen_at: latest(profile.last_seen_at, signedIn) },
    time: (time ?? []).sort((a, b) => b.seconds - a.seconds),
    arrivals: arrivals ?? [],
    secondsSpent: (time ?? []).reduce((sum, row) => sum + row.seconds, 0),
    weeksComplete: (progress ?? []).map((p) => p.week_number).sort((a, b) => a - b),
    entries: (journal ?? []).map((row) => ({
      n: row.entry_number,
      week: journalEntries.find((e) => e.n === row.entry_number)?.week ?? 0,
      updatedAt: row.updated_at,
      data: row.data as Record<string, unknown>,
    })),
    totalWeeks: weeks.length,
  }
}


