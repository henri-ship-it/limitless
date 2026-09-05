'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { MemberRow } from '@/lib/admin'
import { readable, since } from '@/lib/format'
import { weeks } from '@/content/programme'

type Key = 'name' | 'tier' | 'lastSeen' | 'wrote' | 'time' | 'weeks' | 'entries'

const COLUMNS: { key: Key; label: string }[] = [
  { key: 'name', label: 'Member' },
  { key: 'tier', label: 'Tier' },
  { key: 'lastSeen', label: 'Last seen' },
  { key: 'wrote', label: 'Wrote' },
  { key: 'time', label: 'Time' },
  { key: 'weeks', label: 'Weeks' },
  { key: 'entries', label: 'Entries' },
]

const at = (iso: string | null) => (iso ? Date.parse(iso) : 0)

/**
 * The cohort, sortable and filterable.
 *
 * Opens on the quietest first, because the reason to look at this list is to
 * find who has gone missing rather than to admire who has not.
 */
export function CohortTable({ members }: { members: MemberRow[] }) {
  const [sort, setSort] = useState<Key>('lastSeen')
  const [ascending, setAscending] = useState(true)
  const [tier, setTier] = useState<'all' | 'pro' | 'core'>('all')
  const [search, setSearch] = useState('')

  /*
   * Which cohort is on show. Everyone is 4.0 today, so this is one tab and
   * stays out of the way; it earns its place the moment an earlier cohort is
   * imported, which is the whole reason the column exists.
   */
  const cohorts = [...new Set(members.map((m) => m.cohort))].sort().reverse()
  const [cohort, setCohort] = useState(cohorts[0] ?? '4.0')

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()

    const filtered = members.filter((m) => {
      if (m.cohort !== cohort) return false
      if (tier !== 'all' && m.tier !== tier) return false
      if (!term) return true
      return `${m.firstName ?? ''} ${m.email}`.toLowerCase().includes(term)
    })

    const by: Record<Key, (m: MemberRow) => number | string> = {
      name: (m) => (m.firstName ?? m.email).toLowerCase(),
      tier: (m) => m.tier,
      lastSeen: (m) => at(m.lastSeenAt),
      wrote: (m) => at(m.lastWroteAt),
      time: (m) => m.secondsSpent,
      weeks: (m) => m.weeksComplete,
      entries: (m) => m.entriesWritten,
    }

    return [...filtered].sort((a, b) => {
      const x = by[sort](a)
      const y = by[sort](b)
      const order =
        typeof x === 'string' ? String(x).localeCompare(String(y)) : Number(x) - Number(y)
      return ascending ? order : -order
    })
  }, [members, sort, ascending, tier, search, cohort])

  function choose(key: Key) {
    if (key === sort) {
      setAscending((v) => !v)
      return
    }
    setSort(key)
    // Names read best A to Z. Everything else is most interesting at the low end.
    setAscending(key === 'name' || key === 'tier')
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-x-5 gap-y-2 border-b border-line">
        {cohorts.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setCohort(option)}
            aria-selected={cohort === option}
            className={`label -mb-px border-b-2 pb-2.5 ${
              cohort === option ? '!border-ink !text-ink' : 'border-transparent hover:!text-ink'
            }`}
          >
            Limitless {option}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a member"
          className="w-full max-w-56 border border-line bg-surface px-3 py-2 text-[0.875rem] outline-none focus:border-ink"
        />
        <div className="flex gap-1.5">
          {(['all', 'pro', 'core'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTier(option)}
              aria-pressed={tier === option}
              className={`pill ${
                tier === option
                  ? '!border-accent !bg-accent-soft !text-ink'
                  : 'hover:!border-line-strong hover:!text-ink'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="label ml-auto">{rows.length} shown</span>
      </div>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {COLUMNS.map((column) => (
                <th key={column.key} className="py-2 pr-4 font-normal">
                  <button
                    type="button"
                    onClick={() => choose(column.key)}
                    className={`label flex items-center gap-1 hover:!text-ink ${
                      sort === column.key ? '!text-ink' : ''
                    }`}
                    aria-sort={
                      sort === column.key ? (ascending ? 'ascending' : 'descending') : 'none'
                    }
                  >
                    {column.label}
                    <span aria-hidden className={sort === column.key ? '' : 'opacity-0'}>
                      {ascending ? '↑' : '↓'}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-b border-line align-top">
                <td className="py-3 pr-4">
                  <Link href={`/admin/${m.id}`} className="text-[0.9375rem] !text-ink">
                    {m.firstName ?? m.email.split('@')[0]}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-40">
                    {m.email}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span className="tier-tag" data-tier={m.isAdmin ? 'admin' : m.tier}>
                    {m.isAdmin ? 'admin' : m.tier}
                  </span>
                </td>
                <td className="label py-3 pr-4 !text-ink-72">{since(m.lastSeenAt)}</td>
                <td className="label py-3 pr-4 !text-ink-72">{since(m.lastWroteAt)}</td>
                <td className="label py-3 pr-4 !text-ink-72">{readable(m.secondsSpent)}</td>
                <td className="label py-3 pr-4 !text-ink-72">
                  {m.weeksComplete}/{weeks.length}
                </td>
                <td className="label py-3 !text-ink-72">{m.entriesWritten}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p className="mt-6 !text-ink-56 text-[0.9375rem]">Nobody matches that.</p>
      ) : null}
    </div>
  )
}
