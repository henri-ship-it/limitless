// Limitless 16-week programme structure for cohort 4.0.
// Chapter copy is taken from LP_Limitless_Journal_Combined_01.pdf, which is the
// source of truth for chapter names, entry numbering and deload spacing.

export type Tier = 'core' | 'pro'
export type WeekType = 'chapter' | 'deload'

export type Module = {
  number: 1 | 2 | 3 | 4
  slug: string
  name: string
  summary: string
  weeks: number[]
}

export type Week = {
  number: number
  module: 1 | 2 | 3 | 4
  title: string
  type: WeekType
  /** Behavioural framework this chapter teaches. Null on deload weeks. */
  topic: string | null
  /** Opening paragraphs, printed on the chapter divider in the journal. */
  opening: string[]
  /** Deload weeks recap the three chapters that preceded them. */
  recap?: string[]
  quote?: { text: string; author: string }
  /** Unlisted YouTube masterclass. Deload weeks have no masterclass. */
  youtubeId: string | null
  /** First journal entry number for the week. Each week runs seven entries. */
  firstEntry: number
}

export const COHORT = {
  label: '4.0',
  /** Week 1 begins on this Monday. Everything else is derived from it. */
  startDate: '2026-08-31',
  onboardingWeekStart: '2026-08-24',
  onboardingCall: {
    date: '2026-08-26',
    time: '12:00 to 12:45 UK',
  },
  /** Digests are released ahead of each week. */
  digestDay: 'Sunday evening',
  /** The standing Pro group call. Every week, same slot. */
  dropIn: {
    day: 'Wednesday',
    time: '11:30 to 12:00 BST',
    short: 'Wednesdays, 11:30 BST',
  },
  assessmentUrl: 'https://unlock.lmntaryperformance.com/know-thyself',
  postAssessmentUrl: 'https://unlock.lmntaryperformance.com/post-assessment',
} as const

export const modules: Module[] = [
  {
    number: 1,
    slug: 'learn',
    name: 'Learn',
    summary:
      'Unlock your blindspots, discover how your mind operates and turn your unique differences into a competitive edge.',
    weeks: [1, 2, 3, 4],
  },
  {
    number: 2,
    slug: 'manage',
    name: 'Manage',
    summary:
      'Transform your inner dialogue into a source of sustainable drive, from mental resistance to psychological resilience.',
    weeks: [5, 6, 7, 8],
  },
  {
    number: 3,
    slug: 'nurture',
    name: 'Nurture',
    summary:
      'Design an environment that makes excellence inevitable by mastering deep focus and creating an ecosystem that fuels your performance.',
    weeks: [9, 10, 11, 12],
  },
  {
    number: 4,
    slug: 'thrive',
    name: 'Thrive',
    summary:
      'Build unstoppable momentum through strategic reflection and goal-setting while mastering the integration of mind and body for lasting excellence.',
    weeks: [13, 14, 15, 16],
  },
]

