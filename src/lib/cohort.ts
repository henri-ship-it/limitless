import { COHORT, weeks } from '@/content/programme'
import { previewWeek, unlockAllWeeks } from './env'

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000

/**
 * A week opens at 16:00 UK time on the day before it begins, so the chapter is
 * there when the digest lands rather than at midnight on the Monday. Week 1
 * opens at 16:00 on Sunday 30 August.
 */
const RELEASE_HOUR_UK = 16

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

/** Monday 00:00 UTC of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - day)
  return d
}

/**
 * Which week of the programme is open.
 *
 * Returns 0 during onboarding, before week 1 is released, and 17 once the
 * sixteen weeks are done. Callers should handle both ends.
 */
export function currentWeek(now: Date = new Date()): number {
  if (previewWeek !== null) return previewWeek

  let week = 0
  for (let n = 1; n <= weeks.length; n += 1) {
    if (now.getTime() >= weekReleaseDate(n).getTime()) week = n
  }

  if (week < 1) return 0
  return week
}

/**
 * How far through the programme a member can read. The same for both tiers:
 * the programme is released a week at a time, in step with the digests.
 */
export function unlockedThrough(now: Date = new Date()): number {
  if (unlockAllWeeks) return weeks.length

  /*
   * Week 1 is open from the day the platform goes live, rather than waiting
   * for its release on the Sunday. Members arriving on launch day should find
   * a chapter rather than a locked door, and by Sunday afternoon it would have
   * opened anyway. Every week after this follows the schedule: 16:00 UK on the
   * day before it begins.
   */
  return Math.max(1, currentWeek(now))
}

/** Weeks ahead of release stay visible in the nav but locked. */
export function isUnlocked(week: number, now: Date = new Date()): boolean {
  return week <= unlockedThrough(now)
}

/** Monday that a given week begins. */
export function weekStartDate(week: number): Date {
  const start = startOfWeek(new Date(`${COHORT.startDate}T00:00:00Z`))
  return new Date(start.getTime() + (week - 1) * MS_PER_WEEK)
}

/** The moment a week opens: 16:00 UK on the day before it begins. */
export function weekReleaseDate(week: number): Date {
  const monday = weekStartDate(week)
  // Midnight UK on the Monday, then back to 16:00 the day before.
  const midnightUk = new Date(monday.getTime() - londonOffset(monday))
  return new Date(midnightUk.getTime() - (24 - RELEASE_HOUR_UK) * MS_PER_HOUR)
}

/**
 * The entry a member should be on today, within a given week.
 *
 * Seven entries to a week, one a day from the Monday. Clamped at both ends: a
 * week opened early lands on its first entry rather than one before it, and a
 * week being caught up on lands on its last.
 */
export function entryForToday(week: number, now: Date = new Date()): number {
  const first = weeks.find((w) => w.number === week)?.firstEntry
  if (!first) return 1

  const days = Math.floor((now.getTime() - weekStartDate(week).getTime()) / (24 * 60 * 60 * 1000))
  return first + Math.min(6, Math.max(0, days))
}

export function formatWeekStart(week: number): string {
  return weekStartDate(week).toLocaleDateString('en-GB', {
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
export function formatWeekRelease(week: number): string {
  return weekReleaseDate(week).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  })
}
