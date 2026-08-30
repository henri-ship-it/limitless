/**
 * Supabase is optional in development so the interface can be reviewed before
 * the project exists. With no credentials the app runs in preview mode: no
 * sign-in, a stub Core member, and no saved progress.
 */
export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

/**
 * Pins the cohort to a given week so week pages can be checked before the
 * programme starts. Development only, ignored in production.
 */
export const previewWeek =
  process.env.NODE_ENV === 'production' || !process.env.PREVIEW_WEEK
    ? null
    : Number(process.env.PREVIEW_WEEK)

export const previewTier = process.env.PREVIEW_TIER === 'pro' ? 'pro' : 'core'

/**
 * Opens every week regardless of the release schedule.
 *
 * For reviewing the programme before it runs, and ignored in production however
 * it is set. It applies to everyone who signs in rather than to whoever turned
 * it on, so a flag left behind in an environment would hand the whole sixteen
 * weeks to the cohort on day one. Not a thing to leave to memory.
 */
export const unlockAllWeeks =
  process.env.NODE_ENV !== 'production' && process.env.UNLOCK_ALL_WEEKS === 'true'
