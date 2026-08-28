/**
 * The business behind the programme, and where to find it.
 *
 * Social links render only when they are filled in, so an empty handle leaves
 * the footer clean rather than pointing somewhere broken.
 */
export const SITE = {
  business: 'LMNTARY Performance',
  founder: 'Chris Bodman',
  email: 'chris@lmntaryperformance.com',
  website: 'https://lmntaryperformance.com',
  /** Shown on the legal pages. Update when the wording is signed off. */
  legalUpdated: '28 August 2026',
} as const

export type SocialLink = { label: string; url: string }

export const socials: SocialLink[] = [
  { label: 'Website', url: 'https://lmntaryperformance.com' },
  { label: 'Instagram', url: 'https://www.instagram.com/chrisbodman_/' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/chris-bodman-9a4ba340/' },
]
