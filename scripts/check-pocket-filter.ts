import { onCallDay, titleAllows, titlePatterns, worthReading } from '../src/lib/pocket'

/**
 * Which of Chris's recordings the platform opens.
 *
 * Checked because both ways of being wrong are expensive and neither is
 * visible. Too loose and a private call is filed against whichever member was
 * named in it, then read back as context when a message is drafted. Too tight
 * and the weekly call silently never arrives.
 *
 * The titles below are the four Pocket actually held on the day this was
 * written. They are here because they show why this is not matched on titles
 * at all: Pocket writes them itself from the content, so the Pro call of the
 * fourth of November came out as "Mindset Matters Group Flow State Coaching",
 * a sentence about that week rather than a name. A filter built on that phrase
 * would have caught that one call and then silently stopped.
 *
 * The second gate, that at least two members are heard on it, lives in
 * fileCall and is checked by scripts/check-speakers.ts.
 */

const fail: string[] = []
const is = (what: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  if (a !== b) fail.push(`${what}:\n  got    ${a}\n  wanted ${b}`)
}

/*
 * The real week. The fourth was a Wednesday and was the Pro call, whatever
 * Pocket decided to call it; the three before it were Chris's own days.
 */
const week = [
  { on: '2026-11-04', title: 'Mindset Matters Group Flow State Coaching', ours: true },
  { on: '2026-11-03', title: 'Neuroimaging Platform Partnership Discussion', ours: false },
  { on: '2026-11-02', title: 'Ultimate Founder Catch Up', ours: false },
  { on: '2026-11-01', title: 'Getting Started with Pocket', ours: false },
]

for (const day of week) {
  is(
    `${day.on} ${day.ours ? 'is opened' : 'is left alone'}`,
    worthReading({ title: day.title, happenedOn: day.on }, []),
    day.ours,
  )
}

/*
 * The day decides, and the title does not come into it. A Wednesday recording
 * is opened whatever Pocket called it, which is the whole point: next week's
 * title will be a sentence about next week.
 */
is('any Wednesday title is opened', worthReading({ title: 'Something Else Entirely', happenedOn: '2026-11-04' }, []), true)
is('an untitled Wednesday is opened', worthReading({ title: null, happenedOn: '2026-11-04' }, []), true)
is('a familiar title on a Tuesday is not', worthReading({ title: 'Mindset Matters', happenedOn: '2026-11-03' }, []), false)

// Wednesdays across month and year ends, where date arithmetic usually goes wrong.
is('a Wednesday at a month end', onCallDay('2026-09-30'), true)
is('a Wednesday either side of new year', onCallDay('2026-12-30'), true)
is('the Thursday after it is not', onCallDay('2026-12-31'), false)
is('a leap day that is not a Wednesday', onCallDay('2028-02-29'), false)

// Every other day of that week, so the day is pinned rather than merely passing.
for (const [day, name] of [
  ['2026-11-08', 'Sunday'],
  ['2026-11-09', 'Monday'],
  ['2026-11-10', 'Tuesday'],
  ['2026-11-11', 'Wednesday'],
  ['2026-11-12', 'Thursday'],
  ['2026-11-13', 'Friday'],
  ['2026-11-14', 'Saturday'],
] as const) {
  is(`${name} ${day}`, onCallDay(day), name === 'Wednesday')
}

// A timestamp rather than a date, which is what the listing actually returns.
is('a full timestamp still reads as Wednesday', onCallDay('2026-11-04T19:02:11.000Z'), true)

// Nothing usable is not a Wednesday, so a missing date files nothing.
is('no date', onCallDay(undefined), false)
is('an empty date', onCallDay(''), false)
is('rubbish', onCallDay('not a date'), false)
is('an impossible date', onCallDay('2026-13-45'), false)

/*
 * The override, for a week the call moves. Unset it changes nothing, so a
 * stray phrase can never quietly widen the day rule.
 */
is('nothing is overridden by default', titlePatterns(undefined), [])
is('an empty override is nothing', titlePatterns(''), [])
is('commas alone are nothing', titlePatterns(' , , '), [])
is('an unset override matches nothing', titleAllows('Mindset Matters', titlePatterns(undefined)), false)
is(
  'and so a Tuesday stays shut',
  worthReading({ title: 'Mindset Matters', happenedOn: '2026-11-03' }, titlePatterns('')),
  false,
)

const moved = titlePatterns('limitless pro')
is('a named call is opened off its day', worthReading({ title: 'Limitless Pro, moved', happenedOn: '2026-11-05' }, moved), true)
is('casing does not matter', titleAllows('LIMITLESS PRO', moved), true)
is('but other calls are still not', worthReading({ title: 'Ultimate Founder Catch Up', happenedOn: '2026-11-02' }, moved), false)
is('and an untitled one off its day is not', worthReading({ title: null, happenedOn: '2026-11-05' }, moved), false)

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('pocket filter: all checks pass')
