import { STYLES, type Style, styleFor } from '@/content/know-thyself'

/**
 * Turns four category scores into something worth reading.
 *
 * A single winning style is the least interesting thing in the numbers. What
 * people recognise themselves in is the shape: whether one style runs away
 * with it or two sit together, and which one they reach for least. All of that
 * is here rather than in the page, so the result someone reads on screen and
 * the result that lands in their inbox can never drift apart.
 */

export type Ranked = { style: Style; value: number }

export type Shape = 'pronounced' | 'leaning' | 'blended'

export type Profile = {
  ranked: Ranked[]
  lead: Style
  support: Style
  shadow: Style
  /** Points between the leading style and the one behind it. */
  gap: number
  shape: Shape
  /** One sentence naming the shape, for the top of a result. */
  summary: string
}

/**
 * How far ahead the leading style has to be before it is fair to call it the
 * way somebody works, rather than one of two things they do.
 */
const PRONOUNCED = 15
const BLENDED = 6

export function profileFrom(scores: Record<string, number>): Profile | null {
  const ranked = Object.entries(scores)
    .map(([name, value]) => ({ style: styleFor(name), value }))
    .filter((row): row is Ranked => Boolean(row.style))
    .sort((a, b) => b.value - a.value)

  if (ranked.length < 2) return null

  const lead = ranked[0].style
  const support = ranked[1].style
  const shadow = ranked[ranked.length - 1].style
  const gap = ranked[0].value - ranked[1].value

  const shape: Shape = gap >= PRONOUNCED ? 'pronounced' : gap < BLENDED ? 'blended' : 'leaning'

  /*
   * Everybody has all four. These sentences describe where somebody sits on a
   * continuum, under the conditions they answered in, and never which of the
   * four they are. A result that tells a reader what they are is wrong about
   * the instrument as well as unkind.
   *
   * They also say it straight. An earlier version hedged every sentence with
   * "today" and "at the moment", which reads as the result not trusting
   * itself. The caveat belongs in the line at the bottom of the page that
   * says these are tendencies, once, not in every sentence.
   */
  const summary =
    shape === 'pronounced'
      ? `You lean towards ${lead.name} much more than the rest. It is the one that shows first.`
      : shape === 'blended'
        ? `${lead.name} and ${support.name} sit level. Which one you reach for depends on the room.`
        : `${lead.name} leads, with ${support.name} close enough behind to show under pressure.`

  return { ranked, lead, support, shadow, gap, shape, summary }
}

/** The styles in their canonical order, for anything that lists all four. */
export function allStyles(): Style[] {
  return STYLES
}
