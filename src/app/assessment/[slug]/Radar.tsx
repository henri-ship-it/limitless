import { NORMS } from '@/content/know-thyself-norms'

/**
 * The four styles plotted on one figure.
 *
 * A note on what this is for, because it is easy to misuse. A radar is poor at
 * the job the bars underneath already do: its area grows as the square of the
 * value, so it exaggerates, and the shape depends on the order the axes happen
 * to sit in. The bars are where somebody reads the numbers.
 *
 * This is here for the thing bars cannot show, which is the shape of a profile
 * at a glance and how it sits against everybody else's. The group median is
 * drawn as a second outline, so an even spread and a spiked one are instantly
 * different pictures. Both polygons are outlines rather than fills, so neither
 * hides the other and no area is doing the talking.
 *
 * Axes are in the canonical style order, not ranked, so two people's figures
 * can be laid side by side. Every axis is labelled with its own value: the
 * reader never matches a colour to a key.
 */

/*
 * Wider than it is tall, because the left and right labels need room to sit
 * outside the plot. At 300 square the longest name was clipped by the edge.
 */
const WIDTH = 380
const HEIGHT = 300
const CX = WIDTH / 2
const CY = HEIGHT / 2
const RADIUS = 100
const RINGS = [25, 50, 75, 100]

type Point = { x: number; y: number }

function pointAt(index: number, count: number, value: number): Point {
  // Start at twelve o'clock and work clockwise, which is how a plate is read.
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  const r = (Math.max(0, Math.min(100, value)) / 100) * RADIUS
  return { x: CX + Math.cos(angle) * r, y: CY + Math.sin(angle) * r }
}

function polygon(values: number[]): string {
  return values
    .map((value, index) => {
      const { x, y } = pointAt(index, values.length, value)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function Radar({
  scores,
  lead,
  axes,
}: {
  scores: Record<string, number>
  lead: string
  /** Canonical order, so one figure can be compared with another. */
  axes: string[]
}) {
  const mine = axes.map((name) => scores[name] ?? 0)
  const theirs = axes.map((name) => NORMS[name] ?? 50)

  return (
    <figure className="mt-8">
      <div className="border border-line bg-bg p-4">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="mx-auto block h-auto w-full max-w-[380px]"
          role="img"
          aria-label={`Your four scores plotted against the group median. ${axes
            .map((name) => `${name} ${scores[name] ?? 0}%, median ${NORMS[name] ?? 50}%`)
            .join('. ')}`}
        >
          {/* the rings, hairline, the outermost one a touch stronger */}
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={polygon(axes.map(() => ring))}
              fill="none"
              stroke="currentColor"
              className={ring === 100 ? 'text-ink-20' : 'text-ink-8'}
              strokeWidth="1"
            />
          ))}

          {/* spokes */}
          {axes.map((name, index) => {
            const end = pointAt(index, axes.length, 100)
            return (
              <line
                key={name}
                x1={CX}
                y1={CY}
                x2={end.x}
                y2={end.y}
                stroke="currentColor"
                className="text-ink-8"
                strokeWidth="1"
              />
            )
          })}

          {/* everybody else, as a dashed outline */}
          <polygon
            points={polygon(theirs)}
            fill="none"
            stroke="currentColor"
            className="text-ink-40"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* this person */}
          <polygon
            points={polygon(mine)}
            fill="var(--color-accent)"
            fillOpacity="0.14"
            stroke="var(--color-accent-ink)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* a marker on each of their own points, ringed so it reads over a line */}
          {mine.map((value, index) => {
            const { x, y } = pointAt(index, mine.length, value)
            return (
              <circle
                key={axes[index]}
                cx={x}
                cy={y}
                r="4"
                fill="var(--color-accent-ink)"
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
            )
          })}

          {/* direct labels, so nothing is read off a key */}
          {axes.map((name, index) => {
            const at = pointAt(index, axes.length, 122)
            const anchor = at.x > CX + 6 ? 'start' : at.x < CX - 6 ? 'end' : 'middle'
            return (
              <text
                key={name}
                x={at.x}
                y={at.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={name === lead ? 'fill-ink' : 'fill-ink-56'}
                style={{ fontSize: 11, fontWeight: name === lead ? 600 : 400 }}
              >
                {name} {scores[name] ?? 0}
              </text>
            )
          })}
        </svg>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.8125rem] text-ink-40">
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-0.5 w-5 bg-accent-ink" />
          You
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-0.5 w-5"
            style={{
              backgroundImage:
                'repeating-linear-gradient(to right, var(--color-ink-40) 0 4px, transparent 4px 7px)',
            }}
          />
          Everybody else
        </span>
      </figcaption>
    </figure>
  )
}
