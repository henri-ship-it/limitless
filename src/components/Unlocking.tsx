/**
 * The loading state.
 *
 * The Limitless mark drawing itself: a lit stroke flies around a figure of
 * eight and the hairline follows in its wake, so one lap completes the symbol
 * and every lap after it keeps running. It replaces a padlock springing open,
 * which said "you have been let in" — true of a week unlocking, wrong for a
 * page that is merely on its way. The loop says the thing the programme says,
 * which is that there is no finish line.
 *
 * The geometry is a lemniscate of Gerono, x = cos t, y = sin 2t, sampled into
 * sixteen cubic segments. Taking the curve from its parametrisation rather
 * than drawing two circles by eye is what puts the crossing at a true forty
 * five degrees and keeps the lobes equal.
 *
 * Every layer is the same path at `pathLength="1000"`, so all the figures
 * below are thousandths of a lap and the comet can be assembled by arithmetic
 * rather than by trial.
 */

/** One lap, 292.67 user units long, normalised to 1000 by `pathLength`. */
const LOOP =
  'M108 32C108 38.28 106.75 44.53 104.35 48.97C101.94 53.41 98.38 56 93.94 56C89.5 56 84.17 53.41 78.37 48.97C72.56 44.53 66.28 38.28 60 32C53.72 25.72 47.44 19.47 41.63 15.03C35.83 10.59 30.5 8 26.06 8C21.62 8 18.06 10.59 15.65 15.03C13.25 19.47 12 25.72 12 32C12 38.28 13.25 44.53 15.65 48.97C18.06 53.41 21.62 56 26.06 56C30.5 56 35.83 53.41 41.63 48.97C47.44 44.53 53.72 38.28 60 32C66.28 25.72 72.56 19.47 78.37 15.03C84.17 10.59 89.5 8 93.94 8C98.38 8 101.94 10.59 104.35 15.03C106.75 19.47 108 25.72 108 32Z'

/**
 * How long one lap takes.
 *
 * This is the whole clock: the symbol is complete when the first lap ends, so
 * the figure is really "how long before a member sees a finished mark". Most
 * of the platform answers inside a second, and a loader that has not got round
 * its own shape by the time the page arrives has shown a squiggle rather than
 * a logo. Under a second means the common case completes.
 */
const LAP = 0.9

/** The lit head, in thousandths of a lap. Short enough to read as a point. */
const HEAD = 20

/**
 * Where the head is at each moment of a lap, as `[percent, thousandths]`.
 *
 * Not a constant pace. The head falls and climbs like a bead on a wire, which
 * is the one easing a figure of eight asks for by itself: it has two descents
 * and two climbs per lap, so an even pace is the only version that ignores the
 * shape it is drawing. Speed comes from conservation of energy,
 * v = sqrt(v_top^2 + 2g(y - y_top)), with the constant chosen so the bottom of
 * a lobe runs at two and a half times the speed of the top. The result swings
 * between roughly 0.6 and 1.45 of an even pace, slowest at the top of each
 * lobe and quickest at the bottom.
 *
 * Twenty five readings rather than a formula because CSS cannot evaluate one.
 * They were taken by walking the curve by true arc length, integrating
 * ds / v(s) for the time, and inverting that to ask where the head has got to
 * at each equal instant. Linear interpolation between them is finer than the
 * frame rate at this duration, so the joins are not visible. Both halves are
 * identical by symmetry, which is the quickest check that the table is right.
 */
const PROFILE: readonly (readonly [number, number])[] = [
  [0, 0.0],
  [4.17, 51.6],
  [8.33, 111.3],
  [12.5, 170.8],
  [16.67, 224.4],
  [20.83, 271.4],
  [25.0, 311.6],
  [29.17, 345.4],
  [33.33, 373.8],
  [37.5, 398.9],
  [41.67, 425.1],
  [45.83, 458.0],
  [50.0, 500.0],
  [54.17, 551.6],
  [58.33, 611.3],
  [62.5, 670.8],
  [66.67, 724.4],
  [70.83, 771.4],
  [75.0, 811.6],
  [79.17, 845.4],
  [83.33, 873.8],
  [87.5, 898.9],
  [91.67, 925.1],
  [95.83, 958.0],
  [100, 1000.0],
]

/**
 * The tail, as nested dashes that all finish at the head.
 *
 * A single dash cannot fade out: SVG has no gradient along a stroke, so a
 * lone trail ends in a round cap, and a hard-edged comet is the thing that
 * gives a loading state away. Stacking lengths instead means the alpha
 * compounds where they overlap, so the stroke builds from a tenth at the far
 * end to solid at the head: roughly 0.10, 0.23, 0.38, 0.57, 0.81, 1. Six
 * steps over a fifth of the lap, which the bloom then smooths into a ramp.
 */
const TAIL = [
  { length: 230, opacity: 0.1 },
  { length: 170, opacity: 0.14 },
  { length: 120, opacity: 0.2 },
  { length: 78, opacity: 0.3 },
  { length: 44, opacity: 0.55 },
  { length: HEAD, opacity: 1 },
]

/** The soft bloom, which hugs the head and the brightest part of the tail. */
const BLOOM = 120

