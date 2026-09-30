/**
 * The name of the cookie holding which programme is being shown.
 *
 * Its own file so the toggle can import it without pulling in `next/headers`,
 * which getMode needs and a client component cannot have.
 */
export const MODE_COOKIE = 'programme'

/** Thirty days, which is long enough that nobody sets it twice in a session. */
export const MODE_MAX_AGE = 60 * 60 * 24 * 30
