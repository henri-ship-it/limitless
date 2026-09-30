/**
 * The cookie holding which programme is being shown.
 *
 * Its own file so the toggle can import it without pulling in `next/headers`,
 * which getMode needs and a client component cannot have.
 *
 * The name changed, and had to. The first version of this cookie was written by
 * a server action with httpOnly set, and a browser will not let script overwrite
 * an httpOnly cookie: it drops the write without complaining. So when the toggle
 * moved into the browser it went on silently failing for exactly the two people
 * who had ever used it, because they were the only ones holding the old cookie.
 *
 * A new name sidesteps the stale one rather than trying to clear it, which
 * script cannot do either.
 */
export const MODE_COOKIE = 'programme-mode'

/** What the server action used to write. Read only, so nobody's view resets. */
export const LEGACY_MODE_COOKIE = 'programme'

/** Thirty days, which is long enough that nobody sets it twice in a session. */
export const MODE_MAX_AGE = 60 * 60 * 24 * 30
