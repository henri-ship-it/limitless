'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { modules, weeks, type Tier } from '@/content/programme'

type Props = {
  completedWeeks: number[]
  currentWeek: number
  tier: Tier
}

export function Nav({ completedWeeks, currentWeek, tier }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const done = new Set(completedWeeks)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="label flex w-full items-center justify-between border-b border-line bg-band px-4 py-3 lg:hidden"
      >
        <span>Contents</span>
        <span aria-hidden>{open ? '—' : '+'}</span>
      </button>

      <nav
        className={`${open ? 'block' : 'hidden'} border-b border-line bg-bg lg:flex lg:items-start lg:border-b-0`}
        aria-label="Programme"
      >
        <div className="border-line lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-r">
          <p className="label border-b border-line bg-band px-4 py-3">Programme</p>
          <RailLink href="/" label="Start Guide" active={pathname === '/'} />
          {modules.map((m) => (
            <RailLink
              key={m.number}
              href={`/module/${m.number}`}
              label={m.name}
              meta={`0${m.number}`}
              active={pathname === `/module/${m.number}`}
            />
          ))}
          <p className="label border-y border-line bg-band px-4 py-3">Library</p>
          <RailLink href="/journal" label="Journal" meta="112 entries" active={pathname === '/journal'} />
          {tier === 'pro' ? (
            <RailLink href="/pro" label="Pro" meta="Community" active={pathname === '/pro'} />
          ) : null}
        </div>

        <div className="border-line lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] lg:w-80 lg:shrink-0 lg:overflow-y-auto lg:border-r">
          <div className="label flex items-center justify-between border-b border-line bg-band px-4 py-3">
            <span>The 16 weeks</span>
            <span>
              {done.size}/{weeks.length}
            </span>
          </div>
          {modules.map((m) => (
            <div key={m.number}>
              <p className="label border-b border-line bg-band/60 px-4 py-2">
                {`0${m.number}`} {m.name}
              </p>
              {m.weeks.map((n) => {
                const week = weeks.find((w) => w.number === n)!
                const locked = n > currentWeek
                return (
                  <WeekRow
                    key={n}
                    n={n}
                    title={week.title}
                    href={`/week/${n}`}
                    active={pathname === `/week/${n}`}
                    done={done.has(n)}
                    locked={locked}
                    isCurrent={n === currentWeek}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}

function RailLink({
  href,
  label,
  meta,
  active,
}: {
  href: string
  label: string
  meta?: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between border-b border-line px-4 py-3 text-[0.9375rem] transition-colors ${
        active ? 'bg-surface font-semibold text-ink' : 'text-ink-muted hover:bg-surface hover:text-ink'
      }`}
    >
      <span>{label}</span>
      {meta ? <span className="label">{meta}</span> : null}
    </Link>
  )
}

function WeekRow({
  n,
  title,
  href,
  active,
  done,
  locked,
  isCurrent,
}: {
  n: number
  title: string
  href: string
  active: boolean
  done: boolean
  locked: boolean
  isCurrent: boolean
}) {
  const body = (
    <>
      <span className="flex min-w-0 items-baseline gap-3">
        <span className="label w-5 shrink-0">{String(n).padStart(2, '0')}</span>
        <span className="truncate">{title}</span>
      </span>
      <span className="ml-3 shrink-0">
        {done ? (
          <span className="text-accent" aria-label="Completed">
            ✓
          </span>
        ) : isCurrent ? (
          <span className="label !text-accent">Now</span>
        ) : locked ? (
          <span className="label" aria-label="Locked">
            ·
          </span>
        ) : null}
      </span>
    </>
  )

  const base =
    'flex items-center justify-between border-b border-line px-4 py-3 text-[0.9375rem]'

  if (locked) {
    return (
      <div className={`${base} cursor-default text-ink-muted/60`} aria-disabled>
        {body}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={`${base} transition-colors ${
        active ? 'bg-surface font-semibold text-ink' : 'text-ink hover:bg-surface'
      }`}
    >
      {body}
    </Link>
  )
}
