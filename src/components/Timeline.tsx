import Link from 'next/link'
import { modules, weeks, getWeek } from '@/content/programme'
import { LockIcon, TickIcon } from './icons'

type State = 'done' | 'now' | 'open' | 'locked'

/**
 * The sixteen weeks as one run, so a member can see at a glance how far they
 * have come and what is still ahead. Onboarding sits at the start as week zero.
 *
 * One row across on a wide screen. On a phone that same row put seventeen cells
 * into three hundred points, which clipped the week numbers and left padlocks
 * too small to read, so the modules stack instead: four rows of four, each cell
 * four times the width and big enough to tap.
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

  const stateOf = (n: number): State =>
    done.has(n) ? 'done' : n === currentWeek ? 'now' : n > openThrough ? 'locked' : 'open'

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
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Stacked, one module a row, on anything narrow. */}
      <div className="space-y-2.5 sm:hidden">
        <div className="flex items-center gap-3">
          <p className="label w-16 shrink-0">Start</p>
          <div className="flex w-16">
            <Marker label="00" caption="Onboarding" state={currentWeek >= 1 ? 'done' : 'now'} />
          </div>
        </div>

        {modules.map((m) => (
          <div key={m.number} className="flex items-center gap-3">
            <p className="label w-16 shrink-0 truncate">{m.name}</p>
            <div className="flex flex-1 gap-1.5">
              {m.weeks.map((n) => (
                <Marker
                  key={n}
                  label={String(n)}
                  caption={getWeek(n)?.title}
                  state={stateOf(n)}
                  href={`/week/${n}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* One run across, where there is room for it. */}
      <div className="hidden items-stretch gap-3 sm:flex">
        <div className="flex w-14 shrink-0 flex-col gap-2">
          <div className="flex">
            <Marker label="00" caption="Onboarding" state={currentWeek >= 1 ? 'done' : 'now'} />
          </div>
          <p className="label !text-[0.625rem] truncate">Start</p>
        </div>

        {modules.map((m) => (
          <div key={m.number} className="flex flex-1 flex-col gap-2">
            <div className="flex gap-[3px]">
              {m.weeks.map((n) => (
                <Marker
                  key={n}
                  label={String(n)}
                  caption={getWeek(n)?.title}
                  state={stateOf(n)}
                  href={`/week/${n}`}
                />
              ))}
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
  state: State
  href?: string
}) {
  const tone =
    state === 'done'
      ? 'border-accent bg-accent-soft text-accent-ink'
      : state === 'now'
        ? 'border-ink bg-ink text-white'
        : state === 'locked'
          ? 'border-line bg-ink-3 text-ink-20'
          : 'border-line bg-surface text-ink-56 hover:border-ink hover:text-ink'

  const inner = (
    <span
      className={`flex h-11 flex-1 items-center justify-center border font-mono text-[0.6875rem] transition-colors sm:h-9 sm:text-[0.625rem] ${tone}`}
    >
      {state === 'done' ? <TickIcon /> : state === 'locked' ? <LockIcon /> : label}
    </span>
  )

  /*
   * The number alone says nothing, so hovering names the chapter. Hidden on a
   * phone, where there is no hover and the tooltip would only ever appear
   * mid-tap on the way to the week itself.
   */
  const tooltip = caption ? (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-1/2 z-20 hidden -translate-x-1/2 whitespace-nowrap border border-line bg-surface px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.04em] text-ink uppercase shadow-[0_6px_20px_-8px_rgba(0,0,0,0.25)] sm:group-hover:block sm:group-focus-visible:block"
    >
      {caption}
    </span>
  ) : null

  if (!href || state === 'locked') {
    return (
      <span className="group relative flex flex-1" title={caption}>
        {inner}
        {tooltip}
      </span>
    )
  }

  return (
    <Link href={href} className="group relative flex flex-1 !no-underline" title={caption}>
      {inner}
      {tooltip}
    </Link>
  )
}
