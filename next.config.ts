import type { NextConfig } from 'next'

// typedRoutes is off: every link in here is built from week and module numbers,
// so the literal-route checking costs more than it catches.

/**
 * The slugs printed as QR codes in the journals.
 *
 * These are fixed forever: a book already in somebody's hands cannot be
 * reissued. Written out rather than read from `content/assessments.ts`,
 * because this file is loaded before the path aliases exist, and because a
 * slug being printed is a separate fact from an assessment existing. Adding an
 * assessment should not quietly open a new public URL on the short domain.
 */
const PRINTED = ['know-thyself', 'know-thyself-chapter-01', 'light-the-fire']

/**
 * The domain the QR codes point at.
 *
 * `unlock.lmntaryperformance.com/know-thyself` was a ScoreApp address and is
 * now ours. It serves the assessment that lives at `/assessment/know-thyself`
 * here, as a rewrite rather than a redirect: the address bar keeps the short
 * printed URL, the member stays on one origin, and their session comes with
 * them. Only the printed slugs answer on it; everything else falls through to
 * the normal routes, so the platform itself is not duplicated on a second
 * domain.
 */
const UNLOCK = 'unlock.lmntaryperformance.com'

/**
 * The two questionnaire paths that were ScoreApp pages and are now journeys.
 *
 * Neither is printed, so neither is in PRINTED, but both are in enrolment and
 * end of programme emails already sent to every cohort. Those emails cannot be
 * recalled: cohort 4.0 has a week sixteen link sitting in an inbox, and the
 * cohorts before it have their pre-assessment ones. Without these the link
 * signs the member in and then 404s, which is worse than a dead link because
 * it looks like the platform is broken rather than the address being old.
 *
 * Redirects rather than rewrites: unlike the printed slugs there is no book to
 * respect, so the member may as well end up on the real address and see where
 * they are. Both land behind the sign-in wall, which is correct, because a
 * journey files against an account. The config's redirects run before the
 * middleware, so the sign-in page still gets its `next` and sends them on.
 */
const RETIRED: Record<string, string> = {
  '/pre-assessment': '/journey/baseline',
  '/post-assessment': '/journey/reflection',
}

const config: NextConfig = {
  async redirects() {
    return [
      ...Object.entries(RETIRED).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
    ]
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: `/:slug(${PRINTED.join('|')})`,
          has: [{ type: 'host', value: UNLOCK }],
          destination: '/assessment/:slug',
        },
        /*
         * The bare short domain.
         *
         * It used to serve the Performance Playbook scorecard, because
         * ScoreApp served its domain default at the root. That scorecard is
         * being replaced by the capability assessment, so until that is live
         * the root shows a holding page.
         *
         * A rewrite rather than a redirect, for the same reason the printed
         * slugs are: the address bar keeps the short domain, so somebody who
         * typed it is not quietly moved somewhere else. It also leaves the
         * root free to serve the assessment itself later, by changing this one
         * destination, with nothing cached in anybody's browser to undo.
         */
        {
          source: '/',
          has: [{ type: 'host', value: UNLOCK }],
          destination: '/holding',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default config
