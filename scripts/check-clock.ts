/**
 * The programme clock, now that it is a member's rather than the cohort's.
 *
 * Worth holding down because the two cases pull in opposite directions. A
 * cohort starts on a Monday and a member starting on a Wednesday must not be
 * snapped back to one, or their second week opens five days in. And a member
 * who has paid without choosing a date must not inherit the cohort's, or they
 * are handed sixteen weeks that started months ago.
 *
 * The flags are cleared before the module is read, since both of them short
 * circuit the answers this checks and either may be set in a local env file.
 */
process.env.UNLOCK_ALL_WEEKS = ''
delete process.env.PREVIEW_WEEK

async function main() {
const {
  COHORT_CLOCK,
  clockFor,
  currentWeek,
  entryForToday,
  isUnlocked,
  unlockedThrough,
  weekReleaseDate,
  weekStartDate,
} = await import('../src/lib/cohort')

let failures = 0

function is(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (!ok) {
    failures += 1
    console.error(`✗ ${label}: got ${JSON.stringify(got)}, wanted ${JSON.stringify(want)}`)
  } else {
    console.log(`✓ ${label}`)
  }
}

const day = (d: Date) => d.toISOString().slice(0, 10)
const at = (d: Date) => d.toISOString().slice(0, 16) + 'Z'

// ---- the cohort, which must not have moved ----

is('the cohort starts on a Monday', new Date(`${COHORT_CLOCK.start}T00:00:00Z`).getUTCDay(), 1)
is('week 1 starts on the cohort date', day(weekStartDate(1)), COHORT_CLOCK.start)
is('week 2 is seven days later', day(weekStartDate(2)), '2026-09-07')
is('week 16 is fifteen weeks later', day(weekStartDate(16)), '2026-12-14')

// 16:00 UK the day before, which is 15:00 UTC in summer and 16:00 in winter.
is('week 1 opens at 16:00 BST', at(weekReleaseDate(1)), '2026-08-30T15:00Z')
is('week 9 opens at 16:00 GMT', at(weekReleaseDate(9)), '2026-10-25T16:00Z')

// ---- a member on their own clock ----

const wednesday = clockFor({ programmeStartDate: '2027-03-10', digestSendHour: null })

is('their week 1 is their own day', day(weekStartDate(1, wednesday)), '2027-03-10')
is('their week 2 is the next Wednesday', day(weekStartDate(2, wednesday)), '2027-03-17')
is('no snapping back to a Monday', weekStartDate(1, wednesday).getUTCDay(), 3)
is('their chapter opens the evening before', at(weekReleaseDate(1, wednesday)), '2027-03-09T16:00Z')

const earlyBird = clockFor({ programmeStartDate: '2027-03-10', digestSendHour: 7 })
is('an hour of their choosing', at(weekReleaseDate(1, earlyBird)), '2027-03-09T07:00Z')

// ---- a member who has not chosen ----

const unstarted = clockFor({ programmeStartDate: null, digestSendHour: null })
const nobody = { start: null, releaseHour: 16 }

is('a cohort member falls back to the cohort', unstarted.start, COHORT_CLOCK.start)
is('no start date, no week', currentWeek(new Date(), nobody), 0)
is('no start date, nothing open', unlockedThrough(new Date(), false, nobody), 0)
is('not even week one', isUnlocked(1, false, new Date(), nobody), false)
is('an admin still gets a look', unlockedThrough(new Date(), true, nobody), 1)

// ---- where they are within a week ----

const midweek = new Date('2027-03-12T09:00:00Z') // the Friday of their week 1
is('three days in is the third entry', entryForToday(1, midweek, wednesday), 3)
is('before it begins, the first', entryForToday(1, new Date('2027-03-01'), wednesday), 1)
is('long after, the last', entryForToday(1, new Date('2027-06-01'), wednesday), 7)

// ---- week 1 is open from the day the platform goes live ----

const soon = clockFor({ programmeStartDate: '2099-01-05', digestSendHour: null })
is('a start date ahead still opens week 1', unlockedThrough(new Date(), false, soon), 1)
is('and nothing past it', isUnlocked(2, false, new Date(), soon), false)

if (failures) {
  console.error(`\n${failures} failed`)
  process.exit(1)
}
console.log('\nclock holds')
}

// Wrapped, because the import has to happen after the flags above are cleared
// and this file is transformed to CommonJS, where top level await is not a
// thing.
void main()
