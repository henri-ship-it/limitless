import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'
import { consentOf, needsConsent, type Consent } from '@/content/consent'

/**
 * This member's answer to the quoting question, or null if they have not
 * given one under the current wording.
 *
 * Fails closed to "already answered" on any error. Showing the question to
 * somebody who has answered it is worse than missing one: it reads as the
 * platform not having listened.
 */
export async function getConsent(
  memberId: string,
): Promise<{ consent: Consent | null; asks: boolean }> {
  if (!supabaseConfigured) return { consent: null, asks: false }
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('assessment')
      .eq('id', memberId)
      .maybeSingle()
    return {
      consent: consentOf(data?.assessment),
      asks: needsConsent(data?.assessment),
    }
  } catch {
    return { consent: null, asks: false }
  }
}
