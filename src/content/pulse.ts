import { getModule, getWeek, weeks, type Tier } from './programme'

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

/** The last chapter week of each module. */
export const PULSE_WEEKS = [3, 7, 11, 15]

export function isPulseWeek(week: number, tier: Tier): boolean {
  /*
   * The sixteen week journal only. Elite and Elevate run a year of four
   * books on their own cadence and have their own check-ins with Chris, so
   * dropping this on them would be asking twice.
   */
  if (tier !== 'core' && tier !== 'pro') return false
  return PULSE_WEEKS.includes(week)
}

export type Pulse = {
  week: number
  /** Which of the four this is, for the counter. */
  nth: number
  module: number
  moduleTitle: string
  /** The three chapters being asked about, in order. */
  chapters: { number: number; title: string }[]
}

export function pulseFor(week: number): Pulse | undefined {
  if (!PULSE_WEEKS.includes(week)) return undefined
  const module = getModule(getWeek(week)?.module ?? 0)
  if (!module) return undefined
  const chapters = weeks
    .filter((w) => w.module === module.number && w.type === 'chapter')
    .map((w) => ({ number: w.number, title: w.title }))
  return {
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

/** Four or more means the follow-up goes looking for what worked. */
export const WENT_WELL = 4
