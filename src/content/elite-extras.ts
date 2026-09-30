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
  // The motivation check-in, taken twice so the second can be read against the
  // first. Same assessment both times.
  113: {
    label: 'Take the Light the Fire assessment',
    url: 'https://unlock.lmntaryperformance.com/light-the-fire',
  },
  137: {
    label: 'Take the Light the Fire assessment',
    url: 'https://unlock.lmntaryperformance.com/light-the-fire',
  },
}

/** The step of the optimism stairway that each of its four entries closes on. */
const scoreGauge: Field = {
  kind: 'gauge',
  label: 'Based on this, score the likelihood of your ideal outcome happening',
}

/** Three figures off the motivation assessment, recorded as percentages. */
const motivationResults: Field[] = [
  { kind: 'note', text: 'Add your three results below.' },
  { kind: 'percent', label: 'Control' },
  { kind: 'percent', label: 'Competence' },
  { kind: 'percent', label: 'Connectedness' },
]

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
  /*
   * The page says "scan the QR code and plot them below". The QR is rendered as
   * a link button instead, so repeating the instruction sends a member looking
   * for a square of dots that is not on the screen.
   */
  1: {
    intro: [],
    fields: [{ kind: 'text', label: 'What does this reveal about how you operate?' }],
  },
  /*
   * Three questions rated one to ten, which the page says in as many words and
   * the parser could not act on.
   */
  85: {
    intro: ['How to win at self-talk. Rate yourself 1 to 10 for each, 1 being low and 10 being high:'],
    fields: [
      { kind: 'scale', label: 'How open and accepting are you towards your thoughts and emotions?' },
      {
        kind: 'scale',
        label: 'How much do you try to push away difficult thoughts or avoid unwanted emotions?',
      },
      {
        kind: 'scale',
        label: 'How much do you engage in behaviours aligned with your values and goals?',
      },
    ],
  },
  /* The motivation check-in. Three percentages off the assessment, then two questions. */
  113: {
    intro: ['Take the assessment and add your results below:'],
    fields: [
      ...motivationResults,
      { kind: 'text', label: 'Does this reflect how you feel on a daily basis?' },
      {
        kind: 'text',
        label: 'What is one small way you could boost your lowest scoring need this month?',
      },
    ],
  },
  /* The same check-in again, read against the first. */
  137: {
    intro: ['Take the assessment again and add your results below:'],
    fields: [
      ...motivationResults,
      {
        kind: 'text',
        label: 'Have you noticed any changes in your motivation drivers? Look back at entry 113.',
      },
      { kind: 'text', label: 'One key takeaway to remember going forward?' },
    ],
  },
  /*
   * The four steps of the optimism stairway. Each closes on a score set on a
   * gauge, which the book draws as a slider and the parser read as a prompt
   * with the word SCORE for a label.
   */
  141: {
    fields: [
      { kind: 'text', label: 'Identify an ideal outcome you’re working towards:' },
      { kind: 'text', label: 'What’s the best case scenario?' },
      { kind: 'text', label: 'What are the potential obstacles?' },
      scoreGauge,
    ],
  },
  147: {
    /*
     * The book says "Entry 43" here, which is where this exercise begins in the
     * weekly journal. In this one it begins at 141, so the printed reference
     * sends a member to a page about something else.
     */
    intro: ['With the challenge from entry 141 in mind, list your available resources:'],
    fields: [
      { kind: 'line', label: 'Skills' },
      { kind: 'line', label: 'Time' },
      { kind: 'line', label: 'Support' },
      scoreGauge,
    ],
  },
  153: {
    fields: [
      { kind: 'text', label: 'Create a detailed action plan for your challenge:' },
      { kind: 'text', label: 'For each step, write down how you’ll take full responsibility:' },
      { kind: 'text', label: 'Craft a positive, realistic narrative about your approach:' },
      scoreGauge,
    ],
  },
  159: {
    fields: [
      { kind: 'text', label: 'Recall a past success. What lessons can you apply to your challenge?' },
      { kind: 'text', label: 'What strengths will you draw on?' },
      scoreGauge,
    ],
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
