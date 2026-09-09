/**
 * Elite, which is also sold as Elevate: the same programme over a year.
 *
 * The chapters are the twelve Limitless chapters, one a month rather than one a
 * week, with the deload weeks gone. A deload exists because four weeks of a new
 * framework a week is too much; a month per chapter is already the deload, so
 * putting one in would be a month of nothing.
 *
 * Twenty eight entries to a month rather than seven, across four printed
 * journals. The digest is the same idea written to a month: one long piece
 * rather than a weekly note, with the work broken into four weeks against the
 * journal.
 *
 * No alumni framing anywhere. Elite was once for people who had finished
 * Limitless and the copy assumed it. It is open to anyone now, so nothing here
 * may imply they have already done something else.
 */

export type EliteMonth = {
  n: number
  title: string
  /** First and last entry of the month, inclusive. */
  firstEntry: number
  lastEntry: number
  /** Which of the four printed journals carries it. */
  volume: number
}

export const ELITE = {
  label: 'Elite',
  /** The other name it is sold under. Same programme, same content. */
  alias: 'Elevate',
  months: 12,
  entriesPerMonth: 28,
  volumes: 4,
  /*
   * Month 1 begins on this date. Elite runs to its own clock rather than the
   * sixteen week cohort's, because a member starts when they start.
   */
  startDate: '2026-08-31',
  digest: 'Monthly, on the first of the month',
} as const

/** One chapter a month, in the order the printed journals run. */
export const eliteMonths: EliteMonth[] = [
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
  firstEntry: i * ELITE.entriesPerMonth + 1,
  lastEntry: (i + 1) * ELITE.entriesPerMonth,
  // Three months to a printed journal, which is how they were bound.
  volume: Math.floor(i / 3) + 1,
}))

export const ELITE_ENTRIES = ELITE.months * ELITE.entriesPerMonth

export function eliteMonth(n: number): EliteMonth | undefined {
  return eliteMonths.find((m) => m.n === n)
}

/** The month an entry belongs to. */
export function monthForEntry(entry: number): EliteMonth | undefined {
  return eliteMonths.find((m) => entry >= m.firstEntry && entry <= m.lastEntry)
}

/** The first day of a month of the programme, counted from the start date. */
export function eliteMonthStart(n: number): Date {
  const start = new Date(`${ELITE.startDate}T00:00:00Z`)
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + (n - 1), start.getUTCDate()))
}

/**
 * Which month is open. Zero before the start, thirteen once the year is done,
 * the same way the weekly programme reports either end.
 */
export function currentEliteMonth(now: Date = new Date()): number {
  let month = 0
  for (let n = 1; n <= ELITE.months; n += 1) {
    if (now.getTime() >= eliteMonthStart(n).getTime()) month = n
  }
  return month
}

export function formatEliteMonth(n: number): string {
  return eliteMonthStart(n).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
