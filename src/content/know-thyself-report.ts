/**
 * The deeper Know Thyself writing, from the printed report.
 *
 * Taken verbatim from the ScoreApp PDF report on 24 November 2026, one variant
 * per style, before the assessment moved in house.
 *
 * This is only shown for the style somebody actually leads with. The full
 * report runs to fourteen pages and four of those on one screen would be a
 * wall, so the sections that repeat each other are left to the PDF: potential
 * traps overlaps with overplayed, core strengths with how you show up, and the
 * colleagues and leader pages are workplace specific. What is here is the part
 * that reads as being about the person rather than about their job. The whole
 * text of all four is kept in the export at
 * scoreapp-export-2026-11-24/copy/know-thyself-pdf-report.md.
 */

export type Trait = { name: string; detail: string }

export type Report = {
  /** The line printed under "You're a ..." in the report, in caps there. */
  strapline: string
  /** Two short paragraphs introducing the style. */
  opening: [string, string]
  showUp: Trait[]
  whenItWorks: string
  overplayed: Trait[]
  /** The questions that pull someone out of their default, with the prompt. */
  checks: { question: string; detail: string }[]
  growth: Trait[]
  reminder: string
}

export const REPORTS: Record<string, Report> = {
  dynamo: {
    strapline: 'Nose for opportunity, taste for pressure, zero patience for dithering.',
    opening: [
      'You move first and figure it out on the way. You set the pace, raise the bar, and drag the room with you. Plans matter, but progress matters more.',
      'If there’s no way through, you find it.',
    ],
    showUp: [
      {
        name: 'Decisive',
        detail:
          'You commit fast and create momentum. You’re not paralysed by uncertainty, you gather enough information to act and course-correct as you go.',
      },
      {
        name: 'Outcome-driven',
        detail:
          'You judge success by impact, not effort. A brilliant plan that doesn’t deliver results is just noise to you.',
      },
      {
        name: 'Competitive',
        detail:
          'Targets, timers, leaderboards. You’re energised by clear measures and the chance to outperform. You push yourself and others to raise their game.',
      },
      {
        name: 'Straight-talking',
        detail:
          'You cut through fluff and ask for the point. Diplomacy is fine, but clarity comes first.',
      },
    ],
    whenItWorks:
      'Stalled projects move. You unblock what others are stuck on. Next steps become obvious because you’ve already decided them. Chaos calms under your clear decisions. Standards rise because vague goals become clear in your presence.',
    overplayed: [
      {
        name: 'Impatience',
        detail:
          'Your drive to move fast can bulldoze good input. You listen just enough to act, not enough to adapt. People feel rushed and unheard.',
      },
      {
        name: 'Tunnel vision',
        detail:
          'You win the sprint but lose the season. You’re so focused on the next milestone you miss the bigger picture.',
      },
      {
        name: 'Overload',
        detail:
          'You mistake adrenaline for effectiveness. You take on too much, burn hard, and crash. Your pace becomes unsustainable, and so does everyone else’s.',
      },
      {
        name: 'Tone',
        detail:
          'Direct becomes blunt. Confidence reads as dismissive and people can feel steamrolled.',
      },
    ],
    checks: [
      {
        question: 'What did I miss? Who’s affected?',
        detail: 'Take 90 seconds after each decision to consider the ripple effects.',
      },
      {
        question: 'Who needs to be heard before we move?',
        detail: 'Whose input would actually improve this?',
      },
      {
        question: 'What’s the real deadline?',
        detail: 'Is the urgency real, or am I manufacturing it?',
      },
      { question: 'How am I landing this?', detail: 'Is my tone inspiring or intimidating?' },
    ],
    growth: [
      {
        name: 'Build the pause',
        detail:
          '90 seconds after each decision, "What did I miss? Who’s affected?" This isn’t overthinking; it’s wisdom.',
      },
      {
        name: 'Two-speed planning',
        detail:
          'Fast first step; weekly rhythm with one metric that matters. Speed without rhythm is just chaos.',
      },
      {
        name: 'Delegate outcomes, not tasks',
        detail: 'Give ownership, not checklists. Let people figure out how.',
      },
      {
        name: 'Conflict with care',
        detail:
          'Say the hard thing; ask one curious question. Directness plus curiosity is leadership.',
      },
      { name: 'Recovery ritual', detail: 'One daily reset (walk, lift, journal). Speed needs fuel.' },
    ],
    reminder:
      'You are momentum in human form. Keep the edge. Add empathy, systemise the rhythm, and your impact compounds without burning the engine.',
  },

  analyst: {
    strapline: 'Calm, exact, and quietly relentless.',
    opening: [
      'You prefer facts over fanfare, structure over chaos, and outcomes that stand up to scrutiny. When you commit, you deliver, not loudly, but flawlessly.',
      'You’re the person people trust when things need to be done properly.',
    ],
    showUp: [
      {
        name: 'Methodical',
        detail:
          'You plan before you move and document as you go. You don’t rush. You think through consequences.',
      },
      {
        name: 'Evidence-led',
        detail: 'You test assumptions and prove the point. Intuition is fine, but data is better.',
      },
      {
        name: 'Dependable',
        detail:
          'You’re reliable and the standards are steady. You do what you say you’ll do.',
      },
      {
        name: 'Low-drama',
        detail:
          'You stay rational when others panic. You don’t get swept up in emotion or urgency that isn’t real.',
      },
    ],
    whenItWorks:
      'Complex work becomes clear, scheduled, and doable. Teams relax, they know you’ve got the details handled. Quality rises because you hold the bar. People trust you because you’re predictable and thorough.',
    overplayed: [
      {
        name: 'Perfection drag',
        detail:
          'You polish past "good enough." You can’t ship because it’s not perfect yet. The world moves on without you.',
      },
      {
        name: 'Rigidity',
        detail:
          'If it’s not in the plan, it feels wrong. Change is threat, not opportunity. You protect the system over serving the purpose.',
      },
      {
        name: 'Overload',
        detail:
          'You take on too much because you trust yourself more than others. You become the bottleneck.',
      },
      {
        name: 'Tone',
        detail:
          'Direct truth lands as bluntness with sensitive people. You’re not trying to hurt anyone, but you do.',
      },
    ],
    checks: [
      {
        question: 'What’s the minimum viable information I need?',
        detail: 'What’s the 20% of data that gives me 80% of the answer?',
      },
      {
        question: 'What’s the cost of waiting?',
        detail: 'What opportunity am I missing by not deciding now?',
      },
      { question: 'Who could do this better than me?', detail: 'Where am I the bottleneck?' },
      {
        question: 'Is this a standard or a preference?',
        detail: 'Is this rule serving the purpose, or just protecting the process?',
      },
    ],
    growth: [
      {
        name: 'Ship at 80%',
        detail: 'Launch early, learn faster. Perfection is the enemy of progress.',
      },
      {
        name: 'Decision timer',
        detail: 'Cap non-critical analysis at 15 minutes. Then decide with what you have.',
      },
      {
        name: 'Delegate with criteria',
        detail: 'Hand over results, not checklists. Let people figure out how.',
      },
      {
        name: 'Drop list',
        detail: 'Retire one redundant rule, report, or meeting weekly. Question the system.',
      },
      {
        name: 'Name the risk',
        detail: 'Write it, plan the safeguard, then move. Don’t let risk paralyse you.',
      },
    ],
    reminder:
      'You make work work. Keep the standards, but trade perfection for progress, and you’ll scale your impact without carrying all the weight yourself.',
  },

  caretaker: {
    strapline: 'You hold everything together.',
    opening: [
      'Quietly. Consistently. Without the noise or need for credit. You notice what others miss, the tension in someone’s tone, the extra load on their plate, the small details that make people feel seen.',
      'You don’t just care about getting things done, you care about how people feel while doing them.',
    ],
    showUp: [
      {
        name: 'Supportive',
        detail: 'You check in, follow up, and follow through. People know you have their back.',
      },
      {
        name: 'Dependable',
        detail: 'People rely on your consistency and calm. You’re the steady presence.',
      },
      {
        name: 'Empathetic',
        detail: 'You sense what others need before they say it. You read the room.',
      },
      {
        name: 'Grounded',
        detail:
          'You prefer sustainable progress over turbulent change. You think long-term about people.',
      },
    ],
    whenItWorks:
      'Teams feel safe and supported. Standards rise quietly because people don’t want to let you down. Chaos stabilises under your structure and care. Relationships deepen; trust becomes your currency.',
    overplayed: [
      {
        name: 'Over-caring',
        detail: 'You absorb everyone’s stress until it becomes your own. You carry their weight.',
      },
      {
        name: 'Reluctant to say no',
        detail: 'You take on too much, then resent it. You become a martyr.',
      },
      {
        name: 'Avoiding conflict',
        detail: 'You protect harmony, even when truth is needed. Real problems fester.',
      },
      {
        name: 'Invisible effort',
        detail: 'You do the work, but others take the credit. You feel unseen.',
      },
    ],
    checks: [
      {
        question: 'What does success look like?',
        detail: 'Am I clear on the actual outcome, or just on keeping everyone happy?',
      },
      {
        question: 'What’s the kind thing to say?',
        detail: 'Sometimes the kindest thing is the honest thing, even if it’s hard.',
      },
      { question: 'What do I need?', detail: 'What would actually help me show up better?' },
      {
        question: 'Who needs to hear this?',
        detail: 'What conversation am I avoiding that would unlock progress?',
      },
    ],
    growth: [
      {
        name: 'Boundaries aren’t selfish',
        detail: 'Saying no protects your energy to say yes where it counts.',
      },
      {
        name: 'Ask for recognition',
        detail: 'It’s not vanity; it’s validation that fuels motivation.',
      },
      {
        name: 'Speak early',
        detail: 'Honest feedback prevents quiet frustration. Name issues before they fester.',
      },
      {
        name: 'Protect solitude',
        detail: 'Recharge before you burn out. You can’t pour from an empty cup.',
      },
      {
        name: 'Redefine helping',
        detail:
          'Support others by teaching them, not carrying them. Real help builds independence.',
      },
    ],
    reminder:
      'You’re the heartbeat of any team. Loyal, grounded, and generous to a fault. Keep caring, but care smarter. Boundaries don’t break trust, they sustain it.',
  },

  energiser: {
    strapline: 'You light rooms.',
    opening: [
      'Ideas, people, possibilities, you connect them instinctively. You’re expressive, imaginative, and human-first.',
      'Momentum comes from meaning, if it matters, you’re all in. If it’s lifeless, you’re gone.',
    ],
    showUp: [
      {
        name: 'Expressive',
        detail: 'You say what others feel but can’t phrase. You give voice to possibility.',
      },
      {
        name: 'Imaginative',
        detail: 'You see options where others see walls. You reframe problems into opportunities.',
      },
      { name: 'Uplifting', detail: 'Your energy makes people believe again. You’re contagious.' },
      {
        name: 'Collaborative',
        detail: 'You think best out loud, with others. You’re energised by connection.',
      },
    ],
    whenItWorks:
      'Teams get unstuck, you reframe problems and unlock options. Morale rises, people feel seen, valued, and braver. New ideas surface fast, and opportunities multiply.',
    overplayed: [
      {
        name: 'Scatter',
        detail: 'Too many starts, not enough finishes. You leave trails of half-done projects.',
      },
      {
        name: 'People-pleasing',
        detail:
          'Yes to everything means thin impact. You dilute your energy across too many things.',
      },
      {
        name: 'Sensitivity',
        detail: 'Feedback feels personal; you avoid hard truths. Criticism stings.',
      },
      {
        name: 'Momentum fade',
        detail: 'Plans slip when excitement fades. You struggle with follow-through.',
      },
    ],
    checks: [
      {
        question: 'What are the next steps?',
        detail: 'How do I move from inspiration to execution?',
      },
      {
        question: 'What process could I improve?',
        detail: 'Where do I need more structure to sustain momentum?',
      },
      {
        question: 'What is most important to me?',
        detail: 'Which of these options actually aligns with my priorities?',
      },
      {
        question: 'What am I finishing before I start something new?',
        detail: 'What’s the one thing I need to close?',
      },
    ],
    growth: [
      {
        name: 'One in, one out',
        detail: 'No new commitments without dropping one. Protect your capacity.',
      },
      {
        name: 'Finish Fridays',
        detail: 'A weekly 90 minute block, close loops before creating new ones.',
      },
      {
        name: 'Deadlines and owners',
        detail:
          'Every idea gets a date and a name or it’s parked. Specificity kills vagueness.',
      },
      {
        name: 'Feedback frame',
        detail: 'Ask for one thing to keep, one to improve. It depersonalises critique.',
      },
      {
        name: 'Energy budget',
        detail:
          'Cap performing hours; ringfence deep work and recovery. You can’t run on fumes.',
      },
    ],
    reminder:
      'You’re the spark and the story. Keep the light, add boundaries and cadence, and your influence turns from moments into movements.',
  },
}

export function reportFor(key: string): Report | undefined {
  return REPORTS[key]
}
