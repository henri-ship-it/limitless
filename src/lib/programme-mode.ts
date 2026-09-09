import { cookies } from 'next/headers'

/**
 * Which programme the platform is showing.
 *
 * Held in a cookie rather than a URL or a profile column, for the same reason a
 * theme is: it is a way of looking at the platform rather than a fact about the
 * person. Chris flips into Elite to check a month and back out again, and
 * neither the address bar nor his record should carry that around afterwards.
 *
 * Admin only for now. Elite has one member and his own view is still being
 * built; until it is, nobody but the two people running it can reach it.
 */

export type Mode = 'limitless' | 'elite'

export const MODE_COOKIE = 'programme'

export async function getMode(): Promise<Mode> {
  const jar = await cookies()
  return jar.get(MODE_COOKIE)?.value === 'elite' ? 'elite' : 'limitless'
}
