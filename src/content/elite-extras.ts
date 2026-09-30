import type { Field } from './entry-fields'

/**
 * Things the printed Elite page carries that no parser can lift out of it.
 *
 * Hand written, and kept apart from elite-overrides for that reason: those are
 * generated from a review of the parse and would overwrite anything typed in
 * beside them. Two kinds of thing live here.
 *
 * The links behind the QR codes, which are printed as a square of dots and are
 * a URL to everybody except a text extractor.
 *
 * And the exercises the book draws rather than writes. A page that prints ten
 * traits with a scale beside each one is ten ratings and one question, not
 * eleven questions, and the difference is whether a member can record what the
 * page asks them to record.
 */

/** Replaces the QR code printed in the corner of an entry. */
export const eliteLinks: Record<number, { label: string; url: string }> = {
  1: {
    label: 'Take the Know Thyself assessment',
    url: 'https://unlock.lmntaryperformance.com/know-thyself',
  },
}

/**
 * Exercises whose fields are not all plain writing boxes.
 *
 * Given in full, including the plain prompts, because a page is easier to check
 * against the print when it is all in one place.
 */
export const eliteExercises: Record<
  number,
  { intro?: string[]; fields: Field[]; outro?: string[] }
> = {
  /*
   * Ten traits, each rated one to ten, then one question about the set. The
   * parser saw eleven lines of text and no writing space under the ten, so it
   * filed them as framing and left nowhere to put a score.
   */
  /*
   * A year grid to shade in. There is nothing to type, so the page came through
   * blank, which tells a member nothing about what it is for. The instruction
   * goes back and the note says where the grid is.
   */
  309: {
    intro: [
      'Anticipate the ebbs and flows of work and wellbeing over the coming year. Identify when to push forward and when to recharge by shading in the boxes:',
    ],
    fields: [{ kind: 'note', text: 'The grid for this one is in your printed journal.' }],
  },
  /* A month of calendars, marked up the same way and blank for the same reason. */
  315: {
    intro: [
      'Build restoration into your monthly planning before you need it. Strategic recovery prevents fatigue and amplifies your next sprint.',
    ],
    fields: [{ kind: 'note', text: 'The calendars for this one are in your printed journal.' }],
  },
  165: {
    intro: ['Review the ten traits of realistic optimists. For each, rate yourself 1 to 10:'],
    fields: [
      { kind: 'scale', label: 'Selective focus: disciplined, purposeful, intentional' },
      { kind: 'scale', label: 'Set realistic goals: measurable, attainable, structured' },
      { kind: 'scale', label: 'Keep perspective: objective, level headed, contextual' },
      { kind: 'scale', label: 'Emphasise positives: strengths based, encouraging, solution oriented' },
      { kind: 'scale', label: 'Use humour: playful, approachable, relatable' },
      { kind: 'scale', label: 'Rationality: logical, reasoned, evidence based' },
      { kind: 'scale', label: 'Self improvement: ambitious, reflective, proactive' },
      { kind: 'scale', label: 'Experimentation: innovative, curious, open minded' },
      { kind: 'scale', label: 'Personal responsibility: dependable, self reliant, integrity focused' },
      { kind: 'scale', label: 'Select their environment: intentional, selective, thoughtful' },
      { kind: 'text', label: 'Which traits are your strengths? Which need work?' },
    ],
  },
}

export function eliteLinkFor(n: number) {
  return eliteLinks[n] ?? null
}

export function eliteExerciseFor(n: number) {
  return eliteExercises[n] ?? null
}
