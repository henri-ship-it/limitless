/**
 * What closes a week.
 *
 * Worth a check rather than an eyeball because the week tick is now read off
 * the journal instead of set by hand: an off by one here would close week two
 * when somebody wrote the first entry of week three, and nothing in the
 * interface would look wrong.
 */
import { closingEntry, entryNumbers, isWritten, weekTick } from '../src/lib/week-close'

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

is('week 1 runs entries 1 to 7', entryNumbers(1), [1, 2, 3, 4, 5, 6, 7])
is('week 2 starts at 8', entryNumbers(2)[0], 8)
is('week 16 ends at 112', entryNumbers(16)[6], 112)
is('a week off the end has no entries', entryNumbers(17), [])

is('week 1 closes on entry 7', closingEntry(1), 7)
is('week 16 closes on entry 112', closingEntry(16), 112)
is('every closing entry is a seventh', [1, 5, 9, 16].map(closingEntry), [7, 35, 63, 112])
is('a week off the end has no close', closingEntry(17), null)

// An entry nobody has opened.
is('nothing written', isWritten(1, null), false)
is('an empty entry', isWritten(1, {}), false)
/*
 * The one that matters. Opening an entry saves the day's admin whether or not
 * the exercise was answered, so a schedule and three intentions must not read
 * as the week being closed.
 */
is(
  'the day’s admin alone',
  isWritten(7, { intentions: ['a', 'b', 'c'], blocks: [], achievements: ['x'] }),
  false,
)
is('an answered exercise', isWritten(1, { fields: { '0': 'what I wrote' } }), true)
is('blank answers', isWritten(1, { fields: { '0': '   ' } }), false)
is('a written huddle', isWritten(7, { huddle: ['went well', '', ''] }), true)
is('an empty huddle', isWritten(7, { huddle: ['', '', ''] }), false)

// What a huddle save does to the week's tick.
is('writing it closes the week', weekTick(false, true), 'set')
is('still written, still closed', weekTick(true, true), 'set')
is('taking it back opens the week', weekTick(true, false), 'clear')
/*
 * The one that protects the cohort already running. Their weeks were ticked by
 * the old rule that watched them read the digest, so their huddles are blank,
 * and saving a blank one must not take the tick off them.
 */
is('a blank huddle leaves the tick alone', weekTick(false, false), 'leave')

if (failures) {
  console.error(`\n${failures} failed`)
  process.exit(1)
}
console.log('\nweek close holds')
