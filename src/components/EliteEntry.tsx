import Link from 'next/link'
import { Shell } from './Shell'
import { PageHeader } from './PageHeader'
import { DailyJournal } from './DailyJournal'
import { JournalVisual } from './JournalVisual'
import { DownloadWeek } from './DownloadWeek'
import { BulkPhotos } from './BulkPhotos'
import { supabaseConfigured } from '@/lib/env'
import type { ResolvedEntry } from '@/lib/entry'
import type { EntryData } from '@/content/journal-fields'
import { modules } from '@/content/programme'
import { ELITE_ENTRIES, chapterForEntry } from '@/content/elite'
import { eliteEntriesForWeek } from '@/content/elite-journal'

/**
 * One page of the Elite journal.
 *
 * The weekly entry page and this one do the same job and cannot be the same
 * component: that one is built around a week of a sixteen week cohort, with a
 * lock on anything not yet released and a header naming the week's chapter.
 * Here there is no cohort, nothing is locked, and the heading names the chapter
 * and which of its four weeks this is.
 *
 * The writing itself is the same DailyJournal against the same table, so a
 * member's pages are stored and downloaded exactly as everybody else's are.
 */
export function EliteEntry({
  entry,
  initial,
}: {
  entry: ResolvedEntry
  initial: EntryData
}) {
  const chapter = chapterForEntry(entry.n)!
  const module = modules.find((m) => m.number === chapter.module)!
  // Which of the chapter's four weeks this entry falls in.
  const weekOfChapter = Math.floor((entry.n - chapter.firstEntry) / 7) + 1
  const dayOfWeek = ((entry.n - 1) % 7) + 1

  const prev = entry.n > 1 ? entry.n - 1 : null
  const next = entry.n < ELITE_ENTRIES ? entry.n + 1 : null

  return (
    <Shell>
      <PageHeader
        eyebrow={`Module ${String(module.number).padStart(2, '0')} · Chapter ${chapter.n} · ${chapter.title}`}
        title={entry.title}
        pills={
          <>
            <span className="pill">{entry.huddle ? 'Huddle' : `Day ${dayOfWeek}`}</span>
            <span className="pill">Week {weekOfChapter} of 4</span>
            <span className="pill">
              Entry {entry.n} of {ELITE_ENTRIES}
            </span>
            <span className="pill">Journal {chapter.volume}</span>
          </>
        }
      />

      <JournalVisual
        visual={entry.visual}
        caption={entry.caption}
        className="border-b border-line"
      />

      <DailyJournal
        entry={entry.n}
        huddle={entry.huddle}
        intro={entry.intro}
        fields={entry.fields}
        outro={entry.outro}
        link={entry.link}
        awaitingLink={entry.awaitingLink}
        initial={initial}
        persist={supabaseConfigured ? 'db' : 'local'}
      />

      {/*
        * The huddle closes the week, so it is where a week of written pages is
        * handed over and where the week can be taken away.
        */}
      {entry.huddle ? (
        <>
          <div className="border-t border-line px-6 py-8 sm:px-10">
            <p className="label mb-3">This week on paper</p>
            <BulkPhotos week={entry.week} />
          </div>
          <div className="border-t border-line px-6 py-8 sm:px-10">
            <p className="label mb-3">Keep your week</p>
            <p className="mb-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-72">
              Everything you have written this week, as a markdown file. It is built in your browser
              and downloaded straight to your device.
            </p>
            <DownloadWeek
              week={entry.week}
              entries={eliteEntriesForWeek(entry.week).map((e) => e.n)}
            />
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 sm:px-10">
        <Link href={`/journal#chapter-${chapter.n}`} className="label hover:!text-ink">
          All entries
        </Link>
        <div className="flex gap-6">
          {prev ? (
            <Link href={`/journal/${prev}`} className="label hover:!text-ink">
              ← Entry {prev}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/journal/${next}`} className="label hover:!text-ink">
              Entry {next} →
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
