import { matchSpeaker, sameName, type Speaker } from '../src/lib/speakers'

/**
 * Matching a voice on a recording to a member.
 *
 * Worth holding down because both ways of being wrong are quiet. A speaker
 * nobody matches means that member silently never receives the call. A speaker
 * matched to the wrong person files somebody else's words under their name, and
 * every message they get afterwards is built on it.
 */

const fail: string[] = []
const is = (what: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  if (a !== b) fail.push(`${what}: got ${a}, wanted ${b}`)
}

const member = (id: string, firstName: string | null, recordingName: string | null = null) =>
  ({ id, firstName, recordingName }) satisfies Speaker

// The real cohort, near enough.
const cohort = [
  member('felix', 'Felix'),
  member('bryony', 'Bryony', 'Bry'),
  member('charlie', 'Charlie', 'Chaz'),
]

is('exact name', matchSpeaker('Felix', cohort)?.id, 'felix')
is('different case', matchSpeaker('felix', cohort)?.id, 'felix')
is('surname attached', matchSpeaker('Felix Schon', cohort)?.id, 'felix')
is('spaces around it', matchSpeaker('  Felix  ', cohort)?.id, 'felix')

// What the recorder actually labels people, which is why recording_name exists.
is('the name they go by', matchSpeaker('Chaz', cohort)?.id, 'charlie')
is('and the one on the account', matchSpeaker('Charlie', cohort)?.id, 'charlie')
is('a short one', matchSpeaker('Bry', cohort)?.id, 'bryony')

// Nobody, which must be null rather than a near miss.
is('a stranger', matchSpeaker('Nathan', cohort), null)
is('empty', matchSpeaker('', cohort), null)
is('whitespace', matchSpeaker('   ', cohort), null)

/*
 * Chris is on every one of these calls and is not a member of it. He is kept
 * out by being an admin rather than by name, but a two letter prefix would
 * reach him from "Ch", so the floor is three.
 */
is('two letters match nobody', matchSpeaker('Ch', cohort), null)
is('and neither does one', matchSpeaker('C', cohort), null)

/*
 * The expensive failure. Two members whose names start the same way must give
 * nobody rather than whichever was found first.
 */
const ambiguous = [member('chris-m', 'Christine'), member('chrissy', 'Chrissy')]
is('two people could be Chris', matchSpeaker('Chris', ambiguous), null)
is('but the full name is not ambiguous', matchSpeaker('Christine', ambiguous)?.id, 'chris-m')

// A recording name wins, because it exists only where the first name did not.
const clash = [member('a', 'Samuel', 'Sam'), member('b', 'Sam')]
is('recording name is preferred', matchSpeaker('Sam', clash)?.id, 'a')

// Members with no name at all must never match anything.
const nameless = [member('ghost', null), member('felix', 'Felix')]
is('a nameless member is skipped', matchSpeaker('Felix', nameless)?.id, 'felix')
is('and matches no label', matchSpeaker('Someone', nameless), null)

// The predicate itself, at its edges.
is('three letters is the floor', sameName('Cha', 'Charlie'), true)
is('two is not', sameName('Ch', 'Charlie'), false)
is('a prefix only, never the middle', sameName('arlie', 'Charlie'), false)
is('either way round', sameName('Charlie', 'Cha'), true)

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('speakers: all checks pass')
