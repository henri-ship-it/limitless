import { journalEntries, type JournalEntry } from '@/content/journal'
import { HUDDLE_QUESTIONS, isHuddleEntry, type Field } from '@/content/entry-fields'
import { overrideFor } from '@/content/entry-overrides'
import { customExercise, linkForEntry } from '@/content/entry-extras'
import { visualForEntry } from '@/content/journal-visuals'
import { eliteJournalEntry } from '@/content/elite-journal'

export type ResolvedEntry = {
  n: number
  week: number
  /** Reads straight off the entry number, so entry 8 is day 8. */
  day: number
  huddle: boolean
  title: string
  intro: string[]
  fields: Field[]
  outro: string[]
  caption: { lines: string[]; author?: string } | null
  visual: { src: string; width: number; height: number; scale: number } | null
  link: { label: string; url: string } | null
  /** True where the page carries a QR code but no link is known yet. */
  awaitingLink: boolean
  hasExercise: boolean
}

/**
 * Brings the parsed page, the corrections and the built exercises together into
 * what the entry page actually renders.
 */
export function resolveEntry(n: number): ResolvedEntry | null {
  const entry: JournalEntry | undefined = journalEntries.find((e) => e.n === n)
  if (!entry) return null

  const override = overrideFor(n)
  const custom = customExercise(n)
  const huddle = isHuddleEntry(n)
  const day = n

  const visual = override?.hideVisual ? null : visualForEntry(n)
  const link = override?.link ?? linkForEntry(n)

  let intro = override?.exercise?.intro ?? entry.intro
  let outro = override?.exercise?.outro ?? entry.outro
  let fields: Field[] = override?.exercise?.fields ?? []

  if (!override?.exercise && !custom) {
    fields = entry.prompts.map((label) => ({ kind: 'text', label }))
  }

  if (override?.hideExercise) {
    intro = []
    outro = []
    fields = []
  }

  // A huddle closes the week with the same reflection every time, and then
  // whatever that week asks on top.
  if (huddle && !override?.hideExercise) {
    fields = [...fields]
  }

  return {
    n,
    week: entry.week,
    day,
    huddle,
    title: override?.title ?? entry.title ?? (huddle ? 'Huddle' : `Day ${day}`),
    intro,
    fields,
    outro,
    caption: override?.caption ?? null,
    visual: visual
      ? { ...visual, scale: override?.visualScale ?? 0.5 }
      : null,
    link,
    awaitingLink: entry.qr && !link,
    hasExercise: Boolean(fields.length || intro.length || custom),
  }
}

export { HUDDLE_QUESTIONS }

/**
 * The same thing for the Elite journal.
 *
 * A separate function rather than a flag on the one above, because the two
 * books only share a shape. Entry five of the weekly journal and entry five of
 * the Elite journal are different exercises on different pages, so resolving an
 * Elite member's entry against the weekly content would quietly show them
 * somebody else's book, with the right number at the top of it.
 *
 * None of the corrections apply. Overrides, custom exercises, cropped artwork
 * and QR links were all measured against the weekly journal by entry number,
 * and reusing them here would attach week three's diagram to whatever Elite
 * happens to number the same. Elite gets the parsed page and nothing else until
 * its own artwork has been cropped.
 */
export function resolveEliteEntry(n: number): ResolvedEntry | null {
  const entry = eliteJournalEntry(n)
  if (!entry) return null

  const huddle = isHuddleEntry(n)

  return {
    n,
    week: entry.week,
    day: n,
    huddle,
    title: entry.title ?? (huddle ? 'Huddle' : `Entry ${n}`),
    intro: entry.intro,
    fields: entry.prompts.map((label) => ({ kind: 'text', label })),
    outro: entry.outro,
    caption: null,
    visual: null,
    link: null,
    awaitingLink: entry.qr,
    hasExercise: Boolean(entry.prompts.length || entry.intro.length),
  }
}
