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
    detail: 'Forty five minutes. It covers how the sixteen weeks run and how to use your journal.',
  },
  {
    key: 'journal-pdf',
    label: 'Download your PDF journal',
    detail: 'Your physical journal is in the post. The PDF is the same book.',
  },
  {
    key: 'pre-assessment',
    label: 'Complete your pre-programme assessment',
    detail: 'The link is sent by email after the onboarding call.',
  },
  {
    key: 'workshop-dates',
    label: 'Add the four workshop dates to your calendar',
    detail: 'Pro members join live. Core members get the recording on the Thursday of each deload week.',
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
  {
    key: 'read-week-1',
    label: 'Read Week 1 before Monday 31 August',
    detail: 'Know Thyself. Twenty minutes of reading and a video masterclass.',
  },
]

export function checklistFor(tier: Tier): ChecklistItem[] {
  return checklist.filter((item) => !item.tier || item.tier === tier)
}
