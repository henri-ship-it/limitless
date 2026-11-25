/**
 * The baseline and the reflection: what somebody answers at the start of the
 * programme and at the end of it.
 *
 * These replace four ScoreApp questionnaires that had drifted apart. Core ran
 * 38 questions, Pro 61, Elevate 59, and roughly four fifths of them were the
 * same question worded three ways. The post-assessment was 13 satisfaction
 * sliders that shared not one item with any of them.
 *
 * Two things follow from that, and they are the whole design:
 *
 * **One baseline, not four.** What a Core member is asked and what an Elite
 * member is asked turns out to be the same thing. The difference between the
 * products is what happens at the end of it, which is why `ending` is a
 * property of the tier rather than of the questions.
 *
 * **A spine.** The six statements in the first round are worded identically in
 * both journeys. That is the only way a before and after is a before and
 * after. The testimonial bank carries a warning in capitals that the old pre
 * and post figures came from different questionnaires and must never be quoted
 * as a score that moved; this is the fix for that, and from the first cohort
 * that runs both ends of it the numbers are honestly comparable.
 *
 * Six single statements is thin for measurement and worth naming as such: one
 * item per domain is noisier than three would be. It is deliberate. The old
 * post-assessment used exactly these six as single sliders, so keeping them
 * single keeps the twenty-five results already on file comparable, and the
 * length saved goes into the open questions, which is where the useful
 * material actually comes from.
 *
 * No em dashes or en dashes anywhere in the copy. British spelling.
 */

export type Question =
  | {
      kind: 'scale'
      id: string
      /** The statement being agreed or disagreed with. */
      text: string
      /** What this reports under. Also the key it is stored by. */
      domain: string
      low: string
      high: string
    }
  | {
      kind: 'choice'
      id: string
      text: string
      help?: string
      options: string[]
    }
  | {
      kind: 'multi'
      id: string
      text: string
      help?: string
      /** The most that can be picked. The count is shown as they go. */
      limit: number
      options: string[]
    }
  | {
      kind: 'rank'
      id: string
      text: string
      help?: string
      /** How many to pick. The order they are picked in is the ranking. */
      limit: number
      options: string[]
    }
  | {
      kind: 'text'
      id: string
      text: string
      help?: string
      placeholder: string
      /** Long opens a textarea. Short is a single line. */
      length: 'short' | 'long'
      /** A prompt somebody can take or leave; never required. */
      optional?: boolean
    }
  | {
      kind: 'score'
      id: string
      text: string
      help?: string
      /** Nought to ten, as the recommendation question has always been. */
      lowLabel: string
      highLabel: string
    }

export type Round = {
  key: string
  /** Shown on the round's opening card. */
  title: string
  /** One line saying what this round is for. */
  lead: string
  questions: Question[]
  /**
   * What sits between this round and the next.
   *
   * Not decoration. Each one gives something back for what was just handed
   * over: a figure from the group, somebody else's words, or the member's own
   * answer read back to them. A long form with nothing in return is the thing
   * being replaced.
   */
  interstitial?: Interstitial
}

export type Interstitial =
  | { kind: 'stat'; figure: string; of: string; note: string }
  /**
   * `matched` picks the quote from what they have just told us is in the way.
   * A named pain is for the rounds where there is nothing to match on yet.
   */
  | { kind: 'quote'; pain: 'matched' | 'doubt' | 'overthinking' | 'clarity' | 'systems' | 'focus' | 'alone' | 'pressure' }
  | { kind: 'readback'; from: string; frame: string }

export type Journey = {
  slug: string
  title: string
  /** Where a finished run is filed on the member's profile. */
  slot: string
  /** The line under the title on the opening card. */
  lead: string
  /** What somebody is told before they start. */
  steps: { title: string; detail: string }[]
  rounds: Round[]
}

/**
 * The six that are measured twice.
 *
 * Worded as statements rather than as "how satisfied are you with your mental
 * clarity", because a satisfaction question measures how demanding somebody
 * is as much as how they are doing. A statement about the week they have just
 * had is harder to answer sideways.
 *
 * The domain keys are what both journeys store and what the comparison reads.
 * Changing one of these strings breaks every before and after on file.
 */
