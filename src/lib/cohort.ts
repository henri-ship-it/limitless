import { COHORT, weeks } from '@/content/programme'
import { previewWeek } from './env'

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000

/**
 * A week opens on the Sunday evening before it begins, not on the Monday. The
 * digest email lands then, so the platform has to be open when a member follows
 * it. Six hours before midnight puts that at 18:00 on the Sunday.
 */
const RELEASE_LEAD_HOURS = 6

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

  const released = new Date(now.getTime() + RELEASE_LEAD_HOURS * MS_PER_HOUR)
  const start = startOfWeek(new Date(`${COHORT.startDate}T00:00:00Z`))
  const week = Math.floor((startOfWeek(released).getTime() - start.getTime()) / MS_PER_WEEK) + 1

  if (week < 1) return 0
  if (week > weeks.length) return weeks.length + 1
  return week
}

/** Weeks ahead of the cohort stay visible in the nav but locked. */
export function isUnlocked(week: number, now: Date = new Date()): boolean {
  return week <= currentWeek(now)
}

/** Monday that a given week begins. */
export function weekStartDate(week: number): Date {
  const start = startOfWeek(new Date(`${COHORT.startDate}T00:00:00Z`))
  return new Date(start.getTime() + (week - 1) * MS_PER_WEEK)
}

/** The Sunday evening a week is released, which is when it opens here. */
export function weekReleaseDate(week: number): Date {
  return new Date(weekStartDate(week).getTime() - RELEASE_LEAD_HOURS * MS_PER_HOUR)
}

export function formatWeekStart(week: number): string {
  return weekStartDate(week).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatWeekRelease(week: number): string {
  return weekReleaseDate(week).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}
