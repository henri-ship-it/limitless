import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { DailyJournal } from '@/components/DailyJournal'
import { JournalVisual } from '@/components/JournalVisual'
import { LockIcon } from '@/components/icons'
import { journalEntries, entriesForWeek } from '@/content/journal'
import { getWeek, moduleForWeek } from '@/content/programme'
import type { EntryData } from '@/content/journal-fields'
import { getJournalEntry, getMember } from '@/lib/member'
import { isUnlocked } from '@/lib/cohort'
import { supabaseConfigured } from '@/lib/env'

export function generateStaticParams() {
  return journalEntries.map((e) => ({ entry: String(e.n) }))
}

export default async function EntryPage({ params }: { params: Promise<{ entry: string }> }) {
  const { entry: entryParam } = await params
  const n = Number(entryParam)
  const entry = journalEntries.find((e) => e.n === n)
  if (!entry) notFound()

  const week = getWeek(entry.week)!
  const module = moduleForWeek(entry.week)!
  const member = await getMember()
  const tier = member?.tier ?? 'core'

  const weekEntries = entriesForWeek(entry.week)
  const day = weekEntries.findIndex((e) => e.n === n) + 1
  const isHuddle = entry.title === 'Huddle'

  if (!isUnlocked(entry.week, tier)) {
    return (
      <Shell>
        <PageHeader
          eyebrow={`Week ${entry.week} · ${week.title}`}
          title={entry.title ?? `Entry ${n}`}
          pills={
            <span className="pill">
              <LockIcon /> Locked
            </span>
          }
        />
      </Shell>
    )
  }

  const saved = member ? await getJournalEntry(member.id, n) : null
  const prev = journalEntries.find((e) => e.n === n - 1)
  const next = journalEntries.find((e) => e.n === n + 1)

  return (
    <Shell>
      <PageHeader
        eyebrow={`Module ${String(module.number).padStart(2, '0')} · Week ${entry.week} · ${week.title}`}
        title={entry.title ?? (isHuddle ? 'Huddle' : `Day ${day}`)}
        pills={
          <>
            <span className="pill">{isHuddle ? 'Huddle' : `Day ${day}`}</span>
            <span className="pill">Entry {n} of 112</span>
          </>
        }
      />

      <JournalVisual entry={n} className="border-b border-line" />

      <DailyJournal
        entry={n}
        prompts={entry.prompts}
        initial={(saved ?? {}) as EntryData}
        persist={supabaseConfigured ? 'db' : 'local'}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 sm:px-10">
        <Link href={`/journal#week-${entry.week}`} className="label hover:!text-ink">
          All entries
        </Link>
        <div className="flex gap-6">
          {prev && isUnlocked(prev.week, tier) ? (
            <Link href={`/journal/${prev.n}`} className="label hover:!text-ink">
              ← Entry {prev.n}
            </Link>
          ) : null}
          {next && isUnlocked(next.week, tier) ? (
            <Link href={`/journal/${next.n}`} className="label hover:!text-ink">
              Entry {next.n} →
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