const SPINE: Question[] = [
  {
    kind: 'scale',
    id: 'performance',
    domain: 'Performance',
    text: 'I am working at the level I know I am capable of.',
    low: 'Not at all',
    high: 'Completely',
  },
  {
    kind: 'scale',
    id: 'clarity',
    domain: 'Clarity',
    text: 'My thinking is clear, and I can hold focus on the thing that matters.',
    low: 'Not at all',
    high: 'Completely',
  },
  {
    kind: 'scale',
    id: 'energy',
    domain: 'Energy',
    text: 'I have the physical energy my days ask of me.',
    low: 'Not at all',
    high: 'Completely',
  },
  {
    kind: 'scale',
    id: 'resilience',
    domain: 'Resilience',
    text: 'When something knocks me off, I get back to level quickly.',
    low: 'Not at all',
    high: 'Completely',
  },
  {
    kind: 'scale',
    id: 'alignment',
    domain: 'Alignment',
    text: 'How I spend my time matches what I say matters to me.',
    low: 'Not at all',
    high: 'Completely',
  },
  {
    kind: 'scale',
    id: 'fulfilment',
    domain: 'Fulfilment',
    text: 'Taken as a whole, I am fulfilled by my life as it is right now.',
    low: 'Not at all',
    high: 'Completely',
  },
]

/** The order the six are reported in, which is the order they are asked. */
export const DOMAINS = SPINE.map((q) => (q.kind === 'scale' ? q.domain : '')).filter(Boolean)

const TIME_BANDS = [
  'Early morning, 5am to 8am',
  'Mid morning, 8am to 11am',
  'Midday, 11am to 2pm',
  'Afternoon, 2pm to 5pm',
  'Evening, 5pm to 8pm',
  'Late evening, after 8pm',
]

/**
 * The ten the old assessment asked as ten separate sliders.
 *
 * Asked as a ranked pick of three instead. Ten sliders tell you somebody
 * thinks everything is important, which is true and useless. Three in order
 * tells you what to work on first.
 */
const AMBITIONS = [
  'Getting more done that actually matters',
  'Handling pressure without it costing me',
  'Making decisions faster and standing behind them',
  'Leading other people better',
  'The relationships closest to me',
  'Physical health and fitness',
  'Mental clarity and focus',
  'Motivation that does not depend on the day',
  'Time spent the way I would choose',
  'Money and business growth',
]

/**
 * The daily challenges, in the members' own language.
 *
 * Rewritten from the ScoreApp list using what people actually wrote in the
 * cohort groups. "Difficulty focusing" was the largest single answer in the
 * old data with 62 mentions, and "I have systems but they do not stick" is 37
 * per cent of respondents, so both are here as their own line rather than
 * buried in a longer list.
 */
const OBSTACLES = [
  'I push on while quietly doubting myself',
  'I overthink until the moment passes',
  'I cannot hold focus for long enough',
  'I have systems, they just do not stick',
  'I am busy with the easy work instead of the real work',
  'I react first and think afterwards',
  'I do not ask for help when it gets hard',
  'I am carrying more than I can recover from',
  'I do not know what to work on next',
  'I say yes to things I should decline',
]

