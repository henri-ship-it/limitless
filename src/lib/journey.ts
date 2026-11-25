import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'

/**
 * Whether a member has filed one of the two journeys.
 *
 * Answers rather than the slot itself, because a slot written with nothing in
 * it would otherwise read as done and close the week for somebody who never
 * answered anything.
 *
 * The two failure directions are not symmetrical and are chosen rather than
 * inherited. On an error this returns true, so a database blip opens week
 * sixteen rather than locking a member out of the last week of a programme
 * they paid for. With Supabase not configured at all it returns false, because
 * that is the local preview, where the state worth looking at is the one
 * before the member has answered.
 */
export async function journeyDone(
  memberId: string,
  slot: 'baseline' | 'reflection',
): Promise<boolean> {
  if (!supabaseConfigured) return false
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('assessment')
      .eq('id', memberId)
      .maybeSingle()
    const filed = (data?.assessment as Record<string, unknown> | null)?.[slot] as
      | { answers?: Record<string, unknown> }
      | undefined
    return Boolean(filed?.answers && Object.keys(filed.answers).length)
  } catch {
    return true
  }
}
