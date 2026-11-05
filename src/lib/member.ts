import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Tier } from '@/content/programme'
import { previewTier, supabaseConfigured } from './env'

export type Member = {
  id: string
  email: string
  firstName: string | null
  tier: Tier
  cohort: string
  isAdmin: boolean
  /** Whether their writing may inform what they are sent. */
  personalisedNudges: boolean
  /**
   * First day of this member's Elite year, or null for everyone else.
   *
   * Elite is sold one person at a time, so there is no cohort date to fall
   * back on: without this an Elite member has no position in their own
   * programme, which the Elite pages treat as not yet started.
   */
  eliteStartDate: string | null
  /** How they came in. A cohort member shares a start date, an evergreen one
   * picks their own. */
  enrolment: 'cohort' | 'evergreen'
  /**
   * First day of this member's sixteen weeks, or null to run on their cohort's
   * date. Null on an evergreen member means onboarding is not finished.
   */
  programmeStartDate: string | null
  /** The hour, UK, their weekly digest lands. Null is the house default. */
  digestSendHour: number | null
  /** Whether the printed journal was in the basket. */
  journalOrdered: boolean
  onboardedAt: string | null
}

/** Below this, seeing someone again is not worth a write. */
const SEEN_EVERY_MS = 15 * 60 * 1000

/**
 * The signed-in member. Returns null when there is no session, which the
 * middleware normally prevents on gated routes.
 */
export const getMember = cache(async (): Promise<Member | null> => {
  if (!supabaseConfigured) {
    return {
      id: 'preview',
      email: 'preview@lmntaryperformance.com',
      firstName: null,
      tier: previewTier,
      cohort: '4.0',
      isAdmin: true,
      personalisedNudges: true,
      eliteStartDate: '2026-08-31',
      enrolment: 'cohort',
      programmeStartDate: null,
      digestSendHour: null,
      journalOrdered: true,
      onboardedAt: '2026-08-24T10:00:00Z',
    }
  }

  const supabase = await createClient()

  /*
   * getClaims verifies the token against the project's public keys, which for
   * this project happens locally. getUser asks Supabase over the network, and
   * the middleware has already done that on this same request, so repeating it
   * here was costing a round trip on every page.
   */
  const { data: claims } = await supabase.auth.getClaims()
  const user = claims?.claims
    ? { id: claims.claims.sub as string, email: claims.claims.email as string | undefined }
    : null
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    // One literal, however long: the generated types read this string to work
    // out the shape of the row, and anything built up in pieces reads as text.
    .select('first_name, tier, cohort, is_admin, personalised_nudges, last_seen_at, elite_start_date, enrolment, programme_start_date, digest_send_hour, journal_ordered, onboarded_at')
    .eq('id', user.id)
    .single()

  /*
   * Record that they were here, at most four times an hour.
   *
   * Awaited, unlike the first version. A promise left running when a server
   * render finishes is abandoned rather than completed, so the write never
   * happened and every member read as never seen. Once every fifteen minutes
   * is worth the round trip.
   */
  const seen = profile?.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0
  if (Date.now() - seen > SEEN_EVERY_MS) {
    await supabase.rpc('touch_last_seen')
  }

  return {
    id: user.id,
    email: user.email ?? '',
    firstName: profile?.first_name ?? null,
    // A member with no profile row sees Core. Tier is never inferred upward.
    tier: (profile?.tier as Tier) ?? 'core',
    cohort: profile?.cohort ?? '4.0',
    isAdmin: profile?.is_admin ?? false,
    personalisedNudges: profile?.personalised_nudges ?? true,
    eliteStartDate: (profile?.elite_start_date as string | null) ?? null,
    // A row written before 5.0 has none of these, and reads as a cohort member
    // on the cohort's date, which is what it is.
    enrolment: (profile?.enrolment as Member['enrolment']) ?? 'cohort',
    programmeStartDate: (profile?.programme_start_date as string | null) ?? null,
    digestSendHour: (profile?.digest_send_hour as number | null) ?? null,
    journalOrdered: profile?.journal_ordered ?? false,
    onboardedAt: (profile?.onboarded_at as string | null) ?? null,
  }
})

export const getProgress = cache(async (memberId: string) => {
  if (!supabaseConfigured) {
    return { completedWeeks: new Set<number>(), completedItems: new Set<string>() }
  }

  const supabase = await createClient()
  const [{ data: weeks }, { data: checklist }] = await Promise.all([
    supabase.from('member_progress').select('week_number').eq('member_id', memberId),
    supabase.from('member_checklist').select('item_key').eq('member_id', memberId),
  ])

  return {
    completedWeeks: new Set((weeks ?? []).map((w) => w.week_number as number)),
    completedItems: new Set((checklist ?? []).map((c) => c.item_key as string)),
  }
})

/** What a member has written in one journal entry. */
export const getJournalEntry = cache(async (memberId: string, entry: number) => {
  if (!supabaseConfigured) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('member_journal')
    .select('data')
    .eq('member_id', memberId)
    .eq('entry_number', entry)
    .maybeSingle()

  return (data?.data ?? null) as Record<string, unknown> | null
})

/**
 * The member's own Know Thyself scores.
 *
 * Kept apart from getMember rather than folded into it. Almost no page needs
 * these, and getMember runs on every request, so the read belongs with the two
 * pages that draw the four styles rather than on the whole platform's critical
 * path.
 */
export const getMyScores = cache(async (): Promise<Record<string, number>> => {
  if (!supabaseConfigured) {
    return { Dynamo: 78, Energiser: 71, Caretaker: 64, Analyst: 55 }
  }

  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const id = claims?.claims?.sub as string | undefined
  if (!id) return {}

  const { data } = await supabase.from('profiles').select('assessment').eq('id', id).single()
  const assessment = (data?.assessment ?? {}) as {
    scorecard?: { scores?: Record<string, number> }
  }
  return assessment.scorecard?.scores ?? {}
})

/**
 * Days in a row, counting back from today.
 *
 * Zero covers both "not been in for a while" and "the table cannot be read",
 * which is right: a streak is an encouragement, and one that cannot be counted
 * is better shown as nothing than as an error.
 */
export const getStreak = cache(async (): Promise<number> => {
  if (!supabaseConfigured) return 0

  const supabase = await createClient()
  const { data } = await supabase.rpc('my_streak')
  return typeof data === 'number' ? data : 0
})
