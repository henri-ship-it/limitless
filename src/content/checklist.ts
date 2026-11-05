import { COHORT, tierInfo, type Tier } from './programme'

export type ChecklistItem = {
  key: string
  label: string
  detail?: string
  /** Pro items are hidden from Core members and never counted in their total. */
  tier?: Tier
  /**
   * Only for the products that buy Chris's own time.
   *
   * Elite, Elevate and 365 share a journal and so share this list, but not all
   * of it is theirs to do. Telling an Elevate member to book a welcome call
   * that is not part of what they bought is worse than leaving it out.
   */
  oneToOne?: boolean
  /** A link shown alongside the item. */
  link?: { label: string; href: string }
  /** An asset that becomes a link once its URL is filled in. */
  asset?: 'onboardingRecording'
}

export const checklist: ChecklistItem[] = [
  {
    key: 'onboarding-recording',
    label: 'Watch the onboarding call recording',
    detail: 'It covers how the sixteen weeks run and how to use your journal.',
    asset: 'onboardingRecording',
  },
  {
    key: 'journal',
    label: 'Receive your Limitless journal',
    detail: 'Your physical journal is posted to you.',
  },
  {
    key: 'pre-assessment',
    label: 'Complete your pre-programme assessment',
    detail: 'The link is sent by email after the onboarding call.',
  },
  {
    key: 'whatsapp',
    label: 'Join the WhatsApp community',
    detail: 'This is where the group runs between calls.',
    tier: 'pro',
  },
  {
    key: 'drop-in',
    label: `Put the drop-in call in your diary: ${COHORT.dropIn.short}`,
    detail: `${COHORT.dropIn.day}s, ${COHORT.dropIn.time}. Half an hour, ${COHORT.dropIn.when} — not the deload week, which has the workshop.`,
    tier: 'pro',
  },
]

/*
 * Elite sets up differently enough that filtering the list above by tier would
 * not do it: the journal is four books rather than one, and the support is
 * Chris directly rather than a group to be added to. Keys are distinct from the
 * weekly ones so that a member who has done both programmes does not arrive at
 * Elite with half the list already ticked.
 */
export const eliteChecklist: ChecklistItem[] = [
  {
    key: 'elite-welcome-call',
    label: 'Have your welcome call with Chris',
    detail: 'Where you are starting from, and what the year is for.',
    oneToOne: true,
  },
  {
    key: 'elite-journal',
    label: 'Receive your journals',
    detail: 'Four printed books, three chapters in each.',
  },
  {
    key: 'elite-assessment',
    label: 'Complete your pre-programme assessment',
    detail: 'It sets the baseline your blueprint is built from. The link comes by email.',
  },
  {
    key: 'elite-whatsapp',
    label: 'Save Chris on WhatsApp',
    oneToOne: true,
  },
]

export function checklistFor(tier: Tier): ChecklistItem[] {
  const info = tierInfo(tier)

  /*
   * Which list, then which of its items. The journal decides the list, because
   * setting up four books is a different job from setting up one, and the
   * product decides what inside it applies.
   */
  if (info.mode === 'elite') {
    return eliteChecklist.filter((item) => !item.oneToOne || info.oneToOne)
  }

  return checklist.filter((item) => !item.tier || item.tier === tier)
}
