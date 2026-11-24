/**
 * The assessments, rebuilt in the platform after ScoreApp.
 *
 * Every question here is a sliding scale, which is what both printed-journal
 * assessments use and the only type they have ever used. Scores are a percent
 * of the scale per category, which is how ScoreApp computed them, so a result
 * filed from here is the same shape as one that arrived on the webhook and
 * everything reading a profile keeps working untouched.
 *
 * Generated from the ScoreApp export of 24 November 2026. The slugs are the
 * paths the printed QR codes point at and cannot change.
 */

export type Scale = {
  /** The statement someone is agreeing or disagreeing with. */
  text: string
  /** The category this statement scores into. */
  category: string
}

export type Assessment = {
  /** The path under the assessments domain. Printed in the journals. */
  slug: string
  title: string
  /** Where a finished result is filed on the member's profile. */
  slot: string
  /** Categories in the order they are reported. */
  categories: string[]
  low: string
  high: string
  questions: Scale[]
}

export const ASSESSMENTS: Assessment[] = [
  {
    slug: 'know-thyself',
    title: 'Know Thyself',
    slot: 'scorecard',
    categories: ['Dynamo', 'Analyst', 'Caretaker', 'Energiser'],
    low: 'Disagree',
    high: 'Agree',
    questions: [
      { text: 'I express my opinions openly and assertively.', category: 'Dynamo' },
      { text: 'I thrive when working under pressure and tight deadlines.', category: 'Dynamo' },
      { text: 'I enjoy competing and measuring my success against others.', category: 'Dynamo' },
      { text: 'I am comfortable confronting problems directly.', category: 'Dynamo' },
      { text: 'I actively seek out opportunities to lead projects or teams.', category: 'Dynamo' },
      { text: 'I enjoy activities that are fast-paced and straightforward.', category: 'Dynamo' },
      { text: 'I take charge and demand results in a situation.', category: 'Dynamo' },
      { text: 'I prefer working independently and relying on my practical skills.', category: 'Dynamo' },
      { text: 'I am determined and strong willed in my pursuits.', category: 'Dynamo' },
      { text: 'I prioritise logic and facts in decision-making processes.', category: 'Analyst' },
      { text: 'I enjoy breaking down complex issues into manageable parts.', category: 'Analyst' },
      { text: 'I approach problems by gathering and analysing relevant information.', category: 'Analyst' },
      { text: 'I value logic and reasoning over intuition when making choices.', category: 'Analyst' },
      { text: 'I often anticipate potential obstacles and plan ahead.', category: 'Analyst' },
      { text: 'I delve into specifics and ensure accuracy in my work.', category: 'Analyst' },
      { text: 'I am organised and thorough in planning and executing tasks.', category: 'Analyst' },
      { text: 'I approach situations with a serious and thoughtful demeanour.', category: 'Analyst' },
      { text: 'I value adhering to structure and detail in my work.', category: 'Analyst' },
      { text: 'I am faithful and trusting in my relationships with others.', category: 'Caretaker' },
      { text: 'I am the first to offer support when someone needs help.', category: 'Caretaker' },
      { text: 'I often put the needs of the team before my own.', category: 'Caretaker' },
      { text: 'I willingly adapt to accommodate others\' needs.', category: 'Caretaker' },
      { text: 'I find fulfilment in nurturing others\' growth or wellbeing.', category: 'Caretaker' },
      { text: 'I place importance on caring for and empathising with others\' feelings.', category: 'Caretaker' },
      { text: 'I naturally offer compassion and encouragement to those around me.', category: 'Caretaker' },
      { text: 'I am reflective and soft-spoken in my interactions.', category: 'Caretaker' },
      { text: 'I am sincere and modest in my interactions with others.', category: 'Caretaker' },
      { text: 'I am open and imaginative.', category: 'Energiser' },
      { text: 'I am quick to build rapport with new acquaintances.', category: 'Energiser' },
      { text: 'I bring enthusiasm to teams and social gatherings.', category: 'Energiser' },
      { text: 'I enjoy motivating others to join in activities or causes.', category: 'Energiser' },
      { text: 'I often encourage others to see the bright side of challenges.', category: 'Energiser' },
      { text: 'I am charismatic and persuasive in social situations.', category: 'Energiser' },
      { text: 'I am expressive and talkative when engaging with others.', category: 'Energiser' },
      { text: 'I am naturally energised and drawn to collaborative efforts.', category: 'Energiser' },
      { text: 'I enjoy being popular and entertaining in social settings.', category: 'Energiser' },
    ],
  },
  {
    slug: 'light-the-fire',
    title: 'Light The Fire',
    slot: 'lightTheFire',
    categories: ['Control', 'Competence', 'Connectedness'],
    low: 'Disagree',
    high: 'Agree',
    questions: [
      { text: 'I feel like I am free to decide for myself how to live my life.', category: 'Control' },
      { text: 'I really like the people I interact with.', category: 'Connectedness' },
      { text: 'I often feel competent.', category: 'Competence' },
      { text: 'I feel at ease in my life.', category: 'Control' },
      { text: 'People I know tell me I am good at what I do.', category: 'Competence' },
      { text: 'I get along with people I come into contact with.', category: 'Connectedness' },
      { text: 'I’m highly social and have a wide network of connections.', category: 'Connectedness' },
      { text: 'I generally feel free to express my ideas and opinions.', category: 'Control' },
      { text: 'I consider the people I regularly interact with to be my friends.', category: 'Connectedness' },
      { text: 'I have been able to learn interesting new skills recently.', category: 'Competence' },
      { text: 'In my daily life, I make my own decisions and chart my own course.', category: 'Control' },
      { text: 'People in my life care about me.', category: 'Connectedness' },
      { text: 'Most days I feel a sense of accomplishment from what I do.', category: 'Competence' },
      { text: 'People I interact with on a daily basis tend to take my feelings into consideration.', category: 'Control' },
      { text: 'In my life, I regularly demonstrate my capabilities and strengths.', category: 'Competence' },
      { text: 'I have many close relationships and a strong support network.', category: 'Connectedness' },
      { text: 'I feel like I can pretty much be myself in my daily situations.', category: 'Control' },
      { text: 'The people I interact with regularly seem to genuinely like and appreciate me.', category: 'Connectedness' },
      { text: 'I often feel highly capable and confident in my abilities.', category: 'Competence' },
      { text: 'I have plenty of opportunities to decide for myself how to do things in my daily life.', category: 'Control' },
      { text: 'People are generally pretty friendly towards me.', category: 'Connectedness' },
    ],
  },
]

export function assessmentFor(slug: string): Assessment | undefined {
  return ASSESSMENTS.find((a) => a.slug === slug)
}

/**
 * Category percentages, the way ScoreApp worked them out.
 *
 * Each answer is already a 0-100 position on the scale, so a category is the
 * mean of its own statements. Unanswered statements are left out rather than
 * counted as zero, which would quietly punish anyone who skipped one.
 */
export function scoreAssessment(
  assessment: Assessment,
  answers: Record<number, number>,
): Record<string, number> {
  const totals: Record<string, { sum: number; count: number }> = {}
  for (const category of assessment.categories) totals[category] = { sum: 0, count: 0 }

  assessment.questions.forEach((question, index) => {
    const answer = answers[index]
    if (!Number.isFinite(answer)) return
    const bucket = totals[question.category]
    if (!bucket) return
    bucket.sum += answer
    bucket.count += 1
  })

  const scores: Record<string, number> = {}
  for (const [category, { sum, count }] of Object.entries(totals)) {
    if (count) scores[category] = Math.round(sum / count)
  }
  return scores
}
