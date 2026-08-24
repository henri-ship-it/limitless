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
}

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
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, tier, cohort')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email ?? '',
    firstName: profile?.first_name ?? null,
    // A member with no profile row sees Core. Tier is never inferred upward.
    tier: (profile?.tier as Tier) ?? 'core',
    cohort: profile?.cohort ?? '4.0',
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
