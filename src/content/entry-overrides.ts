import type { Field } from './entry-fields'

/**
 * Corrections and additions on top of the parsed journal.
 *
 * The parser reads the printed page as well as it can, but some pages set their
 * headings, quotations and diagrams as outlines rather than text, and a few
 * exercises need a kind of field the book draws by hand. Anything here wins
 * over the parsed entry.
 */
export type EntryOverride = {
  /** Replaces the parsed heading. */
  title?: string
  /** The page has no diagram, or the parser found something that is not one. */
  hideVisual?: boolean
  /** Text set as outlines beneath a diagram, which cannot be read out of the PDF. */
  caption?: { lines: string[]; author?: string }
  /** Enlarges a diagram that reads too small at the default half panel. */
  visualScale?: number
  /** The page is a diagram alone, with nothing to fill in. */
  hideExercise?: boolean
  /** Replaces the parsed prompts entirely. */
  exercise?: { intro?: string[]; fields: Field[]; outro?: string[] }
  /** Replaces a printed QR code. */
  link?: { label: string; url: string }
}

/** The four steps of the optimism stairway, weeks 7 and 8. */
const scoreGauge: Field = {
  kind: 'gauge',
  label: 'Based on this, score the likelihood of your ideal outcome happening',
}

/** The assessment behind the motivation check-in, used in weeks 6 and 8. */
const motivationLink = {
  label: 'Take the Light the Fire assessment',
  url: 'https://unlock.lmntaryperformance.com/light-the-fire',
}

const motivationFields: Field[] = [
  { kind: 'note', text: 'Add your three results below.' },
  { kind: 'percent', label: 'Control' },
  { kind: 'percent', label: 'Competence' },
  { kind: 'percent', label: 'Connectedness' },
]

