/**
 * Things the printed page carries that the parser cannot lift out as text:
 * the assessment links behind each QR code, and the list of values on the
 * Decode Your Values entry, which is set as artwork in the book.
 */

/**
 * Replaces the QR code printed in the corner of an entry. Only three entries
 * carry one.
 */
export const entryLinks: Record<number, { label: string; url: string } | null> = {
  1: {
    label: 'Take the Know Thyself assessment',
    url: 'https://unlock.lmntaryperformance.com/know-thyself',
  },
  // Motivation check-in, weeks 6 and 8. Same assessment both times.
  36: null,
  52: null,
}

export function linkForEntry(n: number) {
  return entryLinks[n] ?? null
}

/**
 * Entry 8, Decode Your Values. The book prints these as a grid to circle, so
 * on screen they are ticked instead and the free text box is dropped.
 */
export const VALUES = [
  'Accountability', 'Achievement', 'Adaptability', 'Adventure', 'Altruism', 'Ambition',
  'Authenticity', 'Balance', 'Beauty', 'Being the best', 'Belonging', 'Career', 'Caring',
  'Collaboration', 'Commitment', 'Community', 'Compassion', 'Competence', 'Confidence',
  'Connection', 'Contentment', 'Contribution', 'Cooperation', 'Courage', 'Creativity',
  'Curiosity', 'Dignity', 'Diversity', 'Environment', 'Efficiency', 'Equality', 'Ethics',
  'Excellence', 'Fairness', 'Faith', 'Family', 'Financial stability', 'Forgiveness',
  'Freedom', 'Friendship', 'Fun', 'Future generations', 'Generosity', 'Giving back',
  'Grace', 'Gratitude', 'Growth', 'Harmony', 'Health', 'Home', 'Honesty', 'Hope',
  'Humility', 'Humour', 'Inclusion', 'Independence', 'Initiative', 'Integrity', 'Intuition',
  'Job security', 'Joy', 'Justice', 'Kindness', 'Knowledge', 'Leadership', 'Learning',
  'Legacy', 'Leisure', 'Love', 'Loyalty', 'Making a difference', 'Nature', 'Openness',
  'Optimism', 'Order', 'Parenting', 'Patience', 'Patriotism', 'Peace', 'Perseverance',
  'Personal fulfilment', 'Power', 'Pride', 'Recognition', 'Reliability', 'Resourcefulness',
  'Respect', 'Responsibility', 'Risk-taking', 'Safety', 'Security', 'Self-discipline',
  'Self-expression', 'Self-respect', 'Serenity', 'Service', 'Simplicity', 'Spirituality',
  'Sportsmanship', 'Stewardship', 'Success', 'Teamwork', 'Time', 'Tradition', 'Travel',
  'Trust', 'Truth', 'Understanding', 'Uniqueness', 'Usefulness', 'Vision', 'Vulnerability',
  'Wealth', 'Well-being', 'Wholeheartedness', 'Wisdom',
] as const

/**
 * Entries whose exercise is built rather than rendered from the parsed prompts.
 * Where one exists it replaces the prompts entirely.
 */
export type CustomExercise = {
  /** Shown above the picker as guidance, not as something to write in. */
  guidance: string[]
  /** Sets up the fields that follow the picker. */
  fieldsIntro?: string
  /** Short fields that follow the picker. */
  fields: string[]
  picker: 'values'
}

export const CUSTOM_EXERCISES: Record<number, CustomExercise> = {
  8: {
    guidance: [
      'Does this define me? Is this who I am at my best? Is this a filter that I use to make hard decisions?',
    ],
    fieldsIntro:
      'From those selected, condense your values down to the two that resonate most with you.',
    fields: ['Value one', 'Value two'],
    picker: 'values',
  },
}

export function customExercise(n: number): CustomExercise | null {
  return CUSTOM_EXERCISES[n] ?? null
}
