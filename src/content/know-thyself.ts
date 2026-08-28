/**
 * The four behavioural styles the Know Thyself scorecard measures.
 *
 * The icons are the ones printed in the journal, so a style reads the same on
 * a profile as it does on the page a member filled in.
 */
export type Style = {
  key: string
  name: string
  icon: string
  /** How they tend to come across, in a line. */
  reads: string
  /** What lands with them, which is the useful part when writing to someone. */
  respondsTo: string
}

export const STYLES: Style[] = [
  {
    key: 'dynamo',
    name: 'Dynamo',
    icon: '/know-thyself/dynamo.svg',
    reads: 'Direct, quick to decide, impatient with detail.',
    respondsTo: 'Get to the point. Lead with the outcome, keep it short.',
  },
  {
    key: 'energiser',
    name: 'Energiser',
    icon: '/know-thyself/energiser.svg',
    reads: 'Outgoing, enthusiastic, driven by people and possibility.',
    respondsTo: 'Warmth and momentum. Name the person, not the process.',
  },
  {
    key: 'caretaker',
    name: 'Caretaker',
    icon: '/know-thyself/caretaker.svg',
    reads: 'Steady, loyal, uncomfortable with sudden change.',
    respondsTo: 'Reassurance and time. Ask rather than push.',
  },
  {
    key: 'analyst',
    name: 'Analyst',
    icon: '/know-thyself/analyst.svg',
    reads: 'Precise, evidence led, wary of overclaiming.',
    respondsTo: 'Specifics and reasoning. Nothing that sounds like hype.',
  },
]

/** Matches a score name from the scorecard to a style, however it was labelled. */
export function styleFor(name: string): Style | undefined {
  const clean = name.toLowerCase().replace(/[^a-z]/g, '')
  return STYLES.find((s) => clean.includes(s.key))
}

/** The style someone leads with, from their scores. */
export function leadStyle(scores: Record<string, number>): Style | undefined {
  const ranked = Object.entries(scores)
    .map(([name, value]) => ({ style: styleFor(name), value }))
    .filter((row): row is { style: Style; value: number } => Boolean(row.style))
    .sort((a, b) => b.value - a.value)

  return ranked[0]?.style
}
