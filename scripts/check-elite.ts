import {
  ELITE,
  ELITE_ENTRIES,
  ELITE_WEEKS,
  chapterForEntry,
  chaptersInModule,
  currentEliteChapter,
  currentEliteWeek,
  eliteChapterStart,
  eliteChapters,
  eliteEnd,
  entriesForEliteWeek,
  weekInChapter,
} from '../src/content/elite'

const fail: string[] = []
const is = (what: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  if (a !== b) fail.push(`${what}: got ${a}, wanted ${b}`)
}
const day = (s: string) => new Date(`${s}T12:00:00Z`)

// The shape of the thing, against the printed journals.
is('entries', ELITE_ENTRIES, 336)
is('weeks', ELITE_WEEKS, 48)
is('chapters', eliteChapters.length, 12)
is('chapter 1 entries', [eliteChapters[0].firstEntry, eliteChapters[0].lastEntry], [1, 28])
is('chapter 12 entries', [eliteChapters[11].firstEntry, eliteChapters[11].lastEntry], [309, 336])
is('three chapters to a module', chaptersInModule(1).map((c) => c.n), [1, 2, 3])
is('module 4', chaptersInModule(4).map((c) => c.n), [10, 11, 12])
// Volume 1 of the printed set carries chapters 1 to 3, which is entries 1 to 84.
is('volume 1 ends at entry 84', eliteChapters[2].lastEntry, 84)
is('entry 85 opens volume 2', chapterForEntry(85)?.volume, 2)
is('entry 225 is chapter 9', chapterForEntry(225)?.n, 9)
is('and chapter 9 is Escape From Extinction', chapterForEntry(225)?.title, 'Escape From Extinction')

/*
 * The three members, against where Chris says they actually are. This is the
 * check that matters: the start dates are stored, but what a member sees is
 * derived from them, so an error of one chapter in this arithmetic shows a
 * member the wrong four weeks of their own programme.
 */
const REAL = [
  { who: 'Nathan', start: '2026-02-16', chapter: 9, on: '2026-09-28' },
  { who: 'Matteo', start: '2026-03-09', chapter: 8, on: '2026-09-21' },
  { who: 'Luke', start: '2026-08-31', chapter: 2, on: '2026-09-28' },
]

for (const { who, start, chapter, on } of REAL) {
  is(`${who} is in chapter ${chapter} on ${on}`, currentEliteChapter(start, day(on)), chapter)
  // That day is the first of the chapter, so it is week one of four.
  is(`${who} is in week 1 of the chapter`, weekInChapter(start, day(on)), 1)
  is(`${who}'s chapter ${chapter} opens on ${on}`,
    eliteChapterStart(start, chapter).toISOString().slice(0, 10), on)
}

// Before, during and after, from one member's start.
const luke = '2026-08-31'
is('the day before starting', currentEliteChapter(luke, day('2026-08-30')), 0)
is('the first day', currentEliteChapter(luke, day('2026-08-31')), 1)
is('the last day of chapter 1', currentEliteChapter(luke, day('2026-09-27')), 1)
is('the first day of chapter 2', currentEliteChapter(luke, day('2026-09-28')), 2)
is('the last day of the year', currentEliteChapter(luke, day('2027-08-01')), 12)
is('the day after the year', currentEliteChapter(luke, day('2027-08-02')), 13)
is('the year ends', eliteEnd(luke).toISOString().slice(0, 10), '2027-08-01')

// Weeks run straight through rather than restarting each chapter.
is('week 1', currentEliteWeek(luke, day('2026-08-31')), 1)
is('week 4 is the end of chapter 1', currentEliteWeek(luke, day('2026-09-27')), 4)
is('week 5 is the start of chapter 2', currentEliteWeek(luke, day('2026-09-28')), 5)
is('week in chapter restarts', weekInChapter(luke, day('2026-09-28')), 1)
is('and runs to four', weekInChapter(luke, day('2026-10-19')), 4)

// Seven entries a week, straight through the three hundred and thirty six.
is('week 1 entries', entriesForEliteWeek(1), [1, 2, 3, 4, 5, 6, 7])
is('week 5 opens chapter 2', entriesForEliteWeek(5)[0], 29)
is('week 48 closes the year', entriesForEliteWeek(48), [330, 331, 332, 333, 334, 335, 336])
is('there is no week 49', entriesForEliteWeek(49), [])

// A chapter is twenty eight days, not a calendar month. Starting on the last
// day of August, calendar maths would put chapter 2 on 30 September and drift
// further every chapter; twenty eight days keeps every chapter on a Monday.
is('chapters stay on the weekday they started', ELITE.weeksPerChapter * 7, 28)
const weekdays = new Set(
  eliteChapters.map((c) => eliteChapterStart(luke, c.n).getUTCDay()),
)
is('every chapter opens on the same weekday', weekdays.size, 1)

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('elite: all checks pass')
