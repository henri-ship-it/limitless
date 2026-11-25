import type { Metadata } from 'next'

/**
 * The holding page for the bare short domain.
 *
 * `unlock.lmntaryperformance.com/` served the Performance Playbook scorecard,
 * because ScoreApp served its domain default at the root. That scorecard is
 * being replaced by the capability assessment, so the root has nothing to show
 * yet. It briefly redirected to the public site instead, which was honest but
 * read as though the address had been abandoned. Anyone arriving here has
 * typed the domain or scanned a code that did not read cleanly, and the kind
 * thing is to tell them something is coming rather than to move them on.
 *
 * It is reached by a host rewrite in `next.config`, so only the short domain
 * sees it and the platform's own root is untouched. Middleware runs before
 * that rewrite and has a matching exemption, without which this would sit
 * behind the sign-in wall.
 *
 * The build echoes the Mindset Matters email banner: the badge arrives, the
 * teal block wipes in from the left, the word follows it, and the lines below
 * settle last.
 */
export const metadata: Metadata = {
  title: 'LMNTARY Performance',
  description: 'Coming soon.',
  /* A page that says "coming soon" has no business in a search result. */
  robots: { index: false, follow: false },
}

export default function HoldingPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-bg px-6">
      {/*
       * The paper. The banner is printed on a grain rather than on a flat
       * grey, and without it the teal block floats on nothing.
       */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden>
        <filter id="holding-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#holding-grain)" />
      </svg>

      <div className="relative flex flex-col items-center">
        {/*
         * The badge is the one from the email banner, a single filled path at
         * 40 by 40. Served as a file rather than inlined because it is 25 kB
         * of outlined lettering and nothing here needs to address its parts.
         */}
        <img
          src="/brand/lmntary-badge.svg"
          alt="LMNTARY Performance"
          width={128}
          height={128}
          className="holding-badge w-[104px] sm:w-[124px]"
        />

        <div className="holding-block mt-9 bg-accent px-4 py-2 sm:mt-11">
          <h1 className="holding-word font-caption text-[1.75rem] leading-[0.95] font-bold tracking-[0.015em] text-ink uppercase sm:text-[2.25rem]">
            Coming soon
          </h1>
        </div>

        <p className="holding-tail mt-8 text-center text-[0.9375rem] leading-relaxed text-ink-56">
          A new assessment is on its way.
        </p>

        <a
          href="https://lmntaryperformance.com"
          className="holding-tail-2 label mt-5 !text-ink-40 !no-underline hover:!text-ink"
        >
          lmntaryperformance.com
        </a>
      </div>

      <style>{`
        .holding-badge {
          animation: holding-arrive 620ms cubic-bezier(0.2, 0.7, 0.3, 1) both;
        }
        @keyframes holding-arrive {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: none; }
        }

        /*
         * Block first, word a beat behind it, both wiping from the left. Two
         * clip-paths rather than one, because a single wipe over the pair
         * reveals the teal and the letters together and loses the moment in
         * the banner where the block lands empty and then fills.
         */
        .holding-block {
          animation: holding-wipe 540ms cubic-bezier(0.65, 0, 0.35, 1) 480ms both;
        }
        .holding-word {
          animation: holding-wipe 500ms cubic-bezier(0.65, 0, 0.35, 1) 660ms both;
        }
        @keyframes holding-wipe {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0 0 0); }
        }

        .holding-tail   { animation: holding-settle 520ms ease-out 1080ms both; }
        .holding-tail-2 { animation: holding-settle 520ms ease-out 1240ms both; }
        @keyframes holding-settle {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: none; }
        }

        /*
         * Still, and complete. Every animation here fills both ways, so
         * switching them off leaves the finished lockup rather than an empty
         * page, which is what a wipe held at its first frame would give.
         */
        @media (prefers-reduced-motion: reduce) {
          .holding-badge,
          .holding-block,
          .holding-word,
          .holding-tail,
          .holding-tail-2 {
            animation: none;
          }
        }
      `}</style>
    </main>
  )
}
