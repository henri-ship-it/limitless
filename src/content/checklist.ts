import type { Tier } from './programme'

export type ChecklistItem = {
  key: string
  label: string
  detail?: string
  /** Pro items are hidden from Core members and never counted in their total. */
  tier?: Tier
}

export const checklist: ChecklistItem[] = [
  {
    key: 'onboarding-recording',
    label: 'Watch the onboarding call recording',
    detail: 'It covers how the sixteen weeks run and how to use your journal.',
  },
  {
    key: 'journal',
    label: 'Get your Limitless journal',
    detail:
      'Your physical journal is posted to you. The PDF is the same book if you would rather work on screen.',
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
    label: 'Note your weekly drop-in call time',
    detail: 'A standing group call, every week of the programme.',
    tier: 'pro',
  },
]

export function checklistFor(tier: Tier): ChecklistItem[] {
  return checklist.filter((item) => !item.tier || item.tier === tier)
}
