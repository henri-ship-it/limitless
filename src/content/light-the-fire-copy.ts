/**
 * Light The Fire, the motivation check-in.
 *
 * Taken verbatim from the ScoreApp result page on 25 November 2026, before the
 * assessment moved in house. Printed in the 16-week journal on pages 51 and
 * 71, and taken twice on purpose so the second reading can be read against the
 * first.
 *
 * **It leads on the lowest score, not the highest.** That is the opposite of
 * Know Thyself and it is deliberate: the three are needs rather than traits,
 * and the one somebody is shortest of is the one worth doing something about.
 * Anything built on top of this should keep that round the right way.
 */

export type Component = {
  key: string
  name: string
  /** The short definition printed under the name. */
  reads: string
  /** Why it matters, in the words the assessment used. */
  detail: string
  /** The question to sit with, printed under each one. */
  prompt: string
}

/** In the order the result lists them, which is not the scored order. */
export const COMPONENTS: Component[] = [
  {
    key: 'control',
    name: 'Control',
    reads: 'The autonomy over your life',
    detail:
      'Control fuels intrinsic motivation and personal accountability for your actions and outcomes.',
    prompt: 'How can you be more deliberate with what you do and how you do it?',
  },
  {
    key: 'competence',
    name: 'Competence',
    reads: 'The ability to make progress',
    detail:
      'Competence satisfies your innate need for growth, boosting confidence and encouraging continued effort.',
    prompt: 'How can you make progress inevitable?',
  },
  {
    key: 'connectedness',
    name: 'Connectedness',
    reads: 'The feeling like you belong',
    detail:
      'Connectedness fulfils your social needs, providing emotional support and a sense of shared purpose that enhances overall well-being and motivation.',
    prompt: 'Who can I bring on my journey?',
  },
]

export function componentFor(name: string): Component | undefined {
  const clean = name.toLowerCase().replace(/[^a-z]/g, '')
  return COMPONENTS.find((component) => clean.includes(component.key))
}

/** The opening of the result, the same for everybody. */
export const FIRE_INTRO = [
  'Here’s how you scored across the three components of motivation.',
  'Take the time to read through your results and reflect on where you can find alignment.',
]

/** What the result leads with, naming the shortest of the three. */
export function lowestOf(scores: Record<string, number>): Component | undefined {
  const ranked = Object.entries(scores)
    .map(([name, value]) => ({ component: componentFor(name), value }))
    .filter((row): row is { component: Component; value: number } => Boolean(row.component))
    .sort((a, b) => a.value - b.value)
  return ranked[0]?.component
}

/**
 * What everybody else scored, from all 123 finished ScoreApp sittings, read
 * through the Open API on 25 November 2026. Medians, with the middle half
 * beside them.
 *
 * | Component     | n   | mean | median | p25 | p75 |
 * |---------------|-----|------|--------|-----|-----|
 * | Control       | 121 | 70.4 | 74     | 61  | 82  |
 * | Competence    | 121 | 70.2 | 73     | 62  | 82  |
 * | Connectedness | 121 | 70.7 | 74     | 63  | 83  |
 *
 * Unlike Know Thyself, these three sit almost on top of each other, within a
 * point of one another. So the comparison here is less about which component
 * runs high in general and more about how far somebody is from a group that
 * scores motivation high across the board. The whole middle half sits above
 * sixty, which is worth knowing before telling anybody their 58 is a shortfall.
 */
export const FIRE_NORMS: Record<string, number> = {
  Control: 74,
  Competence: 73,
  Connectedness: 74,
}

export const FIRE_RANGE: Record<string, { p25: number; p75: number }> = {
  Control: { p25: 61, p75: 82 },
  Competence: { p25: 62, p75: 82 },
  Connectedness: { p25: 63, p75: 83 },
}

/** Finished sittings behind the figures; each component scored on 121 of them. */
export const FIRE_BASE = 123
