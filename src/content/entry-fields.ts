/**
 * The kinds of field a journal entry can ask for.
 *
 * Most entries are a prompt and a box to write in, which the parser handles on
 * its own. Some ask for something else: a percentage from an assessment, a
 * rating out of ten, a score on a gauge, or a handful of short lines rather
 * than one long box. Those are described here and set per entry in
 * entry-overrides.ts.
 */
export type Field =
  /** A prompt with room to write. The default. */
  | { kind: 'text'; label: string; step?: number }
  /** A prompt answered in a few words. */
  | { kind: 'line'; label: string; step?: number }
  /** Several short lines under one prompt, numbered. */
  | { kind: 'lines'; label: string; count: number; step?: number }
  /** A figure from an assessment, shown as a percentage. */
  | { kind: 'percent'; label: string }
  /** A rating from one to ten. */
  | { kind: 'scale'; label: string }
  /** A score set on a gauge, as the book draws it. */
  | { kind: 'gauge'; label: string }
  /** Guidance, not something to fill in. */
  | { kind: 'note'; text: string }
  /** A heading with its own fields beneath. */
  | { kind: 'group'; label: string; fields: Field[] }

/** The three questions that close every week, in place of the daily schedule. */
export const HUDDLE_QUESTIONS = [
  'What have you learnt over the last week?',
  'What impact has this had?',
  'What do you need to continue to focus on?',
]

/** Every seventh entry closes its week. */
export function isHuddleEntry(n: number): boolean {
  return n % 7 === 0
}
