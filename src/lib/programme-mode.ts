import { cookies } from 'next/headers'

/**
 * Which programme the platform is showing.
 *
 * Held in a cookie rather than a URL or a profile column, for the same reason a
 * theme is: it is a way of looking at the platform rather than a fact about the
 * person. Chris flips into Elite to check a month and back out again, and
 * neither the address bar nor his record should carry that around afterwards.
 *
 * An Elite member is pinned to Elite. Only admins can switch, because only
 * they have a reason to be looking at a programme that is not theirs.
 */

export type Mode = 'limitless' | 'elite'

export { MODE_COOKIE } from './mode-cookie'
import { LEGACY_MODE_COOKIE, MODE_COOKIE } from './mode-cookie'

/**
 * Which programme to show.
 *
 * An Elite member is only ever on Elite, cookie or no cookie: it is their
 * programme, not a view of somebody else's. The cookie is for the two people
 * who run both and need to look at either.
 */
export async function getMode(tier: string, isAdmin: boolean): Promise<Mode> {
  if (tier === 'elite') return 'elite'
  if (!isAdmin) return 'limitless'

  const jar = await cookies()
  // The old cookie is still read so that nobody who last set it before the
  // rename is thrown back to the weekly programme without asking.
  const chosen = jar.get(MODE_COOKIE)?.value ?? jar.get(LEGACY_MODE_COOKIE)?.value
  return chosen === 'elite' ? 'elite' : 'limitless'
}