export const BASELINE: Journey = {
  slug: 'baseline',
  /*
   * Not "Your baseline".
   *
   * This is the first thing somebody does after paying, and the word baseline
   * is ours, not theirs: it describes what we get out of it rather than what
   * they get. The title is the sentence that is actually true, which is that
   * the next sixteen weeks are about to be shaped around what they say here.
   */
  title: 'Tell us about you',
  slot: 'baseline',
  lead: 'Fourteen questions, about six minutes. What you say here is what the next sixteen weeks get built around.',
  steps: [
    {
      title: 'This shapes your programme',
      detail:
        'Your answers set your starting point and decide what you get pushed on. The more real they are, the better the fit.',
    },
    {
      title: 'Say it how it actually is',
      detail:
        'Nobody is marking you. A flattering answer only makes it harder to see later how far you have come.',
    },
    {
      title: 'You get it straight back',
      detail:
        'Where you stand, the hours you do your best work in, and what you have said you want out of this.',
    },
  ],
  rounds: [
    {
      key: 'standing',
      title: 'Where you stand',
      lead: 'Six statements about the last month. Not a good month, the one you have just had.',
      questions: SPINE,
      interstitial: {
        kind: 'stat',
        figure: '43%',
        of: 'of people arrive here saying the same thing',
        note: 'They push on while quietly doubting themselves. Whatever you have just scored, you are in better company than you think.',
      },
    },
    {
      key: 'rhythm',
      title: 'Your rhythm',
      lead: 'Most of us plan the day without thinking about when we actually work well. Three questions to find your best hours.',
      questions: [
        {
          kind: 'choice',
          id: 'energised',
          text: 'When are you most energised?',
          options: TIME_BANDS,
        },
        {
          kind: 'choice',
          id: 'sharpest',
          text: 'When is your thinking sharpest?',
          options: TIME_BANDS,
        },
        {
          kind: 'choice',
          id: 'drained',
          text: 'When are you most drained?',
          options: TIME_BANDS,
        },
      ],
      interstitial: {
        kind: 'readback',
        from: 'sharpest',
        frame: 'Your sharpest hours',
      },
    },
    {
      key: 'ambition',
      title: 'What this is for',
      lead: 'Everything feels important until you have to choose. Pick the three that matter most and put them in order.',
      questions: [
        {
          kind: 'rank',
          id: 'priorities',
          text: 'Pick three and put them in order.',
          help: 'Tap them in order. The one you would fix first, first.',
          limit: 3,
          options: AMBITIONS,
        },
      ],
      interstitial: { kind: 'quote', pain: 'clarity' },
    },
    {
      key: 'obstacle',
      title: 'What is in the way',
      lead: 'The harder questions. This is the part Chris reads first.',
      questions: [
        {
          kind: 'multi',
          id: 'obstacles',
          text: 'Which of these sound like you?',
          help: 'Up to three.',
          limit: 3,
          options: OBSTACLES,
        },
        {
          kind: 'text',
          id: 'pattern',
          text: 'Describe the thing that keeps happening.',
          help: 'The thing you have spotted yourself doing and not managed to stop. A few lines is plenty.',
          placeholder: 'Every time I get close to the deadline I...',
          length: 'long',
        },
      ],
      interstitial: { kind: 'quote', pain: 'matched' },
    },
    {
      key: 'deal',
      title: 'The deal',
      lead: 'How much time you really have, and what you want to show for it.',
      questions: [
        {
          kind: 'choice',
          id: 'hours',
          text: 'How much time can you genuinely give this each week?',
          help: 'Give the real number. The programme is built to work for people at the low end.',
          options: [
            'Under an hour',
            'One to two hours',
            'Two to four hours',
            'Four to six hours',
            'More than six hours',
          ],
        },
        {
          kind: 'text',
          id: 'worth',
          text: 'What would make these sixteen weeks worth it?',
          help: 'Finish this: it will have been worth it if, by the end, I...',
          placeholder: 'It will have been worth it if...',
          length: 'long',
        },
      ],
    },
  ],
}

