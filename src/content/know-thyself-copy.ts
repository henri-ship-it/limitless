/**
 * The Know Thyself copy, as it was actually published.
 *
 * Taken verbatim from the ScoreApp result page on 24 November 2026, before the
 * assessment moved in house, so nobody reading their result here gets a
 * paraphrase of what they would have got there. The landing copy below is from
 * the live assessment page and matches the three steps printed in the journal.
 *
 * This sits apart from `know-thyself.ts` on purpose. That file holds the short
 * characterisations the digests, blueprint and admin drafts write from, which
 * are Chris's internal shorthand. This is the member facing writing. Changing
 * one should not silently change the other.
 */

export type StyleCopy = {
  /** The one line definition that heads a style on the result. */
  definition: string
  /** The two "you" statements under it. */
  marks: [string, string]
  /** The overplay warning, printed as BE CAREFUL. */
  careful: string
  /** Three questions that pull someone out of their default. */
  counterWeights: [string, string, string]
}

export const STYLE_COPY: Record<string, StyleCopy> = {
  dynamo: {
    definition:
      'This natural preference screams determination, pushing through barriers, and taking direct action.',
    marks: [
      'You set yourself a challenge, refusing to be deterred by obstacles',
      'You speak your mind, urging yourself and others to keep pushing',
    ],
    careful:
      'Don’t be all gas, no brakes. Your biggest risk is fatigue and burnout. Your approach can sometimes come across as all-or-nothing, rude, and overbearing.',
    counterWeights: [
      'What process could I improve?',
      'How do I feel about this?',
      'How might I think differently about this?',
    ],
  },
  analyst: {
    definition:
      'This style is about meticulous planning, analysing every detail, and following a structured approach.',
    marks: [
      'You plan everything to the small details, using logical thinking to plot your approach',
      'Everything is analysed, methodical and detailed, leaving nothing to chance',
    ],
    careful:
      'Don’t overthink it. You can be too rigid and stuck in your ways. Tune into your intuition and emotions to get the most out of your situations.',
    counterWeights: [
      'What do I want to achieve?',
      'What’s important to me?',
      'Who might give me a different perspective?',
    ],
  },
  caretaker: {
    definition:
      'This preference revolves around empathy, reflection, and uplifting those around you.',
    marks: [
      'You offer support and encouragement to those around you, fostering a positive community',
      'You understand the importance of self-care and reflection in what you do',
    ],
    careful:
      'Don’t be too much of a people pleaser. Confront the conflict that might push you forward. If you find yourself saying ‘yes’ more than ‘no’, zoom out for perspective and consider what might be best for you.',
    counterWeights: [
      'What does success look like?',
      'What is the plan?',
      'What energy do I need to bring to this situation?',
    ],
  },
  energiser: {
    definition:
      'This preference exudes enthusiasm, interaction, and revelling in the journey.',
    marks: [
      'You radiate positivity, engaging with those around you and motivating them to push beyond limits',
      'Your energy is infectious, creating a ripple of passion, positivity and enthusiasm within your community',
    ],
    careful:
      'Don’t get distracted. Do you find yourself starting things before finishing others? Dial in your focus and remind yourself of your mission.',
    counterWeights: [
      'What are the next steps?',
      'What process could I improve?',
      'What is most important to me?',
    ],
  },
}

/** The opening of the result, which is the same whoever is reading it. */
export const RESULT_INTRO = [
  'Your behavioural style is how you act and do things in your daily life.',
  'There are four common behavioural styles, each valuable in their own way. Seeing your strengths and where you might overdo them, helps you optimise your approach across different contexts.',
  'Under pressure, there’s a greater risk of being fixated to your natural way of thinking. This becomes a problem when your style isn’t favourable for the context.',
]

/**
 * The three steps from the live assessment page, which are the same three
 * printed beside the QR code in the journal.
 */
export const STEPS: { title: string; detail: string }[] = [
  {
    title: 'Complete the assessment',
    detail:
      'Be yourself and answer honestly to find out your behavioural preference style',
  },
  {
    title: 'View detailed results',
    detail:
      'Learn how your style allows you to perform at your best when it most matters',
  },
  {
    title: 'Unlock your potential',
    detail:
      'Understand and explore other ways of tackling challenges to improve your performance',
  },
]

/**
 * Kept word for word from the published assessment. It is the line that says
 * this is reflection rather than a psychometric, so it is not ours to tidy.
 */
export const DISCLAIMER =
  'This self-assessment is for personal insight and reflection only. It is not an official or professionally certified test. For formal evaluation, please get in touch.'