/**
 * Where a dash of this length must start so that it ends with the head.
 *
 * The head occupies thousandths `s` to `s + HEAD`; a dash of length L ending
 * there begins at `s + HEAD - L`, and a dash offset is the negative of where
 * it begins. So every layer runs the same lap, displaced by its own length.
 */
const startsAt = (length: number) => length - HEAD

/**
 * One layer's flight: the shared profile, shifted to where that layer starts.
 *
 * The track is the same movement read the other way round. It is drawn by
 * revealing thousandths 0 to `1000 - offset`, so starting it a whole lap back
 * makes its leading edge sit exactly under the head, and the line appears to
 * be laid down by the thing flying ahead of it.
 */
const flight = (name: string, from: number) =>
  `@keyframes ${name}{` +
  PROFILE.map(([at, gone]) => `${at}%{stroke-dashoffset:${+(from - gone).toFixed(1)}}`).join('') +
  '}'

export function Unlocking({ label = 'Unlocking' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-7" role="status">
      {/*
       * The viewBox is the loop's own 96 by 48 plus twenty units of air on
       * every side. The bloom is a blurred copy of the stroke rather than a
       * shadow, so it spreads well past the line and would be clipped square
       * at the edges without the margin.
       */}
      <svg viewBox="-20 -20 176 104" className="loop w-[164px]" fill="none" aria-hidden>
        <defs>
          {/*
           * Laid across the loop in user space, not along the stroke, which
           * SVG cannot do. Fixing the gradient to the geometry is what makes
           * the head change colour as it travels: deep in the bottom left,
           * brand green through the middle, almost white off the top right.
           * A gradient that travelled with the head would hold one colour and
           * the flight would go flat.
           *
           * The lightest stop is held well short of white. Taken further it
           * lifted prettily off a screenshot and then vanished into the page
           * for the stretch across the top right, which is a quarter of every
           * lap spent with the brightest thing on screen being the faintest.
           */}
          <linearGradient id="loop-flow" gradientUnits="userSpaceOnUse" x1="12" y1="56" x2="108" y2="8">
            <stop offset="0%" stopColor="#049e87" />
            <stop offset="40%" stopColor="#04dfbf" />
            <stop offset="74%" stopColor="#3de7d1" />
            <stop offset="100%" stopColor="#04c6a9" />
          </linearGradient>

          <filter id="loop-bloom" x="-30%" y="-55%" width="160%" height="210%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>
        </defs>

        {/* The wake. One lap, held on its last frame. */}
        <path
          d={LOOP}
          pathLength="1000"
          className="loop-track"
          stroke="var(--color-ink-12)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/*
         * The comet. It fades in over the time the tail needs to clear the
         * start, because until then the tail wraps round a loop that has not
         * been drawn yet and lights the far end of nothing.
         */}
        <g className="loop-comet">
          <path
            d={LOOP}
            pathLength="1000"
            className="loop-glow"
            stroke="url(#loop-flow)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#loop-bloom)"
          />
          {TAIL.map((step) => (
            <path
              key={step.length}
              d={LOOP}
              pathLength="1000"
              className={`loop-step loop-step-${step.length}`}
              stroke="url(#loop-flow)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ))}
        </g>
      </svg>

      <p className="loop-label label">{label}</p>

      <style>{`
        /*
         * A breath on the whole mark, at a period that shares no factor with
         * the lap. Two motions that line up read as one mechanism ticking;
         * two that drift read as something alive.
         */
        .loop {
          animation: loop-breathe 4.3s ease-in-out infinite;
          will-change: transform;
        }

        .loop-track {
          stroke-dasharray: 1000;
          animation: loop-draw ${LAP}s linear both;
        }
        ${flight('loop-draw', 1000)}

        .loop-step { will-change: stroke-dashoffset; }

        ${TAIL.map(
          (step) => `
        .loop-step-${step.length} {
          stroke-dasharray: ${step.length} ${1000 - step.length};
          opacity: ${step.opacity};
          animation: loop-fly-${step.length} ${LAP}s linear infinite;
        }
        ${flight(`loop-fly-${step.length}`, startsAt(step.length))}`,
        ).join('')}

        .loop-glow {
          stroke-dasharray: ${BLOOM} ${1000 - BLOOM};
          animation:
            loop-fly-glow ${LAP}s linear infinite,
            loop-flare 2.3s ease-in-out infinite;
        }
        ${flight('loop-fly-glow', startsAt(BLOOM))}
        @keyframes loop-flare {
          0%, 100% { opacity: 0.32; }
          50%      { opacity: 0.58; }
        }

        .loop-comet { animation: loop-arrive 220ms ease-out both; }
        .loop-label { animation: loop-arrive 420ms ease-out both; }
        @keyframes loop-arrive {
          from { opacity: 0; filter: blur(3px); }
          to   { opacity: 1; filter: none; }
        }

        @keyframes loop-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.025); }
        }

        /*
         * Still, but not empty. The loop stays, drawn in the accent it would
         * have been traced in, so the mark is the same mark.
         */
        @media (prefers-reduced-motion: reduce) {
          .loop,
          .loop-track,
          .loop-comet,
          .loop-label { animation: none; }
          .loop-track {
            stroke: url(#loop-flow);
            stroke-dasharray: none;
            opacity: 0.8;
          }
          .loop-comet { display: none; }
        }
      `}</style>
    </div>
  )
}
