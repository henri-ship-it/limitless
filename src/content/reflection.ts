/**
 * When the closing reflection is asked for, and what it holds back.
 *
 * Split from the database read in `lib/journey.ts` on purpose, the same way
 * `content/pulse.ts` is split from `lib/pulse.ts`: the decision is a pure
 * function of three facts, so it can be asserted in `scripts/check-reflection`
 * rather than eyeballed on a page that only one cohort a quarter ever reaches.
 */

/**
 * The deload week that closes the programme.
 *
 * Week sixteen is `type: 'deload'`, titled "Module 04 Deload". It introduces
 * nothing new and exists to revisit what the member wrote, which is why the
 * reflection belongs at the top of it rather than at the foot: answering the
 * six statements again is the honest way to start that week, not a loose end
 * to tidy up after it.
 */
export const REFLECTION_WEEK = 16

export type Gate = {
  /** Show the ask above the week. */
  ask: boolean
  /** Withhold the week's reading until it is answered. */
  hold: boolean
}

/**
 * Whether to ask for the reflection, and whether to hold the week back.
 *
 * Admins are asked but never held. Somebody reviewing the programme has to be
 * able to read week sixteen without sitting an assessment against their own
 * account, and the ask still renders for them so the thing they are reviewing
 * is the thing a member sees.
 *
 * Deliberately not gated on cohort. Cohort 4.0 was kept off the rebuilt
 * onboarding and so has no baseline to measure against, but the reflection
 * handles that by showing where they are rather than inventing a climb, and
 * they are the next cohort to reach this week.
 */
export function reflectionGate({
  week,
  done,
  isAdmin,
}: {
  week: number
  done: boolean
  isAdmin: boolean
}): Gate {
  const ask = week === REFLECTION_WEEK && !done
  return { ask, hold: ask && !isAdmin }
}
