import { getModule, getWeek, weeks, type Tier } from './programme'
import { ELITE, eliteChapter } from './elite'

/**
 * The module check-in.
 *
 * Three chapters, then a deload week. This asks the one question worth asking
 * at the end of those three, in the week they finish them, while it is still
 * in their hands.
 *
 * **Why weeks 3, 7, 11 and 15 and not 4, 8, 12, 16.** The deload week is the
 * one with the workshop in it, and by then the chapters are a fortnight old.
 * Asked on the last chapter week, somebody is answering about work they did
 * this week.
 *
 * **Why it is one tap.** Every extra field costs responses, and the thing we
 * are short of is not scores, it is sentences. So the score is a single tap
 * that cannot be got wrong, and the writing is offered afterwards, once
 * somebody has already said yes to answering. Nothing is required and the
 * whole thing can be dismissed.
 *
 * **Why the follow-up splits.** A happy member and an unhappy one are being
 * asked different questions. "What landed?" from somebody who scored it five
 * is the sentence that ends up on the site. "What was missing?" from somebody
 * who scored it two is the thing Chris needs to know this week rather than in
 * four months. Asking both the same bland question gets neither.
 */

/** The last chapter week of each module, on the sixteen week journal. */
export const PULSE_WEEKS = [3, 7, 11, 15]

/**
 * The chapters the year long journal asks on: 1, 4, 8 and 12.
 *
 * Henri asked for months 1, 4, 8 and 14. The first three are chapters 1, 4
 * and 8, because an Elite chapter is twenty eight days and runs a month. The
 * fourth is not: the programme is twelve chapters over forty eight weeks,
 * which is about eleven months, so there is no month fourteen to ask in. The
 * last chapter is the nearest thing to what he meant, and it is also the one
 * worth having, since it is the only check-in that can ask about the year as
 * a whole.
 *
 * Unlike the sixteen week version these are not module ends. The spacing is
 * deliberately uneven and front-loaded: the first month is where somebody
 * decides whether they have bought the right thing, and a year is long enough
 * that four evenly spaced asks would all land after that decision was made.
 */
export const PULSE_CHAPTERS = [1, 4, 8, ELITE.chapters]

export function isPulseWeek(week: number, tier: Tier): boolean {
  if (tier !== 'core' && tier !== 'pro') return false
  return PULSE_WEEKS.includes(week)
}

export function isPulseChapter(chapter: number, tier: Tier): boolean {
  if (tier !== 'elite' && tier !== 'elevate' && tier !== 'threesixtyfive') return false
  return PULSE_CHAPTERS.includes(chapter)
}

export type Pulse = {
  /**
   * How this one is stored, and the path it posts to.
   *
   * Prefixed because the two journals number differently and both land in the
   * same object: `w3` is the sixteen week journal's third week, `c4` is the
   * year's fourth chapter. Without the prefix a member who moved from Pro to
   * Elite would have chapter 3 overwrite week 3.
   */
  key: string
  week: number
  /** Which of the four this is, for the counter. */
  nth: number
  module: number
  moduleTitle: string
  /** The three chapters being asked about, in order. */
  chapters: { number: number; title: string }[]
}

/**
 * The year long journal's check-in.
 *
 * Asked about the chapter just finished rather than about three of them,
 * because an Elite chapter is a month of work on its own and there is nothing
 * to group it with.
 */
export function elitePulseFor(chapter: number): Pulse | undefined {
  if (!PULSE_CHAPTERS.includes(chapter)) return undefined
  const held = eliteChapter(chapter)
  return {
    key: `c${chapter}`,
    week: chapter,
    nth: PULSE_CHAPTERS.indexOf(chapter) + 1,
    module: held?.module ?? 0,
    moduleTitle: held ? held.title : `chapter ${chapter}`,
    chapters: [],
  }
}

export function pulseFor(week: number): Pulse | undefined {
  if (!PULSE_WEEKS.includes(week)) return undefined
  const module = getModule(getWeek(week)?.module ?? 0)
  if (!module) return undefined
  const chapters = weeks
    .filter((w) => w.module === module.number && w.type === 'chapter')
    .map((w) => ({ number: w.number, title: w.title }))
  return {
    key: `w${week}`,
    week,
    nth: PULSE_WEEKS.indexOf(week) + 1,
    module: module.number,
    moduleTitle: module.name,
    chapters,
  }
}

/**
 * The five points.
 *
 * Labelled rather than numbered, because a bare one to five makes somebody
 * work out what three means. Written as what the three chapters did, not as
 * how satisfied they were, which is a question about their expectations.
 */
export const POINTS = [
  { value: 1, label: 'Not much' },
  { value: 2, label: 'A bit' },
  { value: 3, label: 'Some of it' },
  { value: 4, label: 'A lot' },
  { value: 5, label: 'Changed things' },
] as const

/** The line that opens it, which names the work rather than asking for a favour. */
export function opener(pulse: Pulse): string {
  return `You have finished ${pulse.moduleTitle}.`
}

/** Every key that may be posted, so the route can refuse anything else. */
export const PULSE_KEYS = [
  ...PULSE_WEEKS.map((week) => `w${week}`),
  ...PULSE_CHAPTERS.map((chapter) => `c${chapter}`),
]

/** Which question the check-in asks, which is not the same at both lengths. */
export function question(pulse: Pulse): string {
  if (pulse.chapters.length) return 'Did the last three chapters change anything?'
  return pulse.nth === PULSE_CHAPTERS.length
    ? 'Taking the whole year, did it change anything?'
    : 'Did it change anything?'
}

/** Four or more means the follow-up goes looking for what worked. */
export const WENT_WELL = 4
