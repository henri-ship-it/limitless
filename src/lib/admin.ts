import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'
import { getMember } from './member'
import { currentWeek } from './cohort'
import { weeks, type Tier } from '@/content/programme'
import { journalEntries } from '@/content/journal'

export type MemberRow = {
  id: string
  email: string
  firstName: string | null
  tier: Tier
  isAdmin: boolean
  personalisedNudges: boolean
  lastSeenAt: string | null
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

  const [{ data: profiles }, { data: progress }, { data: journal }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, tier, is_admin, personalised_nudges, last_seen_at'),
    supabase.from('member_progress').select('member_id, week_number'),
    supabase.from('member_journal').select('member_id, updated_at'),
  ])

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
      tier: p.tier as Tier,
      isAdmin: p.is_admin,
      personalisedNudges: p.personalised_nudges,
      lastSeenAt: p.last_seen_at,
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

/** One member, with everything they have written. */
export async function getMemberDetail(id: string) {
  if (!supabaseConfigured) return null

  const supabase = await createClient()
  const [{ data: profile }, { data: progress }, { data: journal }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, tier, personalised_nudges, last_seen_at, created_at')
      .eq('id', id)
      .single(),
    supabase.from('member_progress').select('week_number').eq('member_id', id),
    supabase
      .from('member_journal')
      .select('entry_number, data, updated_at')
      .eq('member_id', id)
      .order('entry_number'),
  ])

  if (!profile) return null

  return {
    profile,
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

/** Reads as "3 days ago", or "never". */
export function since(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - Date.parse(iso)
  const minutes = Math.floor(ms / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
