// Links to files and recordings. Everything here is data rather than markup so
// it can move to the `assets` table in Supabase without touching a component.
//
// Cohort 4.0 recordings do not exist yet. The onboarding call is 26 August 2026
// and each module workshop is recorded on the deload week. Values stay null
// until Henri adds the new Drive files, and the UI says so rather than linking
// to a cohort 3.0 recording.

import type { Tier } from './programme'

export type Asset = {
  url: string | null
  /** Members below this tier never see the link, and never receive it in HTML. */
  minTier: Tier
  note?: string
}

export const assets = {
  /** Served through a signed URL from a private Supabase Storage bucket. */
  journalPdf: {
    storagePath: 'journal/LP_Limitless_Journal_Combined_01.pdf',
    filename: 'Limitless-Journal.pdf',
  },
  onboardingRecording: {
    url: null,
    minTier: 'core',
    note: 'Recorded 26 August 2026. Add the Drive link once it is uploaded.',
  } as Asset,
  whatsappInvite: {
    url: null,
    minTier: 'pro',
    note: 'Pro community invite. Never render this for Core members.',
  } as Asset,
} as const

/** Module workshop recordings, keyed by the deload week they belong to. */
export const workshopRecordings: Record<number, Asset> = {
  4: { url: null, minTier: 'core', note: 'Module 01 workshop, cohort 4.0.' },
  8: { url: null, minTier: 'core', note: 'Module 02 workshop, cohort 4.0.' },
  12: { url: null, minTier: 'core', note: 'Module 03 workshop, cohort 4.0.' },
  16: { url: null, minTier: 'core', note: 'Module 04 workshop, cohort 4.0.' },
}
