export type TierRow = { feature: string; core: boolean; pro: boolean }

export const tierComparison: TierRow[] = [
  { feature: 'Physical and PDF journal', core: true, pro: true },
  { feature: 'Weekly digests, all sixteen weeks', core: true, pro: true },
  { feature: 'Chapter video masterclasses', core: true, pro: true },
  { feature: 'Group onboarding call and recording', core: true, pro: true },
  { feature: 'Module workshop recordings', core: true, pro: true },
  { feature: 'Live monthly module workshops', core: false, pro: true },
  { feature: 'Weekly group drop-in calls', core: false, pro: true },
  { feature: 'WhatsApp community', core: false, pro: true },
  { feature: 'Ongoing 1:1 support from Chris', core: false, pro: true },
]