export const entryOverrides: Record<number, EntryOverride> = {
  // Week 1
  1: {
    exercise: {
      fields: [
        { kind: 'text', label: 'Describe an experience when your lead behavioural style served you well:' },
        {
          kind: 'text',
          label: 'Describe an experience when your lead behavioural style might have been overdone:',
        },
      ],
    },
  },
  3: {
    title: 'Change the Way you See Things',
    caption: {
      lines: ['We don’t see the world as it is,', 'we see it as we are.'],
      author: 'Anaïs Nin',
    },
  },
  5: { title: 'Expand your Range' },
  6: { title: 'Where Focus Goes', hideExercise: true },

  // Week 2
  9: { title: 'Living with Intent', hideVisual: true },
  10: {
    title: 'Purpose isn’t Found, it’s Lived',
    exercise: {
      fields: [
        {
          kind: 'line',
          label: 'Revisit your list of values from Entry 8 and select a third value that resonates with you. Value three:',
        },
        { kind: 'text', label: 'Describe how this value might show up in your future actions?' },
        {
          kind: 'line',
          label: 'Over the coming days, set a goal that aligns with your newly chosen value. Goal:',
        },
        { kind: 'text', label: 'What does that experience look like? And how might it play out?' },
      ],
    },
  },
  11: {
    title: 'The Unconscious',
    caption: { lines: [], author: 'Carl Jung' },
    hideExercise: true,
  },

  // Week 3
  16: {
    exercise: {
      intro: [
        'Go back and read your story from Entry 15. Write down any words or phrases you consider to be related to your personal strengths:',
      ],
      fields: [{ kind: 'lines', label: 'Words and phrases', count: 6 }],
    },
  },
  18: { title: 'Play to your Strengths' },
  20: {
    title: 'That Little Extra',
    caption: {
      lines: ['The difference between ordinary and', 'extraordinary is that little extra.'],
      author: 'Jimmy Johnson',
    },
    hideExercise: true,
  },

  // Week 4
  22: { title: 'Looking Back', hideVisual: true },
  23: {
    title: 'Until you Make the Unconscious Conscious',
    caption: {
      lines: [
        'Until you make the unconscious conscious, it will',
        'direct your life and you will call it fate.',
      ],
      author: 'Carl Jung',
    },
    hideExercise: true,
  },
  24: { hideVisual: true },
  25: {
    title: 'The Things you are Passionate About',
    caption: {
      lines: ['The things you are passionate about are', 'not random, they are your calling.'],
      author: 'Fabienne Fredrickson',
    },
    hideExercise: true,
  },
  26: { hideVisual: true },
  27: {
    title: 'Elevate the Standard',
    caption: {
      lines: [
        'If you have the same standard as everyone else,',
        'you’ll get the same results as everyone else.',
        'Elevate the standard to change the results.',
      ],
      author: 'Shane Parrish',
    },
    hideExercise: true,
  },

  // Week 5
  29: {
    title: 'The Agile Mind',
    caption: { lines: ['How to ‘win’ at self-talk'] },
    exercise: {
      intro: ['Rate yourself on a scale of 1 to 10 for each question, 1 being low and 10 being high.'],
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
  },
  30: { title: 'Going from Away, Towards', hideVisual: true },
  31: { title: 'The Mind is Like Water', hideExercise: true },
  32: {
    title: 'Hooked and Reacting Automatically',
    caption: {
      lines: ['Reacting', 'Acting ineffectively and unlike the sort of person you want to be.'],
    },
    exercise: {
      intro: ['Identify a current challenging situation. Reflect on:'],
      fields: [
        {
          kind: 'text',
          label: 'When you get hooked by your thoughts or feelings, how does that play out?',
        },
        { kind: 'text', label: 'What might dominate your behaviour in self-defeating ways?' },
        { kind: 'text', label: 'What are the long-term costs?' },
        { kind: 'text', label: 'What are the short-term benefits?' },
      ],
    },
  },
  33: {
    title: 'Unhooked and Responding Deliberately',
    caption: {
      lines: ['Responding', 'Acting effectively and like the sort of person you want to be.'],
    },
    exercise: {
      intro: ['Identify a current challenging situation. Reflect on:'],
      fields: [
        {
          kind: 'text',
          label: 'When you unhook yourself from your thoughts or feelings, how does that play out?',
        },
        { kind: 'text', label: 'How might you focus on values and strengths to support unhooking?' },
        { kind: 'text', label: 'What are the long-term benefits?' },
        { kind: 'text', label: 'What are the short-term costs?' },
      ],
    },
  },
  34: { title: 'Where Focus Goes, Energy Flows', hideExercise: true },
  35: {
    exercise: {
      intro: ['Shifting our thinking on the spot.'],
      fields: [
        { kind: 'text', label: 'What am I resisting right now, and how can I make space for it?' },
        { kind: 'text', label: 'Be present: what is happening right here, right now, that I can notice fully?' },
        {
          kind: 'text',
          label: 'Do what matters: what small step can I take today that aligns with my values?',
        },
      ],
    },
  },

  // Week 6
  36: {
    link: motivationLink,
    exercise: {
      fields: [
        ...motivationFields,
        { kind: 'text', label: 'Does this reflect how you feel on a daily basis?' },
        {
          kind: 'text',
          label: 'What’s one small way you could boost your lowest-scoring need this week?',
        },
      ],
    },
  },
  37: { hideVisual: true },
  40: {
    title: 'Motivation Comes from Within',
    caption: { lines: ['The best motivation always comes from within.'], author: 'Michael Johnson' },
  },
  41: {
    exercise: {
      intro: [
        'Reach out to someone today. A quick chat, a thoughtful message, or a catch up. Reflect on:',
      ],
      fields: [
        { kind: 'text', label: 'The quality of the interaction:' },
        { kind: 'text', label: 'How it affected your mood:' },
        { kind: 'text', label: 'Your sense of belonging:' },
      ],
      outro: ['No forced cheer, just honest reflection on human connection.'],
    },
  },

  // Week 7, the stairway to optimism
  43: {
    title: 'Stairway to Optimism',
    exercise: {
      fields: [
        { kind: 'line', label: 'Identify an ideal outcome you’re working towards:', step: 1 },
        { kind: 'text', label: 'What’s the best case scenario?' },
        { kind: 'text', label: 'What are the potential obstacles?' },
        scoreGauge,
      ],
    },
  },
  44: {
    title: 'Change the Way you Look at Things',
    caption: {
      lines: ['If you change the way you look at things,', 'the things you look at change.'],
      author: 'Wayne Dyer',
    },
    hideExercise: true,
  },
  45: {
    title: 'List your Resources',
    exercise: {
      intro: ['With the challenge from Entry 43 in mind, list your available resources:'],
      fields: [
        { kind: 'text', label: 'Skills:', step: 2 },
        { kind: 'text', label: 'Time:' },
        scoreGauge,
      ],
    },
  },
  46: { title: 'The Realistic Optimist', hideExercise: true },
  47: {
    title: 'Build your Action Plan',
    exercise: {
      fields: [
        { kind: 'text', label: 'Create a detailed action plan for your challenge:', step: 3 },
        { kind: 'text', label: 'For each step, write down how you’ll take full responsibility:' },
        { kind: 'text', label: 'Craft a positive, realistic narrative about your approach:' },
        scoreGauge,
      ],
    },
  },
  48: {
    title: 'The Optimistic Side of Life',
    caption: {
      lines: [
        'I always like to look on the optimistic side of life, but I am',
        'realistic enough to know that life is a complex matter.',
      ],
      author: 'Walt Disney',
    },
    hideExercise: true,
  },
  49: {
    exercise: {
      fields: [
        {
          kind: 'text',
          label: 'Recall a past success, what lessons can you apply to your challenge:',
          step: 4,
        },
        { kind: 'text', label: 'What strengths will you draw on?' },
        scoreGauge,
      ],
    },
  },

  // Week 8
  51: { title: 'The Direction of One Thought', hideExercise: true },
  52: {
    link: motivationLink,
    exercise: {
      fields: [
        ...motivationFields,
        {
          kind: 'text',
          label: 'Have you noticed any changes in your motivation drivers? (Refer back to Entry 36)',
        },
        { kind: 'text', label: 'One thing you’ll carry forward:' },
      ],
    },
  },
  53: {
    title: 'Control your own Destiny',
    caption: { lines: ['Control your own destiny', 'or someone else will.'], author: 'Jack Welch' },
    hideExercise: true,
  },
  54: {
    title: 'Realistic Optimists',
    hideVisual: true,
    exercise: {
      intro: ['Review the ten traits of realistic optimists. For each, rate yourself 1 to 10:'],
      fields: [
        { kind: 'scale', label: 'Selective focus. Disciplined, purposeful, intentional.' },
        { kind: 'scale', label: 'Set realistic goals. Measurable, attainable, structured.' },
        { kind: 'scale', label: 'Keep perspective. Objective, level headed, contextual.' },
        {
          kind: 'scale',
          label: 'Emphasise positives. Strengths based, encouraging, solution oriented.',
        },
        { kind: 'scale', label: 'Use humour. Playful, approachable, relatable.' },
        { kind: 'scale', label: 'Rationality. Logical, reasoned, evidence based.' },
        { kind: 'scale', label: 'Self-improvement. Ambitious, reflective, proactive.' },
        { kind: 'scale', label: 'Experimentation. Innovative, curious, open minded.' },
        {
          kind: 'scale',
          label: 'Personal responsibility. Dependable, self-reliant, integrity focused.',
        },
        { kind: 'scale', label: 'Select their environment. Intentional, selective, thoughtful.' },
        { kind: 'text', label: 'Which traits are your strengths? Which need work?' },
      ],
    },
  },
  55: {
    title: 'The Odds Increase',
    caption: { lines: ['The odds increase, the more you try.'], author: 'James Clear' },
    hideExercise: true,
  },

  // Week 9
  58: {
    exercise: {
      intro: [
        'Think of a recent task that has been difficult to complete. Consider who or what could provide resources or support to assist you.',
      ],
      fields: [
        { kind: 'text', label: 'What led you to select this resource or person?' },
        { kind: 'text', label: 'What was your experience like when seeking support?' },
        { kind: 'text', label: 'What difference did the support make?' },
      ],
    },
  },
  59: { title: 'You Can’t Read the Label from Inside the Bottle', hideExercise: true },
  60: {
    visualScale: 0.66,
    exercise: {
      intro: ['Find an expert or experienced individual to advise you on a current challenge.'],
      fields: [
        { kind: 'text', label: 'What was the most valuable takeaway from their input?' },
        { kind: 'text', label: 'How did their perspective shift your understanding of the situation?' },
        { kind: 'text', label: 'How can you apply this to your challenge?' },
      ],
    },
  },
  61: {
    exercise: {
      intro: ['Ask a trusted friend or mentor for honest, constructive feedback on a current goal or project.'],
      fields: [
        { kind: 'text', label: 'What surprised you about their feedback?' },
        { kind: 'text', label: 'How did this input affect your self-awareness?' },
        { kind: 'text', label: 'How can you leverage their feedback going forward?' },
      ],
    },
  },
  62: { title: 'You Can’t Get to the New Place with the Old Map', hideExercise: true },

  // Week 10
  63: {
    exercise: {
      intro: [
        'Identify four people who could form your core support network. For each person, note what unique expertise they bring, how they complement your strengths and limitations, and how you can nurture the relationship.',
      ],
      fields: [
        {
          kind: 'group',
          label: 'One',
          fields: [
            { kind: 'line', label: 'Name' },
            { kind: 'text', label: 'What they bring, and how you will nurture it:' },
          ],
        },
        {
          kind: 'group',
          label: 'Two',
          fields: [
            { kind: 'line', label: 'Name' },
            { kind: 'text', label: 'What they bring, and how you will nurture it:' },
          ],
        },
        {
          kind: 'group',
          label: 'Three',
          fields: [
            { kind: 'line', label: 'Name' },
            { kind: 'text', label: 'What they bring, and how you will nurture it:' },
          ],
        },
        {
          kind: 'group',
          label: 'Four',
          fields: [
            { kind: 'line', label: 'Name' },
            { kind: 'text', label: 'What they bring, and how you will nurture it:' },
          ],
        },
      ],
    },
  },
  65: {
    exercise: {
      intro: [
        'Today, design a pre-flow ritual that signals your brain it’s time to dive deep. It could be a specific playlist, a brief meditation, or arranging your workspace.',
      ],
      fields: [
        { kind: 'lines', label: 'What steps make up your pre-flow ritual?', count: 5 },
        {
          kind: 'text',
          label:
            'Having established your flow killers (Entry 64), what methods will you take to cut them out?',
        },
      ],
    },
  },
  66: { title: 'Forcing Flow, Allowing Flow', hideExercise: true },
  68: { title: 'Where Skill Meets Challenge', hideExercise: true },
  69: {
    exercise: {
      intro: ['Today, set up your post-flow recovery ritual:'],
      fields: [
        {
          kind: 'text',
          label:
            'What activities can help you unwind and recharge? How does this ritual differ from your usual break time?',
        },
        {
          kind: 'text',
          label: 'How does it affect your energy levels, mood, and ability to re-engage with work?',
        },
      ],
    },
  },

  // Week 11
  71: {
    exercise: {
      fields: [
        { kind: 'line', label: 'What’s a challenge you’ve faced:' },
        {
          kind: 'text',
          label:
            'Think of someone with a different natural behaviour style than yours. How would they have approached the challenge differently?',
        },
      ],
    },
  },
  72: { caption: { lines: [], author: 'Carl Jung' }, hideExercise: true },
  73: {
    title: 'You Vs. Them',
    exercise: {
      intro: ['Refer back to your challenge in Entry 71, analyse the contrast in:'],
      fields: [
        {
          kind: 'group',
          label: 'Your',
          fields: [
            { kind: 'text', label: 'Initial thoughts and actions:' },
            { kind: 'text', label: 'Assumptions made:' },
          ],
        },
        {
          kind: 'group',
          label: 'Their',
          fields: [
            { kind: 'text', label: 'Initial thoughts and actions:' },
            { kind: 'text', label: 'Assumptions made:' },
          ],
        },
        { kind: 'text', label: 'Based on that information, what conclusions can you make?' },
        { kind: 'text', label: 'What future reminder can you give yourself to remain adaptable?' },
      ],
    },
  },
  74: {
    title: 'Unlearn to Learn',
    caption: {
      lines: [
        'When any real progress is made, we unlearn',
        'and learn anew what we thought we knew before.',
      ],
      author: 'Henry David Thoreau',
    },
    hideExercise: true,
  },
  75: { hideVisual: true },
  79: {
    title: 'On the Shoulders of Giants',
    caption: {
      lines: ['If I have seen further it is by standing', 'on the shoulders of giants.'],
      author: 'Isaac Newton',
    },
  },

  // Titles read off the printed page, where the heading is set as outlines.
  13: { title: 'You Become What you Do' },
  38: { title: 'Extrinsic is Fleeting, Intrinsic is Lasting' },
  76: { title: 'What you Can Always Change' },
  81: { title: 'Challenge and Ability' },
  83: {
    title: 'Building the New',
    caption: {
      lines: [
        'The secret of change is to focus all of your energy,',
        'not on fighting the old, but on building the new.',
      ],
      author: 'Socrates',
    },
  },
  86: { title: 'Mind Full or Mindful' },
  88: { title: 'Growth Follows Awareness' },
  90: {
    title: 'Effective Action, Quiet Reflection',
    caption: {
      lines: [
        'Follow effective action with quiet reflection. From the quiet',
        'reflection will come even more effective action.',
      ],
      author: 'Peter Drucker',
    },
  },
  96: { title: 'Systems, Milestones, Destination' },
  97: { title: 'Think Big, Progress Small' },
  101: {
    title: 'Wellbeing is Energy',
    caption: {
      lines: ['Wellbeing is energy.', 'It should be the centrepiece of our performance.'],
      author: 'Owen Eastwood',
    },
  },
  103: { title: 'The Finish Line Keeps Moving' },
  107: { title: 'Direction Over Speed' },
  109: { title: 'Do the Verb', caption: { lines: ['Forget the noun, do the verb.'], author: 'Austin Kleon' } },
  111: { title: 'The Happiness of Pursuit' },
}

export function overrideFor(n: number): EntryOverride | null {
  return entryOverrides[n] ?? null
}
