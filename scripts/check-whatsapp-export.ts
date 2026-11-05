import { dateOrder, parseChatExport } from '../src/lib/whatsapp-export'

/**
 * Reading a WhatsApp export.
 *
 * Checked because every way this fails is silent. A header pattern that misses
 * turns a whole export into one enormous message. A date read the wrong way
 * round moves every message by months and nothing looks wrong. A continuation
 * line dropped loses all but the first line of anything somebody wrote with a
 * paragraph break in it, which on a group chat is most of what is worth having.
 */

const fail: string[] = []
const is = (what: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got)
  const b = JSON.stringify(want)
  if (a !== b) fail.push(`${what}:\n  got    ${a}\n  wanted ${b}`)
}

// iOS, which brackets the header.
const ios = [
  '[23/09/2026, 14:32:11] Charlie: Morning all',
  '[23/09/2026, 14:33:02] Bryony: Found this week hard going',
  '[24/09/2026, 09:01:44] Felix: Same here',
].join('\n')

is('ios senders', parseChatExport(ios).map((m) => m.sender), ['Charlie', 'Bryony', 'Felix'])
is('ios dates', parseChatExport(ios).map((m) => m.sentOn), [
  '2026-09-23',
  '2026-09-23',
  '2026-09-24',
])
is('ios text', parseChatExport(ios)[1].text, 'Found this week hard going')

// Android, which uses a dash and no brackets.
const android = [
  '23/09/2026, 14:32 - Charlie: Morning all',
  '23/09/2026, 14:33 - Bryony: Found this week hard going',
].join('\n')
is('android senders', parseChatExport(android).map((m) => m.sender), ['Charlie', 'Bryony'])
is('android dates', parseChatExport(android).map((m) => m.sentOn), ['2026-09-23', '2026-09-23'])

// Twelve hour clocks, including the narrow no-break space WhatsApp uses.
const twelveHour = [
  '23/09/2026, 2:32 pm - Charlie: Afternoon',
  '23/09/2026, 2:33 PM - Bryony: Hello',
].join('\n')
is('twelve hour clock', parseChatExport(twelveHour).map((m) => m.sender), ['Charlie', 'Bryony'])

// Two digit years.
is(
  'two digit year',
  parseChatExport('23/09/26, 14:32 - Charlie: Hi')[0].sentOn,
  '2026-09-23',
)

/*
 * The date order. A day above twelve anywhere settles the whole file, so a
 * message sent on the fifth of a month is read correctly because of one sent on
 * the twenty third.
 */
const dayFirst = ['23/09/2026, 14:32 - A: x', '05/09/2026, 14:32 - B: y']
const monthFirst = ['09/23/2026, 14:32 - A: x', '09/05/2026, 14:32 - B: y']
is('day first is detected', dateOrder(dayFirst), 'dmy')
is('month first is detected', dateOrder(monthFirst), 'mdy')
is('an ambiguous file reads as British', dateOrder(['05/09/2026, 14:32 - A: x']), 'dmy')
is('and the ambiguous line follows the file', parseChatExport(dayFirst.join('\n'))[1].sentOn, '2026-09-05')
is('month first parses as month first', parseChatExport(monthFirst.join('\n'))[1].sentOn, '2026-09-05')

// A message over several lines, where only the first carries a header.
const multiline = [
  '[23/09/2026, 14:32:11] Bryony: Three things came up this week',
  '',
  'One was the sleep thing again',
  'The other two I am still sitting with',
  '[23/09/2026, 14:40:00] Charlie: Makes sense',
].join('\n')
const parsed = parseChatExport(multiline)
is('a multi line message stays one message', parsed.length, 2)
is(
  'and keeps all of its lines',
  parsed[0].text,
  'Three things came up this week\nOne was the sleep thing again\nThe other two I am still sitting with',
)

// What WhatsApp writes itself, which is nobody speaking.
const noisy = [
  '[23/09/2026, 14:00:00] Chris: Messages and calls are end-to-end encrypted. No one outside of this chat can read them.',
  '[23/09/2026, 14:32:11] Charlie: <Media omitted>',
  '[23/09/2026, 14:33:00] Charlie: This message was deleted',
  '[23/09/2026, 14:34:00] Charlie: Actual words',
].join('\n')
is('noise is dropped', parseChatExport(noisy).map((m) => m.text), ['Actual words'])

/*
 * But only the exact phrases. Somebody typing those words themselves is still
 * a person speaking and must not disappear from their own record.
 */
is(
  'a real sentence containing the words survives',
  parseChatExport('[23/09/2026, 14:00:00] Felix: This message was deleted by accident and I retyped it')
    .length,
  1,
)

// A name with a colon in it, which the header must not split on early.
is(
  'a time inside the text',
  parseChatExport('[23/09/2026, 14:32:11] Charlie: call at 14:00 then')[0].text,
  'call at 14:00 then',
)

// Nothing at all.
is('an empty file', parseChatExport(''), [])
is('a file of blank lines', parseChatExport('\n\n\n'), [])

/*
 * A file whose first line is not a header. Without the guard this writes to
 * index minus one and throws, which on an upload is a five hundred rather than
 * a message saying the file was not what was expected.
 */
is('leading junk does not throw', parseChatExport('some stray line\nanother'), [])

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log('whatsapp export: all checks pass')
