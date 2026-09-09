import { resolveEntry } from './entry'
import { customExercise } from '@/content/entry-extras'
import { HUDDLE_QUESTIONS } from '@/content/entry-fields'
import type { EntryData } from '@/content/journal-fields'

/**
 * What somebody actually wrote in an entry, as labelled answers.
 *
 * Only the exercise. The schedule, the three intentions and the list of
 * achievements are the admin of running a day: useful to the person running it,
 * and nothing to build a message on. A draft written off somebody's calendar
 * reads as a report on their diary rather than a note about their work.
 *
 * The trap this exists to close is `values`. Entry 8 asks members to tick every
 * value that appeals, then to narrow that list to two. `data.values` is the
 * first pass, which for one member ran to fifty one of the fifty one on the
 * page, and the two that are actually theirs live in the custom fields. Read
 * the wrong one and a member is told their values are "connection and
 * consistency" when what they chose was authenticity and independence: every
 * word on the page, none of it theirs.
 */

export type Answer = { label: string; text: string }

/** The two values somebody settled on, which is the pair that means anything. */
export function coreValues(data: EntryData): string[] {
  const custom = data.fields ?? {}
  return ['custom.0', 'custom.1']
    .map((key) => String(custom[key] ?? '').trim())
    .filter(Boolean)
}

/**
 * Labels an exercise answer with the question it answers.
 *
 * A wall of unlabelled paragraphs is worse than useless to a model: it cannot
 * tell a description of a good day from a list of things somebody wants to stop
 * doing, and it guesses.
 */
function labelFor(n: number, key: string): string {
  const entry = resolveEntry(n)

  if (key.startsWith('custom.')) {
    const i = Number(key.slice('custom.'.length))
    return customExercise(n)?.fields[i] ?? 'Answer'
  }

  const i = Number(key)
  const field = Number.isInteger(i) ? entry?.fields[i] : undefined
  if (field && field.kind !== 'note' && field.kind !== 'group') return field.label
  return 'Answer'
}

/** Everything they wrote for the exercise on one entry, question by question. */
export function exerciseAnswers(n: number, data: EntryData): Answer[] {
  const out: Answer[] = []

  for (const [key, value] of Object.entries(data.fields ?? {})) {
    const text = typeof value === 'string' ? value.trim() : ''
    if (text) out.push({ label: labelFor(n, key), text })
  }

  // The huddle closes a week and is the most reflective thing anybody writes.
  ;(data.huddle ?? []).forEach((answer, i) => {
    const text = String(answer ?? '').trim()
    if (text) out.push({ label: HUDDLE_QUESTIONS[i] ?? 'Huddle', text })
  })

  /*
   * The three review questions. Short, daily, and the only place a mood shows
   * up, so they are worth having even though they are not the exercise proper.
   */
  for (const [key, label] of [
    ['win', 'One win'],
    ['mind', 'On their mind'],
    ['grateful', 'Grateful for'],
  ] as const) {
    const text = String(data[key] ?? '').trim()
    if (text) out.push({ label, text })
  }

  return out
}
