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
 * This is for reviewing the programme before it runs, and it applies to
 * everyone who signs in, not just you. Take it back out before the cohort is
 * imported, or members will see all sixteen weeks on day one.
 */
export const unlockAllWeeks = process.env.UNLOCK_ALL_WEEKS === 'true'
