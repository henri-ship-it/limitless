/**
 * The shape of one journal entry, matching the printed spread.
 *
 * Preview the day on the left, review it on the right, and work the exercise
 * in between. The exercise prompts come from the entry itself, so they are not
 * listed here.
 */
/** How many hours the schedule shows, matching the printed page. */
export const SCHEDULE_LENGTH = 18

/** The printed journal starts at 5am. The setting moves it. */
export const DEFAULT_SCHEDULE_START = 5

export function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

/** The hours on show, given the start the member has chosen. */
export function scheduleHours(start = DEFAULT_SCHEDULE_START): string[] {
  return Array.from({ length: SCHEDULE_LENGTH }, (_, i) => hourLabel(start + i))
}

export const SCHEDULE_HOURS = scheduleHours()

export const REVIEW_FIELDS = [
  { key: 'win', label: 'One win of your day' },
  { key: 'mind', label: 'One thing on your mind' },
  { key: 'grateful', label: 'One thing you are grateful for' },
] as const

/**
 * A block of time on the schedule. Start and end are indices into
 * SCHEDULE_HOURS, and a block covers both ends, so start 1 end 3 is three
 * hours long.
 */
export type ScheduleBlock = { start: number; end: number; label: string }

export type EntryData = {
  intentions?: string[]
  /** Whether each intention has been ticked off during the day. */
  intentionsDone?: boolean[]
  achievements?: string[]
  /** Blocks of time on the schedule. */
  blocks?: ScheduleBlock[]
  /** The original hour by hour schedule, read once and converted to blocks. */
  schedule?: Record<string, string>
  win?: string
  mind?: string
  grateful?: string
  /** Answers to the exercise, keyed by the field's position. */
  fields?: Record<string, string | string[]>
  /** The three closing questions on a huddle entry. */
  huddle?: string[]
  /** Entry 8 only: the values picked from the list. */
  values?: string[]
}

export const EMPTY_ENTRY: EntryData = {}
