import { NORMS } from '@/content/know-thyself-norms'
import { styleFor } from '@/content/know-thyself'

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
 * can be laid side by side. Every axis is labelled with its own mark, name and
 * value: the reader never matches a colour to a key.
 *
 * The grid is drawn as **circles**, not as rings joining the four axis points.
 * A four-axis web makes diamonds, which read as a shape in their own right and
 * fight the one the data is drawing. Circles are inert, which is what a grid
 * should be. Two of them, at fifty and a hundred, because the numbers are
 * written on the figure and more rings is more to look past.
 */

const WIDTH = 440
const HEIGHT = 372
const CX = WIDTH / 2
const CY = 198
const RADIUS = 132
/**
 * The grid, as fractions of the full radius.
 *
 * Ten of them, which is the density the printed figure uses. They are
 * hairlines at the lightest ink in the set, so they give the eye something to
 * measure against without competing with the two shapes drawn on top.
 */
const RINGS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]

type Point = { x: number; y: number }

/**
 * Axes sit on the diagonals, so the four labels land in the corners where
 * there is room for a mark, a name and a number without any of them clipping.
 * Index 0 is top right and they run clockwise.
 */
function angleAt(index: number, count: number): number {
  return -Math.PI / 4 + (Math.PI * 2 * index) / count
}

function pointAt(index: number, count: number, value: number): Point {
  const angle = angleAt(index, count)
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
      <div>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="mx-auto block h-auto w-full max-w-[440px]"
          role="img"
          aria-label={`Your four scores plotted against the group median. ${axes
            .map((name) => `${name} ${scores[name] ?? 0}%, median ${NORMS[name] ?? 50}%`)
            .join('. ')}`}
        >
          {/* the grid: plain circles, the outer one a touch stronger */}
          {RINGS.map((ring) => (
            <circle
              key={ring}
              cx={CX}
              cy={CY}
              r={RADIUS * ring}
              fill="none"
              stroke="currentColor"
              className={ring === 1 ? 'text-ink-20' : ring === 0.5 ? 'text-ink-12' : 'text-ink-5'}
              strokeWidth="1"
            />
          ))}

          {/* spokes, out to the edge of the grid */}
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
            stroke="var(--color-accent)"
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
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth="2"
              />
            )
          })}

          {/*
            * Direct labels in the corners: the style's own printed mark, its
            * name, and its score. Nothing on this figure is read off a key.
            */}
          {axes.map((name, index) => {
            const style = styleFor(name)
            const at = pointAt(index, axes.length, 100)
            const right = at.x > CX
            const below = at.y > CY
            const x = at.x + (right ? 24 : -24)
            const y = at.y + (below ? 46 : -28)
            const leading = name === lead
            return (
              <g
                key={name}
                className="group"
                transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
              >
                <title>{`${name}, ${scores[name] ?? 0} out of 100`}</title>
                {style && (
                  <image
                    href={style.icon}
                    /* Clear of the name by a full line. The mark used to sit on
                       the last letter of the longer names. */
                    x={right ? 0 : -26}
                    y={-54}
                    width="26"
                    height="26"
                    opacity={leading ? 1 : 0.4}
                  />
                )}
                <text
                  x={0}
                  y={-12}
                  textAnchor={right ? 'start' : 'end'}
                  className={`font-caption ${leading ? 'fill-ink' : 'fill-ink-40'}`}
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {name.toUpperCase()}
                </text>
                {/*
                  * The number is on the bars already, and printing it here too
                  * is the same quantity said twice. It comes back on hover, and
                  * on a touch screen the figure is a tap away in the list
                  * underneath.
                  */}
                <text
                  x={0}
                  y={10}
                  textAnchor={right ? 'start' : 'end'}
                  className="fill-ink-40 font-caption opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  style={{ fontSize: 15, fontWeight: 700 }}
                  aria-hidden
                >
                  {scores[name] ?? 0}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.8125rem] text-ink-40">
        <span className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-0.5 w-5 bg-accent" />
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
