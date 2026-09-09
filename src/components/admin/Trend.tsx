/**
 * A run of daily figures, drawn as bars.
 *
 * Deliberately not a charting library. There are two shapes on this page and
 * both are a list of numbers against a list of days; pulling in a dependency to
 * draw them would be more code, not less, and would bring its own colours.
 *
 * No y axis. The question a coach asks of this is "is the line holding up",
 * which the shape answers, and the exact figure is on the bar you hover. An
 * axis would add furniture and no information.
 */
export function Trend({
  points,
  label,
  suffix = '',
}: {
  points: { day: string; value: number }[]
  label: string
  suffix?: string
}) {
  const peak = Math.max(1, ...points.map((p) => p.value))
  const total = points.reduce((sum, p) => sum + p.value, 0)
  const busiest = points.reduce((best, p) => (p.value > best.value ? p : best), points[0])

  return (
    <div>
      <div className="!mb-3 flex flex-wrap items-baseline gap-x-3">
        <p className="label !mb-0">{label}</p>
        <p className="!mb-0 text-[0.8125rem] !text-ink-40">
          {total.toLocaleString()}
          {suffix} over {points.length} days
        </p>
      </div>

      <div className="flex h-24 items-end gap-[2px]">
        {points.map((point) => (
          <div
            key={point.day}
            className="group relative flex-1"
            title={`${readable(point.day)}: ${point.value}${suffix}`}
          >
            <div
              className="w-full rounded-sm"
              style={{
                height: `${Math.max(point.value > 0 ? 3 : 1, (point.value / peak) * 96)}px`,
                background:
                  point.value > 0 ? 'var(--color-accent)' : 'var(--color-line)',
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-2 flex justify-between">
        <span className="label !text-ink-40">{readable(points[0]?.day)}</span>
        {busiest && busiest.value > 0 ? (
          <span className="label !text-ink-40">
            best {busiest.value}
            {suffix} on {readable(busiest.day)}
          </span>
        ) : null}
        <span className="label !text-ink-40">{readable(points.at(-1)?.day)}</span>
      </div>
    </div>
  )
}

function readable(day?: string): string {
  if (!day) return ''
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}
