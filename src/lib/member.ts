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
    .select('first_name, tier, cohort, is_admin, personalised_nudges, last_seen_at')
    .eq('id', user.id)
    .single()

  /*
   * Record that they were here, at most four times an hour. Not awaited: a
   * page should not wait on bookkeeping, and if it fails the worst outcome is
   * a slightly stale figure on the admin view.
   */
  const seen = profile?.last_seen_at ? new Date(profile.last_seen_at).getTime() : 0
  if (Date.now() - seen > SEEN_EVERY_MS) {
    void supabase.rpc('touch_last_seen')
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
