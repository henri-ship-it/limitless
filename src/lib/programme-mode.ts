import { cookies } from 'next/headers'
import { TIERS, modeFor, tierInfo, type Mode, type Tier } from '@/content/programme'
import { LEGACY_MODE_COOKIE, MODE_COOKIE } from './mode-cookie'

/**
 * Which programme the platform is showing, and whose view of it.
 *
 * Held in a cookie rather than a URL or a profile column, for the same reason a
 * theme is: it is a way of looking at the platform rather than a fact about the
 * person. Chris flips into Elite to check a month and back out again, and
 * neither the address bar nor his record should carry that around afterwards.
 *
 * A member is pinned to their own product. Only admins can look at another,
 * because only they have a reason to be looking at a programme that is not
 * theirs.
 */

export type { Mode }

export { MODE_COOKIE } from './mode-cookie'

/**
 * The product an admin is looking at, or a member's own.
 *
 * The cookie used to hold one of the two journals and now holds one of the five
 * products, which is a wider question with the same answer at both ends: three
 * of the five read the year long journal, so the journal alone stopped being
 * enough to say what to draw.
 *
 * It was not worth a third name for the cookie. Its old values still land in
 * the right place on their own: 'elite' is a tier as well as a journal and
 * means what it always did, and 'limitless' matches no tier, so it falls
 * through to the reader's own product, which for the only three people holding
 * one of these is Pro and the sixteen week book either way.
 */
export async function viewingAs(tier: string, isAdmin: boolean): Promise<Tier> {
  const own = tierInfo(tier).key
  if (!isAdmin) return own

  const jar = await cookies()
  // The old cookie is still read so that nobody who last set it before the
  // rename is thrown back to the weekly programme without asking.
  const chosen = jar.get(MODE_COOKIE)?.value ?? jar.get(LEGACY_MODE_COOKIE)?.value

  /*
   * Matched against the list rather than passed through tierInfo, whose job is
   * to make a bad value harmless by reading it as Core. That is right for a
   * tier off a profile and wrong here: an admin with a stale or mangled cookie
   * should land back on their own product, not be quietly demoted to Core.
   */
  return TIERS.find((t) => t.key === chosen)?.key ?? own
}

/**
 * Which journal to draw.
 *
 * Every page that asks this used to ask whether the tier was Elite, which was
 * the same question while Elite was the only year long product. It is not any
 * more, so the derivation lives in one place and the pages ask for the answer.
 */
export async function getMode(tier: string, isAdmin: boolean): Promise<Mode> {
  return modeFor(await viewingAs(tier, isAdmin))
}
