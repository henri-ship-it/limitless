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

const config: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: `/:slug(${PRINTED.join('|')})`,
          has: [{ type: 'host', value: UNLOCK }],
          destination: '/assessment/:slug',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default config
