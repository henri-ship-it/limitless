import { eliteJournalEntries } from '../src/content/elite-journal'
import { eliteTitles } from '../src/content/elite-titles'

/**
 * Every Elite page has a title, and every title is set the same way.
 *
 * The book leaves most of its pages untitled, so the names come from two places
 * and drifted apart: the parser title-cases what it finds, the written ones were
 * written by hand, and thirty three of those lowercased words the parser would
 * have capitalised. "Doing over Saying" beside "Tendency Over Destiny" is the
 * sort of thing nobody sees one at a time and everybody sees in a list.
 */

const SMALL = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with',
  'your', 'you', 'it', 'is', 'as', 'at', 'but', 'by', 'from',
])

/** The house form: title case, with the small words left down after the first. */
function houseStyle(title: string): string {
  return title
    .split(' ')
    .map((word, i) => {
      const bare = word.replace(/,+$/, '')
      const tail = word.slice(bare.length)
      const lower = bare.toLowerCase()
      const cased = i && SMALL.has(lower) ? lower : lower.charAt(0).toUpperCase() + lower.slice(1)
      return cased + tail
    })
    .join(' ')
}

const fail: string[] = []

for (const entry of eliteJournalEntries) {
  const huddle = entry.n % 7 === 0
  const title = entry.title ?? eliteTitles[entry.n]

  if (!title && !huddle) {
    fail.push(`entry ${entry.n} has no title`)
    continue
  }
  if (!title) continue

  if (title !== houseStyle(title)) {
    fail.push(`entry ${entry.n}: "${title}" should be "${houseStyle(title)}"`)
  }
  if (/[?;—–]/.test(title)) {
    fail.push(`entry ${entry.n}: "${title}" carries punctuation a heading should not`)
  }
}

// A written title for a page that has a printed one is dead weight, and the two
// will disagree the first time the book is re-exported.
for (const n of Object.keys(eliteTitles).map(Number)) {
  const entry = eliteJournalEntries.find((e) => e.n === n)
  if (!entry) fail.push(`written title for entry ${n}, which does not exist`)
  else if (entry.title) fail.push(`entry ${n} has a printed title, so the written one is unused`)
}

if (fail.length) {
  console.error('FAILED\n' + fail.join('\n'))
  process.exit(1)
}
console.log(`elite titles: all checks pass (${eliteJournalEntries.length} entries)`)
