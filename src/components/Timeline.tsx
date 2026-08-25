import Link from 'next/link'
import { modules, weeks } from '@/content/programme'
import { LockIcon, TickIcon } from './icons'

/**
 * The sixteen weeks as one run, so a member can see at a glance how far they
 * have come and what is still ahead. Onboarding sits at the start as week zero.
 */
export function Timeline({
  currentWeek,
  openThrough,
  completedWeeks,
}: {
  currentWeek: number
  openThrough: number
  completedWeeks: number[]
}) {
  const done = new Set(completedWeeks)
  const percent = Math.round((done.size / weeks.length) * 100)

  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <p className="label">
          {done.size} of {weeks.length} weeks complete
        </p>
        <p className="label">{percent}%</p>
      </div>

      <div className="mb-8 h-1 w-full bg-ink-8">
        <div
          className="h-full bg-accent-ink transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex w-14 shrink-0 flex-col gap-2">
          <div className="flex">
            <Marker label="00" caption="Onboarding" state={currentWeek >= 1 ? 'done' : 'now'} />
          </div>
          <p className="label !text-[0.625rem] truncate">Start</p>
        </div>

        {modules.map((m) => (
          <div key={m.number} className="flex flex-1 flex-col gap-2">
            <div className="flex gap-[3px]">
              {m.weeks.map((n) => {
                const state = done.has(n)
                  ? 'done'
                  : n === currentWeek
                    ? 'now'
                    : n > openThrough
                      ? 'locked'
                      : 'open'
                return <Marker key={n} label={String(n)} state={state} href={`/week/${n}`} />
              })}
            </div>
            <p className="label !text-[0.625rem] truncate">{m.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Marker({
  label,
  caption,
  state,
  href,
}: {
  label: string
  caption?: string
  state: 'done' | 'now' | 'open' | 'locked'
  href?: string
}) {
  const tone =
    state === 'done'
      ? 'border-accent-ink bg-accent-soft text-accent-ink'
      : state === 'now'
        ? 'border-ink bg-ink text-white'
        : state === 'locked'
          ? 'border-line bg-ink-3 text-ink-20'
          : 'border-line bg-surface text-ink-56 hover:border-ink hover:text-ink'

  const inner = (
    <span
      className={`flex h-9 flex-1 items-center justify-center border font-mono text-[0.625rem] transition-colors ${tone}`}
      title={caption ?? `Week ${label}`}
    >
      {state === 'done' ? <TickIcon /> : state === 'locked' ? <LockIcon /> : label}
    </span>
  )

  if (!href || state === 'locked') return <span className="flex flex-1">{inner}</span>

  return (
    <Link href={href} className="flex flex-1 !no-underline">
      {inner}
    </Link>
  )
}
