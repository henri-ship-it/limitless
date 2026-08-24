import { COHORT, weeks } from '@/content/programme'
import { previewWeek } from './env'

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/** Monday 00:00 UK of the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - day)
  return d
}

/**
 * Which week of the programme the cohort is in.
 *
 * Returns 0 during onboarding week, before week 1 begins, and 17 once the
 * sixteen weeks are done. Callers should handle both ends.
 */
export function currentWeek(now: Date = new Date()): number {
  if (previewWeek !== null) return previewWeek
  const start = startOfWeek(new Date(`${COHORT.startDate}T00:00:00Z`))
  const week = Math.floor((startOfWeek(now).getTime() - start.getTime()) / MS_PER_WEEK) + 1
  if (week < 1) return 0
  if (week > weeks.length) return weeks.length + 1
  return week
}

/**
 * Weeks unlock on the Monday they begin, matching the email cadence. Everything
 * ahead of the cohort stays visible in the nav but locked.
 */
export function isUnlocked(week: number, now: Date = new Date()): boolean {
  return week <= currentWeek(now)
}

/** Monday that a given week begins. */
export function weekStartDate(week: number): Date {
  const start = startOfWeek(new Date(`${COHORT.startDate}T00:00:00Z`))
  return new Date(start.getTime() + (week - 1) * MS_PER_WEEK)
}

export function formatWeekStart(week: number): string {
  return weekStartDate(week).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
