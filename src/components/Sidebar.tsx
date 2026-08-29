'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { modules, weeks } from '@/content/programme'
import {
  AccountIcon,
  AdminIcon,
  GuideIcon,
  JournalIcon,
  LockIcon,
  NowIndicator,
  ProIcon,
  TickIcon,
} from './icons'

type Props = {
  currentWeek: number
  openThrough: number
  completedWeeks: number[]
  isPro: boolean
  isAdmin: boolean
}

export function Sidebar({ currentWeek, openThrough, completedWeeks, isPro, isAdmin }: Props) {
  const pathname = usePathname()
  const done = new Set(completedWeeks)

  return (
    <aside className="hidden lg:block lg:w-64 lg:shrink-0 lg:border-r lg:border-line">
      <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto px-5 py-8">
        <ul className="mb-8 space-y-0.5">
          <TopLink
            href="/"
            label="Start Guide"
            icon={<GuideIcon />}
            active={pathname === '/'}
            marker={currentWeek === 0 ? <span className="radar" aria-hidden /> : null}
          />
          <TopLink
            href="/journal"
            label="Journal"
            icon={<JournalIcon />}
            /* An open entry is still the journal, and the sidebar should say so. */
            active={pathname.startsWith('/journal')}
          />
          {isPro ? (
            <TopLink href="/pro" label="Pro" icon={<ProIcon />} active={pathname === '/pro'} />
          ) : null}
          {isAdmin ? (
            <TopLink
              href="/admin"
              label="Admin"
              icon={<AdminIcon />}
              active={pathname.startsWith('/admin')}
            />
          ) : null}
          <TopLink
            href="/account"
            label="Your account"
            icon={<AccountIcon />}
            active={pathname === '/account'}
          />
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
  icon,
  active,
  marker,
}: {
  href: string
  label: string
  icon: React.ReactNode
  active: boolean
  marker?: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        /*
         * The negative margin lets the active tint sit in a padded box while
         * the icon still lines up with the module headings underneath, so the
         * two halves of the sidebar share one left edge.
         */
        className={`-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.9375rem] ${
          active
            ? 'bg-ink-8 font-medium text-ink'
            : 'text-ink-72 hover:bg-ink-3 hover:text-ink'
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {marker}
      </Link>
    </li>
  )
}
