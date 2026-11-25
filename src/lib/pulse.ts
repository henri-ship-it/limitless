import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'

/**
 * Whether this member has already dealt with a check-in.
 *
 * Scoring it or closing it both count. The check is server side rather than a
 * flag in the browser, so somebody who clears their storage or opens the week
 * on their phone is not asked a second time.
 *
 * Fails open to "already answered" on any error, because showing a check-in
 * twice is worse than missing one.
 */
export async function pulseAnswered(memberId: string, key: string): Promise<boolean> {
  if (!supabaseConfigured) return true
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('assessment')
      .eq('id', memberId)
      .maybeSingle()
    const pulses = (data?.assessment as Record<string, unknown> | null)?.pulse as
      | Record<string, unknown>
      | undefined
    return Boolean(pulses?.[key])
  } catch {
    return true
  }
}
