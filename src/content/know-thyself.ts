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
  /** The one line summary printed on the style card. */
  overview: string
  /** Where this style wins, and nobody else quite does. */
  differentiator: string
  /** What it stops them seeing. */
  blindspot: string
  /** What it costs them at scale. */
  bottleneck: string
}

export const STYLES: Style[] = [
  {
    key: 'dynamo',
    name: 'Dynamo',
    icon: '/know-thyself/dynamo.svg',
    reads: 'Direct, quick to decide, impatient with detail.',
    respondsTo: 'Get to the point. Lead with the outcome, keep it short.',
    overview: 'The starter. Energised by novelty and possibility.',
    differentiator: 'Launches. Turnarounds. Breaks through inertia.',
    blindspot: 'Completion. Mistakes starting for finishing.',
    bottleneck: 'Scale. Brilliant starts become organisational chaos.',
  },
  {
    key: 'energiser',
    name: 'Energiser',
    icon: '/know-thyself/energiser.svg',
    reads: 'Outgoing, enthusiastic, driven by people and possibility.',
    respondsTo: 'Warmth and momentum. Name the person, not the process.',
    overview: 'The inspirer. Energised by influence and impact.',
    differentiator: 'Change management. Turns sceptics into advocates.',
    blindspot: 'Substance. Mistakes performance for leadership.',
    bottleneck: "Persistence. Empty charisma when inspiration isn't enough.",
  },
  {
    key: 'caretaker',
    name: 'Caretaker',
    icon: '/know-thyself/caretaker.svg',
    reads: 'Steady, loyal, uncomfortable with sudden change.',
    respondsTo: 'Reassurance and time. Ask rather than push.',
    overview: 'The harmoniser. Energised by connection and helping others.',
    differentiator: 'Culture. Builds loyalty and psychological safety.',
    blindspot: 'Conflict. Mistakes niceness for leadership.',
    bottleneck: 'Standards. Kindness without clarity breeds mediocrity.',
  },
  {
    key: 'analyst',
    name: 'Analyst',
    icon: '/know-thyself/analyst.svg',
    reads: 'Precise, evidence led, wary of overclaiming.',
    respondsTo: 'Specifics and reasoning. Nothing that sounds like hype.',
    overview: 'The thinker. Energised by complexity and understanding.',
    differentiator: 'High-stakes decisions. Spots risks others miss.',
    blindspot: 'Action. Optimises into paralysis.',
    bottleneck: 'Speed. Perfect later loses to good enough now.',
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
