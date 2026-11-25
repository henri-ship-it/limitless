/**
 * The day, drawn.
 *
 * Three single answers, which as three lines of text read as trivia. Drawn as
 * one line across the day they become the thing somebody is supposed to act
 * on: a peak with the hours written under it, and a trough they can stop
 * defending.
 *
 * The curve is not data. It is three points somebody chose, joined smoothly so
 * the shape can be read at a glance, and it is labelled as what they said
 * rather than as a measurement. Nobody tracked their alertness hourly and the
 * figure must not pretend they did, which is why there is no y axis and no
 * numbers on it.
 */

const WIDTH = 520
const HEIGHT = 170
const LEFT = 8
const RIGHT = WIDTH - 8
const TOP = 18
const FLOOR = HEIGHT - 34

/** The hour each band sits on, for placing a point. */
const BANDS: Record<string, number> = {
  'Early morning, 5am to 8am': 6.5,
  'Mid morning, 8am to 11am': 9.5,
  'Midday, 11am to 2pm': 12.5,
  'Afternoon, 2pm to 5pm': 15.5,
  'Evening, 5pm to 8pm': 18.5,
  'Late evening, after 8pm': 21,
}

const FROM = 5.5
const TO = 22

function x(hour: number): number {
  const through = (hour - FROM) / (TO - FROM)
  return LEFT + Math.max(0, Math.min(1, through)) * (RIGHT - LEFT)
}

function y(level: number): number {
  return FLOOR - (level / 100) * (FLOOR - TOP)
}

/** A bell around an hour, so one answer lifts the hours either side of it. */
function bump(hour: number, centre: number, height: number, width = 3.1): number {
  return height * Math.exp(-((hour - centre) ** 2) / (2 * width ** 2))
}

export function DayCurve({
  sharpest,
  energised,
  drained,
}: {
  sharpest?: string
  energised?: string
  drained?: string
}) {
  const peak = sharpest ? BANDS[sharpest] : undefined
  const lift = energised ? BANDS[energised] : undefined
  const dip = drained ? BANDS[drained] : undefined
  if (peak === undefined) return null

  const points: string[] = []
  for (let hour = FROM; hour <= TO; hour += 0.25) {
    let level = 34
    level += bump(hour, peak, 56)
    if (lift !== undefined) level += bump(hour, lift, lift === peak ? 6 : 26, 2.7)
    if (dip !== undefined) level -= bump(hour, dip, 30, 2.6)
    points.push(`${x(hour).toFixed(1)},${y(Math.max(4, Math.min(100, level))).toFixed(1)}`)
  }

  const label = (hour: number) =>
    hour >= 12
      ? `${hour === 12 ? 12 : Math.floor(hour) - 12}${Math.floor(hour) === hour ? '' : ''}pm`
      : `${Math.floor(hour)}am`

  return (
    <figure className="mt-6">
      <div className="border border-line bg-bg px-3 pt-2 pb-1">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label={`Your day as you described it. Sharpest ${sharpest}${
            drained ? `, most drained ${drained}` : ''
          }.`}
        >
          {/* the hours, hairline */}
          {[6, 9, 12, 15, 18, 21].map((hour) => (
            <g key={hour}>
              <line
                x1={x(hour)}
                y1={TOP - 6}
                x2={x(hour)}
                y2={FLOOR}
                stroke="currentColor"
                className="text-ink-5"
                strokeWidth="1"
              />
              <text
                x={x(hour)}
                y={FLOOR + 18}
                textAnchor="middle"
                className="fill-ink-40"
                style={{ fontSize: 11 }}
              >
                {label(hour)}
              </text>
            </g>
          ))}

          <line
            x1={LEFT}
            y1={FLOOR}
            x2={RIGHT}
            y2={FLOOR}
            stroke="currentColor"
            className="text-ink-12"
            strokeWidth="1"
          />

          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* the peak, named */}
          <g>
            <line
              x1={x(peak)}
              y1={TOP - 6}
              x2={x(peak)}
              y2={FLOOR}
              stroke="currentColor"
              className="text-ink-20"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={x(peak)}
              y={TOP - 6}
              textAnchor={x(peak) > WIDTH - 120 ? 'end' : x(peak) < 120 ? 'start' : 'middle'}
              className="fill-ink font-caption"
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.04em',
                paintOrder: 'stroke',
                stroke: 'var(--color-bg)',
                strokeWidth: 4,
                strokeLinejoin: 'round',
              }}
            >
              SHARPEST
            </text>
          </g>

          {dip !== undefined && dip !== peak && (
            <text
              x={x(dip)}
              y={FLOOR - 8}
              textAnchor={x(dip) > WIDTH - 90 ? 'end' : x(dip) < 90 ? 'start' : 'middle'}
              className="fill-ink-40 font-caption"
              /* The trough is where the line is, so the label gets a halo
                 rather than sitting on top of it. */
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                paintOrder: 'stroke',
                stroke: 'var(--color-bg)',
                strokeWidth: 4,
                strokeLinejoin: 'round',
              }}
            >
              FLATTEST
            </text>
          )}
        </svg>
      </div>
    </figure>
  )
}
