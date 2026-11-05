import { isGroupCall, titlePatterns } from '../src/lib/pocket'

/**
 * Which recordings off Chris's recorder reach the platform.
 *
 * Checked because both ways of being wrong are expensive and neither is
 * visible. Too loose and a partnership call or a private catch up is filed
 * against whichever member was named in it, then read back as context when a
 * message is drafted. Too tight and the Wednesday call silently never arrives.
 *
 * The real titles below are the four Pocket actually held on the day this was
 * written, so this is not a hypothetical about what the filter ought to do.
 */

const fail: string[] = []
const is = (what: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  if (a !== b) fail.push(`${what}:\n  got    ${a}\n  wanted ${b}`)
}

// The four that were on the recorder, and which of them belong here.
is('the group call is filed', isGroupCall('Mindset Matters Group Flow State Coaching'), true)
is('a partnership call is not', isGroupCall('Neuroimaging Platform Partnership Discussion'), false)
is('a founder catch up is not', isGroupCall('Ultimate Founder Catch Up'), false)
is('the Pocket onboarding is not', isGroupCall('Getting Started with Pocket'), false)

// Case and spacing, because Pocket writes these titles itself.
is('casing does not matter', isGroupCall('MINDSET MATTERS week 7'), true)
is('surrounding text does not matter', isGroupCall('Recording: mindset matters call'), true)
is('leading space does not matter', isGroupCall('  Mindset Matters  '), true)

/*
 * Failing closed. A recording with no title must not be filed: an untitled one
 * is as likely to be a private call as the group call, and guessing wrong puts
 * somebody else's conversation on a member's record.
 */
is('no title is not filed', isGroupCall(undefined), false)
is('an empty title is not filed', isGroupCall(''), false)
is('a blank title is not filed', isGroupCall('   '), false)
is('a null title is not filed', isGroupCall(null), false)

// A near miss is still a miss, rather than being waved through.
is('half the phrase is not enough', isGroupCall('Mindset Reset Session'), false)
is('the other half is not either', isGroupCall('What Matters Most'), false)

// Configuring it, for when the call gets renamed or a second one starts.
is('the default stands alone', titlePatterns(undefined), ['mindset matters'])
is('an empty setting falls back', titlePatterns(''), ['mindset matters'])
is('a blank setting falls back', titlePatterns('  ,  '), ['mindset matters'])
is('one phrase replaces the default', titlePatterns('weekly huddle'), ['weekly huddle'])
is('several are taken apart', titlePatterns('mindset matters, weekly huddle'), [
  'mindset matters',
  'weekly huddle',
])
is('and are all honoured', isGroupCall('Weekly Huddle 12', titlePatterns('mindset matters, weekly huddle')), true)
is(
  'while everything else still is not',
  isGroupCall('Investor Update', titlePatterns('mindset matters, weekly huddle')),
  false,
)

/*
 * A configured phrase must not open the door to everything. An empty phrase
 * would be a substring of every title, which is why they are filtered out
 * before they are used rather than after.
 */
is('a setting of only commas does not match everything', isGroupCall('Investor Update', titlePatterns(',,,')), false)

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('pocket filter: all checks pass')
