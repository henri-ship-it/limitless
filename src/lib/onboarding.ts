import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'
import { onRebuiltJourney } from '@/content/programme'

/**
 * Where a member is in setting up, read once per render.
 *
 * Two facts, both from the one row: whether they have set a baseline, and
 * whether they have been shown round the platform. Everything that gates on
 * either reads this rather than querying again.
 */
export type Setup = {
  /** The baseline is the thing that must be done before the platform opens. */
  hasBaseline: boolean
  /** Whether the walkthrough has been seen or dismissed. */
  toured: boolean
  /** Whether any of this applies to them at all. */
  applies: boolean
}

export const TOUR_SLOT = 'tour'

export async function getSetup(memberId: string, cohort: string): Promise<Setup> {
  const applies = onRebuiltJourney(cohort)
  if (!supabaseConfigured || !applies) {
    return { hasBaseline: true, toured: true, applies: false }
  }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('assessment')
      .eq('id', memberId)
      .maybeSingle()
    const held = (data?.assessment ?? {}) as Record<string, unknown>
    const baseline = held.baseline as { answers?: Record<string, unknown> } | undefined
    return {
      hasBaseline: Boolean(baseline?.answers && Object.keys(baseline.answers).length),
      toured: Boolean(held[TOUR_SLOT]),
      applies: true,
    }
  } catch {
    /* Fail open. A member locked out of the platform by a failed read is a
       far worse outcome than one who skips the walkthrough. */
    return { hasBaseline: true, toured: true, applies: false }
  }
}

/**
 * Paths that stay open while somebody is still setting up.
 *
 * The baseline itself, obviously, and the things nobody should ever be locked
 * out of: signing out, their own account, and the two legal pages.
 */
export const OPEN_WHILE_SETTING_UP = [
  '/journey',
  '/account',
  '/privacy',
  '/terms',
  '/auth',
  '/sign-in',
  '/api',
]

export function isOpen(path: string): boolean {
  return OPEN_WHILE_SETTING_UP.some((open) => path.startsWith(open))
}