export const REFLECTION: Journey = {
  slug: 'reflection',
  title: 'How did it go?',
  slot: 'reflection',
  lead: 'The same six questions you answered in week one, and room to say what actually happened.',
  steps: [
    {
      title: 'You see how far you have come',
      detail:
        'The six are word for word the ones you started with, so the difference between them is real.',
    },
    {
      title: 'What you write matters more than the scores',
      detail: 'Three questions in the middle. Your answers are the most useful thing we get all year.',
    },
    {
      title: 'It takes about five minutes',
      detail: 'Longer if you want it to. Most people find they have more to say than they expected.',
    },
  ],
  rounds: [
    {
      key: 'standing',
      title: 'Where you stand now',
      lead: 'The same six. Answer for the last month, not for the whole sixteen weeks.',
      questions: SPINE,
      interstitial: {
        kind: 'readback',
        from: '__delta__',
        frame: 'Against where you started',
      },
    },
    {
      /*
       * Chris's own three-part prompt, kept word for word.
       *
       * He ran it weekly through Pro 3.0 and the testimonial bank records
       * that it produced roughly three times the usable material of the open
       * "any wins this week" question it replaced, from a smaller group. It is
       * the single most evidenced thing in the archive, so it is not being
       * improved on here.
       */
      key: 'changed',
      title: 'What actually happened',
      lead: 'Three questions. Worth taking your time over, these are the ones that matter.',
      questions: [
        {
          kind: 'text',
          id: 'insight',
          text: 'What clicked for you?',
          help: 'The thing you understood that you had not understood before.',
          placeholder: 'It finally landed that...',
          length: 'long',
        },
        {
          kind: 'text',
          id: 'win',
          text: 'What did you do differently?',
          help: 'Something you actually did, not something you now believe. The more specific the better.',
          placeholder: 'I started...',
          length: 'long',
        },
        {
          kind: 'text',
          id: 'breakthrough',
          text: 'What shifted in how you see yourself?',
          help: 'This one is usually the hardest to write and the one worth reading.',
          placeholder: 'I used to think...',
          length: 'long',
        },
      ],
      interstitial: {
        kind: 'readback',
        from: 'win',
        frame: 'You did this',
      },
    },
    {
      key: 'others',
      title: 'For the person behind you',
      lead: 'Someone is about to start exactly where you were in week one.',
      questions: [
        {
          kind: 'text',
          id: 'advice',
          text: 'What would you say to them?',
          help: 'Write it to them, not to us.',
          placeholder: 'If you are sitting where I was...',
          length: 'long',
        },
        {
          kind: 'multi',
          id: 'valuable',
          text: 'Which parts did the work?',
          help: 'Up to three.',
          limit: 3,
          options: [
            'The physical journal',
            'The masterclass videos',
            'The weekly digests',
            'The live workshops',
            'The drop-in calls',
            'The group',
            'The one to one time with Chris',
          ],
        },
        {
          kind: 'score',
          id: 'recommend',
          text: 'How likely are you to recommend Limitless to someone like you?',
          lowLabel: 'Not at all',
          highLabel: 'Without hesitation',
        },
        {
          kind: 'text',
          id: 'anything',
          text: 'Anything else?',
          help: 'Including anything that did not work. That is more useful than praise.',
          placeholder: 'Optional',
          length: 'long',
          optional: true,
        },
      ],
    },
  ],
}

export const JOURNEYS: Journey[] = [BASELINE, REFLECTION]

export function journeyFor(slug: string): Journey | undefined {
  return JOURNEYS.find((journey) => journey.slug === slug)
}

/** Every question in a journey, flattened, in the order they are asked. */
export function questionsOf(journey: Journey): Question[] {
  return journey.rounds.flatMap((round) => round.questions)
}

/** How many questions there are, for the progress bar. */
export function lengthOf(journey: Journey): number {
  return questionsOf(journey).length
}

/**
 * The six domain scores from a finished set of answers.
 *
 * Nought to a hundred, the same scale the rest of the platform reports in, so
 * a baseline bar and a Know Thyself bar mean the same thing.
 */
export function spineScores(answers: Record<string, unknown>): Record<string, number> {
  const scores: Record<string, number> = {}
  for (const question of SPINE) {
    if (question.kind !== 'scale') continue
    const value = answers[question.id]
    if (typeof value === 'number' && Number.isFinite(value)) {
      scores[question.domain] = Math.round(value)
    }
  }
  return scores
}

export type Movement = {
  domain: string
  before: number
  after: number
  /** After minus before. Negative is a fall and is shown as one. */
  change: number
}

/**
 * The before and after, per domain.
 *
 * Only domains answered at both ends are returned. A member who never sat a
 * baseline gets a reflection with no comparison rather than a comparison
 * against nothing, which would read as a fall from zero.
 */
export function movement(
  before: Record<string, number>,
  after: Record<string, number>,
): Movement[] {
  return DOMAINS.filter((domain) => domain in before && domain in after).map((domain) => ({
    domain,
    before: before[domain],
    after: after[domain],
    change: after[domain] - before[domain],
  }))
}

/** The domain that moved most, which is what a result leads on. */
export function biggestMove(moves: Movement[]): Movement | undefined {
  return [...moves].sort((a, b) => b.change - a.change)[0]
}
