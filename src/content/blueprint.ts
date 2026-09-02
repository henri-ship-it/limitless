/**
 * The Limitless Pro Blueprint.
 *
 * Written from somebody's pre-assessment and their welcome call, then
 * published by the generator in ~/Downloads/limitless-blueprints. The shape
 * here is the contract between the two: change it and change `publish.py` in
 * the same breath.
 *
 * It is filed under `assessment.blueprint` rather than in a column of its own.
 * A column would say more clearly that this is written rather than received,
 * but adding one needs DDL and the only hand that can run DDL here is somebody
 * in the SQL editor. `assessment` is already there, and the scorecard webhook
 * merges into it key by key, so a blueprint sitting alongside the two scorecard
 * slots survives every write the webhook makes. See the note in lib/scorecard.
 *
 * The print version is deliberately tighter than this, because A4 is a fixed
 * budget and the generator refuses copy that would overflow it. Nothing here
 * is length-checked, so the page can carry the fuller writing where there is
 * fuller writing to carry.
 */

/** One of the four stages, which spell out L-M-N-T. */
export type JourneyStage = {
  /** 'Learn' | 'Manage' | 'Nurture' | 'Thrive' — fixed, and in that order. */
  stage: string
  /** The half that changes per member, e.g. 'Know yourself'. */
  title: string
  relevance: string
  outcomes: string
}

export type ResistanceRow = {
  /** 'Slippery Behaviours' or 'Patterns of Thinking'. */
  heading: string
  title: string
  watchFor: string
  playsOut: string
}

export type Blueprint = {
  territory: {
    challenge: string
    challengeReflection: string
    /** Three words. The spine of everything below. */
    direction: string[]
    directionReflection: string
  }
  resistance: {
    rows: ResistanceRow[]
    shiftFrom: string
    shiftTo: string
  }
  journey: JourneyStage[]
  integration: {
    strengths: string[]
    opportunities: string[]
    reflection: string
  }
  /** ISO timestamp of the publish that produced this. */
  issuedAt?: string
}

/** The slot inside `profiles.assessment` that a blueprint is filed under. */
export const BLUEPRINT_SLOT = 'blueprint'

/**
 * The print version's home: a bucket of its own, with no select policy on it.
 *
 * member-files lets any signed-in member read the whole bucket, which was right
 * while everything in it was the same journal PDF. A blueprint is per-member,
 * so it lives somewhere no member token can read at all, and the only way in is
 * a signed URL minted by /blueprint/download from the caller's own session.
 */
export const BLUEPRINT_BUCKET = 'member-blueprints'

export function blueprintPdfPath(memberId: string) {
  return `${memberId}.pdf`
}

/**
 * Whether a value off the database is a blueprint worth rendering.
 *
 * Checks the parts the page actually reads rather than every field, so a
 * blueprint published before a later field was added still renders instead of
 * failing shut.
 */
export function isBlueprint(value: unknown): value is Blueprint {
  if (!value || typeof value !== 'object') return false
  const b = value as Partial<Blueprint>
  return Boolean(
    b.territory?.challenge &&
      Array.isArray(b.journey) &&
      b.journey.length > 0 &&
      b.integration &&
      b.resistance,
  )
}

/**
 * A stand-in for preview mode, so the page can be looked at before any real
 * blueprint exists. Invented, not anybody's: nothing written from a member's
 * pre-assessment belongs in the repository.
 */
export const PREVIEW_BLUEPRINT: Blueprint = {
  territory: {
    challenge:
      'Carrying every function of the business yourself, with no reliable way to turn a goal into the work that reaches it.',
    challengeReflection:
      'You reverse-engineer a plan for other people every week. What stops you building your own the same way?',
    direction: ['Clarity', 'Delegate', 'Acknowledge'],
    directionReflection:
      'If the work were no longer capped by what you can personally carry, what would you build first?',
  },
  resistance: {
    rows: [
      {
        heading: 'Slippery Behaviours',
        title: 'Out-working the bottleneck instead of naming it',
        watchFor: 'Defaulting to effort whenever the task list is unclear.',
        playsOut: 'Everything stays with you, and the week fills before it is chosen.',
      },
      {
        heading: 'Patterns of Thinking',
        title: 'Confidence sets the expectation, so hitting the goal never counts',
        watchFor: 'Moving straight to the next thing, with the last one unregistered.',
        playsOut: 'Progress is real and invisible at the same time.',
      },
    ],
    shiftFrom: 'It can only grow as far as I can carry it',
    shiftTo: 'I build the people and frameworks that carry it with me',
  },
  journey: [
    {
      stage: 'Learn',
      title: 'Know yourself',
      relevance: 'Naming the drive underneath the work rate, and what it costs to keep it up.',
      outcomes: 'Language for the shift you are already halfway through.',
    },
    {
      stage: 'Manage',
      title: 'Control patterns',
      relevance: 'Building the goal-setting and reverse-engineering framework the week is missing.',
      outcomes: 'A task set you trust; bottlenecks measured rather than absorbed.',
    },
    {
      stage: 'Nurture',
      title: 'Build belief',
      relevance: 'Making acknowledgement a practice rather than an afterthought.',
      outcomes: 'Wins registered as they land.',
    },
    {
      stage: 'Thrive',
      title: 'Execute integration',
      relevance: 'Turning the plan into the hire, and the hire into time you get back.',
      outcomes: 'Leading the work instead of carrying it.',
    },
  ],
  integration: {
    strengths: [
      'Resilience and work rate that hold when the pressure is on',
      'A read on people that earns trust before you ask for it',
    ],
    opportunities: [
      'Naming and measuring bottlenecks rather than out-working them',
      'Registering a win before moving to the next one',
    ],
    reflection: 'What would you want this to have been worth, twelve months from now?',
  },
}
