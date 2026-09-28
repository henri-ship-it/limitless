import { COHORT, type Tier } from './programme'

export type ChecklistItem = {
  key: string
  label: string
  detail?: string
  /** Pro items are hidden from Core members and never counted in their total. */
  tier?: Tier
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
 * not do it. There is no cohort to join and no group to be added to, the
 * journal is four books rather than one, and the call is a check-in with Chris
 * rather than a drop-in somebody else is also on. Keys are distinct from the
 * weekly ones so that a member who has done both programmes does not arrive at
 * Elite with half the list already ticked.
 */
export const eliteChecklist: ChecklistItem[] = [
  {
    key: 'elite-welcome-call',
    label: 'Have your welcome call with Chris',
    detail: 'Half an hour on where you are starting from and what the year is for.',
  },
  {
    key: 'elite-journal',
    label: 'Receive your journals',
    detail: 'Four printed books, three chapters in each. The first arrives before you begin.',
  },
  {
    key: 'elite-assessment',
    label: 'Complete your pre-programme assessment',
    detail: 'It sets the baseline your blueprint is built from. The link comes by email.',
  },
  {
    key: 'elite-whatsapp',
    label: 'Save Chris on WhatsApp',
    detail: 'Elite has no group. Anything at all, any time, straight to him.',
  },
  {
    key: 'elite-check-in',
    label: 'Put your check-ins in the diary',
    detail: 'One with Chris in each chapter, so twelve across the year.',
  },
]

export function checklistFor(tier: Tier): ChecklistItem[] {
  if (tier === 'elite') return eliteChecklist
  return checklist.filter((item) => !item.tier || item.tier === tier)
}
