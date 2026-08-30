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
    detail:
      'Your physical journal is posted to you. The PDF is the same book if you would rather work on screen.',
    link: { label: 'Download the PDF', href: '/journal/download' },
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
    label: `Put the weekly drop-in in your diary: ${COHORT.dropIn.short}`,
    detail: `${COHORT.dropIn.day}s, ${COHORT.dropIn.time}. Half an hour, every week of the programme.`,
    tier: 'pro',
  },
]

export function checklistFor(tier: Tier): ChecklistItem[] {
  return checklist.filter((item) => !item.tier || item.tier === tier)
}
