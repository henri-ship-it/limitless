'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { modules, weeks } from '@/content/programme'
import { LockIcon, NowIndicator, TickIcon } from './icons'

type Props = {
  currentWeek: number
  openThrough: number
  completedWeeks: number[]
  isPro: boolean
}

export function Sidebar({ currentWeek, openThrough, completedWeeks, isPro }: Props) {
  const pathname = usePathname()
  const done = new Set(completedWeeks)

  return (
    <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-line">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-5 py-8">
        <ul className="mb-8 space-y-0.5">
          <TopLink
            href="/"
            label="Start Guide"
            active={pathname === '/'}
            marker={currentWeek === 0 ? <span className="radar" aria-hidden /> : null}
          />
          <TopLink href="/journal" label="Journal" active={pathname === '/journal'} />
          {isPro ? <TopLink href="/pro" label="Pro" active={pathname === '/pro'} /> : null}
        </ul>

        {modules.map((m) => (
          <div key={m.number} className="mb-7">
            <Link
              href={`/module/${m.number}`}
              className={`label mb-2 block hover:!text-ink ${
                pathname === `/module/${m.number}` ? '!text-ink' : ''
              }`}
            >
              {String(m.number).padStart(2, '0')} · {m.name}
            </Link>
            <ul className="border-l border-line">
              {m.weeks.map((n) => {
                const week = weeks.find((w) => w.number === n)!
                const locked = n > openThrough
                const active = pathname === `/week/${n}`
                const inner = (
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate">{week.title}</span>
                    {done.has(n) ? (
                      <TickIcon className="shrink-0 text-accent-ink" />
                    ) : n === currentWeek ? (
                      <span className="radar shrink-0" aria-hidden />
                    ) : locked ? (
                      <LockIcon className="shrink-0 text-ink-20" />
                    ) : null}
                  </span>
                )
                const base = '-ml-px block border-l py-1.5 pl-4 pr-1 text-[0.875rem]'
                return (
                  <li key={n}>
                    {locked ? (
                      <span className={`${base} border-transparent text-ink-40`}>{inner}</span>
                    ) : (
                      <Link
                        href={`/week/${n}`}
                        className={`${base} ${
                          active
                            ? 'border-ink font-medium text-ink'
                            : 'border-transparent text-ink-72 hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}

function TopLink({
  href,
  label,
  active,
  marker,
}: {
  href: string
  label: string
  active: boolean
  marker?: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between gap-2 py-1 text-[0.9375rem] ${
          active ? 'font-medium text-ink' : 'text-ink-72 hover:text-ink'
        }`}
      >
        <span>{label}</span>
        {marker}
      </Link>
    </li>
  )
}