export const weeks: Week[] = [
  {
    number: 1,
    module: 1,
    title: 'Know Thyself',
    type: 'chapter',
    topic: 'Personality',
    opening: [
      'It’s easy to believe we have a full picture of our own personalities. After all, who could know you better than yourself?',
      'The truth is, our self-awareness is often flawed and not what we think. Your blindspots hold potential. Reveal them, and you uncover new possibilities.',
      'This chapter is about understanding how to leverage your strengths, uncover your blindspots, and align your actions with what truly drives you.',
    ],
    quote: {
      text: 'The cave you fear to enter holds the treasure you seek.',
      author: 'Joseph Campbell',
    },
    youtubeId: 'rRJmJfykNbc',
    firstEntry: 1,
  },
  {
    number: 2,
    module: 1,
    title: 'Your Moral Code',
    type: 'chapter',
    topic: 'Values',
    opening: [
      'It’s easy to feel like your actions lack meaning, as if you’re stuck on a treadmill going nowhere.',
      'The truth is, what you do every day defines who you are, not just what you say you believe or intend to do. Without clear values, your actions can quickly feel empty and aimless.',
      'Values are the foundation that guide us, helping us embody what truly matters. This chapter is about identifying your core values and ensuring your actions align with them. It’s about living your philosophy, every single day.',
    ],
    quote: { text: '', author: 'Epictetus' },
    youtubeId: '9T2wDgYFMZQ',
    firstEntry: 8,
  },
  {
    number: 3,
    module: 1,
    title: 'Superhuman Potential',
    type: 'chapter',
    topic: 'Strengths',
    opening: [
      'There’s an assumption that in order to achieve excellence, we need to fix our weaknesses.',
      'But most of us don’t fall short because of our weaknesses. We fall short because we fail to harness our strengths.',
      'And when we do activate our strengths, we often push them too far. Excellence turns to excess, and our superpowers become our kryptonite.',
      'The magic happens in the sweet spot, where innate talents are amplified, but not overextended.',
      'Your untapped potential is a sleeping giant. It’s time to wake it up.',
    ],
    quote: {
      text: 'I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.',
      author: 'Bruce Lee',
    },
    youtubeId: 'UqR51p5mrdg',
    firstEntry: 15,
  },
  {
    number: 4,
    module: 1,
    title: 'Module 01 Deload',
    type: 'deload',
    topic: null,
    opening: [
      'This week, we revisit what you’ve learnt, strengthen what’s working, and evaluate what isn’t.',
    ],
    recap: [
      'Broaden your awareness and unearth what makes you tick.',
      'Set your values and define your guiding principles.',
      'Leverage your unique point of difference.',
    ],
    quote: {
      text: 'Who looks outside, dreams. Who looks inside, awakes.',
      author: 'Carl Jung',
    },
    youtubeId: null,
    firstEntry: 22,
  },
  {
    number: 5,
    module: 2,
    title: 'The Mindful Maverick',
    type: 'chapter',
    topic: 'Psychological flexibility',
    opening: [
      'Psychological flexibility is a superpower. It’s the ability to adapt to life’s twists and turns while staying true to your values.',
      'Flexible thinking isn’t about shutting down difficult or negative thoughts. It’s about developing the ability to regulate them.',
      'This chapter explores how to be present in the moment, open up to challenging situations, and take purposeful action. You’ll learn to surf the waves of your self-talk, rather than being swept away by it.',
    ],
    youtubeId: '0HmkBW1ZSCA',
    firstEntry: 29,
  },
  {
    number: 6,
    module: 2,
    title: 'Light the Fire',
    type: 'chapter',
    topic: 'Motivation',
    opening: [
      'We often think motivation is something we either have or don’t. But the truth is, it’s a fuel we can create and a resource we can manage.',
      'It isn’t just about pushing harder or waiting for a spark. It’s about understanding the core psychological needs that drive human behaviour.',
      'This chapter explores the foundations of intrinsic motivation: control, competence, and connectedness.',
      'By understanding and nurturing these needs, you’ll unlock sustainable drive, and find deeper fulfilment in your pursuits.',
    ],
    quote: { text: '', author: 'Angela Duckworth' },
    youtubeId: 'nm_VijoVcPY',
    firstEntry: 36,
  },
  {
    number: 7,
    module: 2,
    title: 'The Power of Possible',
    type: 'chapter',
    topic: 'Realistic optimism',
    opening: [
      'Optimism can’t just be blind positivity. It requires clear-eyed hope paired with action.',
      'In this chapter, you’ll learn to see challenges as they are, not worse. To spot opportunities others miss. And to take action when others hesitate.',
      'Realistic optimists aren’t born. They’re built. Through practice, perspective, and persistence.',
    ],
    quote: { text: '', author: 'Winston Churchill' },
    youtubeId: 'mD-NnTngHyQ',
    firstEntry: 43,
  },
  {
    number: 8,
    module: 2,
    title: 'Module 02 Deload',
    type: 'deload',
    topic: null,
    opening: [
      'This week, we revisit what you’ve learnt, strengthen what’s working, and evaluate what isn’t.',
    ],
    recap: [
      'Win the battle in the mind and regulate your inner voice.',
      'Unlock your drive and ability to sustain motivation.',
      'Find and strengthen your optimistic thinking muscle.',
    ],
    youtubeId: null,
    firstEntry: 50,
  },
  {
    number: 9,
    module: 3,
    title: 'Solidarity Squad',
    type: 'chapter',
    topic: 'Support network',
    opening: [
      'Your network is your net worth. But not all support is created equal.',
      'Think of social support as your personal pit crew. The right team can fuel your progress, patch your weak spots, and keep you on track.',
      'This chapter isn’t about collecting contacts. It’s about cultivating four key types of support. Emotional: the shoulders you lean on. Tangible: the hands that help. Informational: the minds that guide. Esteem: the voices that validate.',
      'You’ll learn to identify, nurture, and leverage each type. The strongest aren’t the ones who never need help. They’re the ones who know how to ask for it.',
    ],
    quote: { text: '', author: 'Rudyard Kipling' },
    youtubeId: 'bw-on4zezGc',
    firstEntry: 57,
  },
  {
    number: 10,
    module: 3,
    title: 'Riding the Wave',
    type: 'chapter',
    topic: 'Flow',
    opening: [
      'Flow isn’t just for artists or athletes. Nor is it magic. It’s a state you can create.',
      'Flow is your mind’s autofocus. When it kicks in, time slows, distractions fade, and your best work emerges.',
      'This chapter is about engineering your environment, your tasks, and your mindset to trigger flow when you need it most.',
      'The most productive people aren’t always the most disciplined. They’re the ones who’ve mastered the art of getting out of their own way.',
    ],
    quote: { text: '', author: 'Naval Ravikant' },
    youtubeId: 'f8eD4AMyZ3g',
    firstEntry: 64,
  },
  {
    number: 11,
    module: 3,
    title: 'Escape From Extinction',
    type: 'chapter',
    topic: 'Adaptability',
    opening: [
      'Adaptability is the number one skill we’ve relied on to survive. But in today’s world it’s become an increasingly rare commodity. Until now.',
      'Adaptability is your ability to be flexible and benefit from a moving environment. When it’s engaged, obstacles become opportunities, changes turn into challenges, and growth happens.',
      'The most resilient people aren’t the ones who plan for everything. They thrive when plans fall apart.',
      'Your ability to adapt is your greatest strength.',
    ],
    quote: { text: '', author: 'George Heaton' },
    youtubeId: 'Ck7CGmLEiWw',
    firstEntry: 71,
  },
  {
    number: 12,
    module: 3,
    title: 'Module 03 Deload',
    type: 'deload',
    topic: null,
    opening: [
      'This week, we revisit what you’ve learnt, strengthen what’s working, and evaluate what isn’t.',
    ],
    recap: [
      'Create an environment and ecosystem that fuels your efforts.',
      'Master the art of deep focus and flow state.',
      'Develop your ability to perform under pressure.',
    ],
    quote: { text: '', author: 'John Powell' },
    youtubeId: null,
    firstEntry: 78,
  },
  {
    number: 13,
    module: 4,
    title: 'Thoughtful Mirrors',
    type: 'chapter',
    topic: 'Reflection',
    opening: [
      'Reflection is the bridge between experience and growth. Through thoughtful practice, we transform our daily experiences into lasting wisdom. This process is about active learning that shapes future action, not passive contemplation.',
      'In this chapter you’ll learn to use structured reflection to extract meaningful insights from your experiences, identify patterns in your behaviour and thinking, convert lessons learned into actionable steps, and build a framework for continuous improvement.',
      'The goal isn’t just to reflect, but to reflect with purpose. Each reflection should lead to clearer understanding and more effective action.',
    ],
    youtubeId: 'DxpGgLMB_cc',
    firstEntry: 85,
  },
  {
    number: 14,
    module: 4,
    title: 'Navigating New Horizons',
    type: 'chapter',
    topic: 'Goal-setting',
    opening: [
      'Research shows that writing down your goals increases the likelihood of achieving them.',
      'But your desire to achieve a goal alone is not going to get you there.',
      'Behaviour is the often neglected element in goal pursuit. Perhaps a better term would be behaviour-setting. It’s the process of decoding the necessary behaviours to hit a target.',
      'Goal-setting requires nuance. This is your framework.',
    ],
    youtubeId: 'NTqwwNpt73M',
    firstEntry: 92,
  },
  {
    number: 15,
    module: 4,
    title: 'Beyond The Ordinary',
    type: 'chapter',
    topic: 'Sustainable performance',
    opening: [
      'We’ve been sold a lie about work-life balance.',
      'Your wellbeing isn’t a steady state to maintain. It’s a dynamic system to orchestrate.',
      'Top performers don’t sustain maximum output across every domain simultaneously. They create seasons of focused intensity followed by deliberate restoration.',
      'This chapter shows you how to design sustainable rhythms that compound over time rather than deplete your reserves.',
      'The path to sustained excellence isn’t linear. It’s seasonal.',
    ],
    youtubeId: 'Wr86MmKkCd0',
    firstEntry: 99,
  },
  {
    number: 16,
    module: 4,
    title: 'Module 04 Deload',
    type: 'deload',
    topic: null,
    opening: [
      'This week, we revisit what you’ve learnt, strengthen what’s working, and evaluate what isn’t.',
    ],
    recap: [
      'Learn reflective practice for better future action.',
      'Turn your vision into reality with a goals framework.',
      'Work like an athlete, with strategic seasons rather than constant sprints.',
    ],
    youtubeId: null,
    firstEntry: 106,
  },
]

export function getWeek(n: number): Week | undefined {
  return weeks.find((w) => w.number === n)
}

export function getModule(n: number): Module | undefined {
  return modules.find((m) => m.number === n)
}

export function moduleForWeek(n: number): Module | undefined {
  return modules.find((m) => m.weeks.includes(n))
}
