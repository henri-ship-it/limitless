/**
 * Elite, which is also sold as Elevate: the same programme over a year.
 *
 * The chapters are the twelve Limitless chapters, one every four weeks rather
 * than one a week, with the deload weeks gone. A deload exists because four
 * weeks of a new framework a week is too much; four weeks per chapter is
 * already the deload, so putting one in would be a month of nothing.
 *
 * Twenty eight entries to a chapter rather than seven, across four printed
 * journals, three chapters to a book. Twelve chapters, four modules, three
 * chapters to a module, forty eight weeks.
 *
 * Counted in weeks, not calendar months. A chapter is twenty eight days
 * because the journal holds twenty eight entries, and a member who starts on a
 * Monday should open every later chapter on a Monday too. Calendar months
 * drift: they are twenty eight to thirty one days long, so by the end of the
 * year the chapter and the journal no longer line up.
 *
 * Every date here is relative to the member's own start. Elite is sold one
 * person at a time rather than in cohorts, so two members are usually in
 * different chapters on the same day, and there is no date the programme
 * "begins" for everyone.
 *
 * No alumni framing anywhere. Elite was once for people who had finished
 * Limitless and the copy assumed it. It is open to anyone now, so nothing here
 * may imply they have already done something else.
 */

export type EliteChapter = {
  n: number
  title: string
  /** Which of the four modules it belongs to. */
  module: 1 | 2 | 3 | 4
  /** First and last entry of the chapter, inclusive. */
  firstEntry: number
  lastEntry: number
  /** Which of the four printed journals carries it. */
  volume: number
}

export const ELITE = {
  label: 'Elite',
  /** The other name it is sold under. Same programme, same content. */
  alias: 'Elevate',
  chapters: 12,
  entriesPerChapter: 28,
  /** Four weeks to a chapter, seven entries to a week. */
  weeksPerChapter: 4,
  volumes: 4,
  digest: 'Every four weeks, when the chapter opens',
  /** Check-ins with Chris inside each chapter, so twice a month. */
  checkInsPerChapter: 2,
} as const

export const ELITE_ENTRIES = ELITE.chapters * ELITE.entriesPerChapter
export const ELITE_WEEKS = ELITE.chapters * ELITE.weeksPerChapter
const DAYS_PER_CHAPTER = ELITE.weeksPerChapter * 7

/** One chapter every four weeks, in the order the printed journals run. */
export const eliteChapters: EliteChapter[] = [
  'Know Thyself',
  'Your Moral Code',
  'Superhuman Potential',
  'The Mindful Maverick',
  'Light the Fire',
  'The Power of Possible',
  'Solidarity Squad',
  'Riding the Wave',
  'Escape From Extinction',
  'Thoughtful Mirrors',
  'Navigating New Horizons',
  'Beyond The Ordinary',
].map((title, i) => ({
  n: i + 1,
  title,
  // Three chapters to a module, and three to a printed journal: the books were
  // bound to the modules, so the two divisions are the same one.
  module: (Math.floor(i / 3) + 1) as 1 | 2 | 3 | 4,
  firstEntry: i * ELITE.entriesPerChapter + 1,
  lastEntry: (i + 1) * ELITE.entriesPerChapter,
  volume: Math.floor(i / 3) + 1,
}))

export function eliteChapter(n: number): EliteChapter | undefined {
  return eliteChapters.find((c) => c.n === n)
}

/** The chapter an entry belongs to. */
export function chapterForEntry(entry: number): EliteChapter | undefined {
  return eliteChapters.find((c) => entry >= c.firstEntry && entry <= c.lastEntry)
}

/** The chapters of one module, in order. */
export function chaptersInModule(module: number): EliteChapter[] {
  return eliteChapters.filter((c) => c.module === module)
}

/** Midnight UTC on the day a member's programme starts. */
export function eliteStart(start: string | Date): Date {
  if (start instanceof Date) return start
  return new Date(`${start}T00:00:00Z`)
}

/** The day a chapter opens for this member. */
export function eliteChapterStart(start: string | Date, n: number): Date {
  const from = eliteStart(start)
  return new Date(from.getTime() + (n - 1) * DAYS_PER_CHAPTER * 86_400_000)
}

/** Whole days between the member's start and now. Negative before they begin. */
function daysIn(start: string | Date, now: Date): number {
  const from = eliteStart(start)
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((today - from.getTime()) / 86_400_000)
}

/**
 * Which chapter is open for this member.
 *
 * Zero before they start, thirteen once the year is done, the same way the
 * weekly programme reports either end.
 */
export function currentEliteChapter(start: string | Date, now: Date = new Date()): number {
  const days = daysIn(start, now)
  if (days < 0) return 0
  return Math.min(ELITE.chapters + 1, Math.floor(days / DAYS_PER_CHAPTER) + 1)
}

/** Which of the forty eight weeks they are in. Zero before they start. */
export function currentEliteWeek(start: string | Date, now: Date = new Date()): number {
  const days = daysIn(start, now)
  if (days < 0) return 0
  return Math.min(ELITE_WEEKS + 1, Math.floor(days / 7) + 1)
}

/** Which week of the current chapter they are in, one to four. */
export function weekInChapter(start: string | Date, now: Date = new Date()): number {
  const days = daysIn(start, now)
  if (days < 0) return 0
  return (Math.floor(days / 7) % ELITE.weeksPerChapter) + 1
}

/**
 * The entries a member is meant to be on this week.
 *
 * Seven a week through the chapter, so week two of chapter three is entries
 * sixty three to sixty nine.
 */
export function entriesForEliteWeek(week: number): number[] {
  if (week < 1 || week > ELITE_WEEKS) return []
  const first = (week - 1) * 7 + 1
  return Array.from({ length: 7 }, (_, i) => first + i)
}

/** The date a chapter opens, written the way the rest of the platform writes dates. */
export function formatEliteChapter(start: string | Date, n: number): string {
  return eliteChapterStart(start, n).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** The last day of the programme for this member. */
export function eliteEnd(start: string | Date): Date {
  return new Date(
    eliteStart(start).getTime() + (ELITE.chapters * DAYS_PER_CHAPTER - 1) * 86_400_000,
  )
}
