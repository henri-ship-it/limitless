import { COHORT, weeks } from '@/content/programme'
import { previewWeek, unlockAllWeeks } from './env'

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000

/**
 * A week opens on the day before it begins, at 16:00 UK by default, so the
 * chapter is there when the digest lands rather than at midnight.
 */
const RELEASE_HOUR_UK = 16

/**
 * Whose sixteen weeks, and when they run.
 *
 * Every date on the programme is derived from one day and one hour, and until
 * Core was sold on its own both were the cohort's. They are now a member's,
 * which is the whole of the change: a clock is passed where the cohort's used
 * to be assumed, and a member without one of their own is handed the cohort's.
 *
 * A null start is a real state rather than a missing value. An evergreen member
 * has paid and not yet chosen when to begin, and the right reading of that is
 * that their programme has not started, not that it started on some default.
 */
export type Clock = {
  /** The day week 1 begins. Null when the member has not chosen one. */
  start: string | null
  /** The hour, UK, that a week opens on the day before it begins. */
  releaseHour: number
}

export const COHORT_CLOCK: Clock = { start: COHORT.startDate, releaseHour: RELEASE_HOUR_UK }

/**
 * The clock a given member runs on.
 *
 * Their own date when they have one, the cohort's when they do not, which is
 * every 4.0 member and anybody joining a cohort rather than buying Core on its
 * own. A member whose cohort has no shared date and who has not chosen one is
 * stopped, which is onboarding's job to fix.
 */
export function clockFor(
  member: { programmeStartDate?: string | null; digestSendHour?: number | null } | null,
): Clock {
  if (!member) return COHORT_CLOCK

  return {
    start: member.programmeStartDate ?? COHORT_CLOCK.start,
    releaseHour: member.digestSendHour ?? RELEASE_HOUR_UK,
  }
}

/**
 * How far Europe/London sits from UTC at a given moment, in milliseconds.
 * The programme runs across the October clock change, so weeks either side of
 * it release at different UTC times.
 */
function londonOffset(date: Date): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const london = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  return london.getTime() - utc.getTime()
}

/**
 * Which week of the programme is open.
 *
 * Returns 0 before week 1 is released, which covers onboarding and a member who
 * has not picked a start date, and 17 once the sixteen weeks are done. Callers
 * should handle both ends.
 */
export function currentWeek(now: Date = new Date(), clock: Clock = COHORT_CLOCK): number {
  if (previewWeek !== null) return previewWeek
  if (!clock.start) return 0

  let week = 0
  for (let n = 1; n <= weeks.length; n += 1) {
    if (now.getTime() >= weekReleaseDate(n, clock).getTime()) week = n
  }

  if (week < 1) return 0
  return week
}

/**
 * How far ahead of release the people running the programme may read.
 *
 * One week, which is the week they are about to open. Chris cannot check a
 * chapter on the Sunday afternoon it goes out if he first sees it at the same
 * moment everybody else does, and the alternative was ungating a week by hand
 * every Sunday. Further ahead than that is not offered on purpose: later
 * chapters are still being written, and a preview of an unfinished one is
 * worse than no preview.
 */
const ADMIN_LOOKAHEAD = 1

/**
 * How far through the programme somebody can read. The same for both tiers:
 * the programme is released a week at a time, in step with the digests.
 *
 * Admins get the next one as well. This is a read of what the caller is
 * allowed to see rather than something the caller can ask for, so it is passed
 * in from the session rather than guessed at here.
 */
export function unlockedThrough(
  now: Date = new Date(),
  isAdmin = false,
  clock: Clock = COHORT_CLOCK,
): number {
  if (unlockAllWeeks) return weeks.length

  /*
   * Nothing is open to somebody who has not said when they are starting. The
   * floor below would otherwise hand week 1 to a member who has paid and not
   * been through onboarding, which is the one thing standing between them and
   * a programme running on no date at all.
   */
  if (!clock.start) return isAdmin ? ADMIN_LOOKAHEAD : 0

  /*
   * Week 1 is open from the day the platform goes live, rather than waiting
   * for its release on the day before. Members arriving on launch day should
   * find a chapter rather than a locked door, and by that afternoon it would
   * have opened anyway. Every week after this follows the schedule.
   */
  const open = Math.max(1, currentWeek(now, clock))
  return isAdmin ? Math.min(weeks.length, open + ADMIN_LOOKAHEAD) : open
}

/** Weeks ahead of release stay visible in the nav but locked. */
export function isUnlocked(
  week: number,
  isAdmin = false,
  now: Date = new Date(),
  clock: Clock = COHORT_CLOCK,
): boolean {
  return week <= unlockedThrough(now, isAdmin, clock)
}

/**
 * The day a given week begins.
 *
 * Counted straight from the start date rather than snapped to the Monday of
 * the week containing it. A cohort starts on a Monday and the two agree, but an
 * evergreen member choosing a Wednesday means a week that runs Wednesday to
 * Tuesday, and snapping would have opened their week 2 five days in.
 */
export function weekStartDate(week: number, clock: Clock = COHORT_CLOCK): Date {
  const start = new Date(`${clock.start ?? COHORT.startDate}T00:00:00Z`)
  return new Date(start.getTime() + (week - 1) * MS_PER_WEEK)
}

/** The moment a week opens: the release hour, UK, on the day before it begins. */
export function weekReleaseDate(week: number, clock: Clock = COHORT_CLOCK): Date {
  const first = weekStartDate(week, clock)
  // Midnight UK on the first day, then back to the release hour the day before.
  const midnightUk = new Date(first.getTime() - londonOffset(first))
  return new Date(midnightUk.getTime() - (24 - clock.releaseHour) * MS_PER_HOUR)
}

/**
 * The entry a member should be on today, within a given week.
 *
 * Seven entries to a week, one a day from the day it begins. Clamped at both
 * ends: a week opened early lands on its first entry rather than one before it,
 * and a week being caught up on lands on its last.
 */
export function entryForToday(
  week: number,
  now: Date = new Date(),
  clock: Clock = COHORT_CLOCK,
): number {
  const first = weeks.find((w) => w.number === week)?.firstEntry
  if (!first) return 1

  const days = Math.floor((now.getTime() - weekStartDate(week, clock).getTime()) / MS_PER_DAY)
  return first + Math.min(6, Math.max(0, days))
}

export function formatWeekStart(week: number, clock: Clock = COHORT_CLOCK): string {
  return weekStartDate(week, clock).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Reads as "Sunday 30 August".
 *
 * Deliberately without an hour. The chapter opens at four and the digest goes
 * out at half past, so naming one time beside the other promised whichever was
 * wrong, and the day is what anyone is actually asking.
 */
export function formatWeekRelease(week: number, clock: Clock = COHORT_CLOCK): string {
  return weekReleaseDate(week, clock).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  })
}
