import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { MarkWeekDone } from '@/components/MarkWeekDone'
import { getMember, getProgress } from '@/lib/member'
import { modules } from '@/content/programme'
import {
  ELITE,
  currentEliteChapter,
  eliteChapter,
  eliteChapters,
  formatEliteChapter,
} from '@/content/elite'
import { eliteEntriesForChapter } from '@/content/elite-journal'

export const metadata = { title: 'Chapter · Elite' }

/**
 * One chapter of Elite: four weeks, twenty eight entries.
 *
 * Set out as four weeks of seven rather than twenty eight numbered boxes. The
 * entries are a run of days and the chapter is worked a week at a time, so
 * twenty eight in a grid would be a wall where four rows are a plan.
 *
 * Nothing here is locked. A member on their own clock who wants to read ahead
 * is not doing anything wrong, and a chapter that refused to open would only be
 * enforcing a cohort that does not exist on this programme.
 */
export default async function EliteChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>
}) {
  const member = await getMember()
  if (!member || (!member.isAdmin && member.tier !== 'elite')) notFound()

  const { chapter: raw } = await params
  const n = Number(raw)
  const chapter = eliteChapter(n)
  if (!chapter) notFound()

  const progress = await getProgress(member.id)
  const start = member.eliteStartDate ?? new Date().toISOString().slice(0, 10)
  const open = Math.max(1, currentEliteChapter(start))
  const module = modules.find((m) => m.number === chapter.module)!
  const prev = eliteChapters.find((c) => c.n === n - 1)
  const next = eliteChapters.find((c) => c.n === n + 1)

  const entries = eliteEntriesForChapter(n)
  const weeks = [0, 1, 2, 3].map((i) => ({
    n: i + 1,
    entries: entries.slice(i * 7, i * 7 + 7),
  }))

  return (
    <Shell>
      <PageHeader
        eyebrow={`Elite · Chapter ${String(n).padStart(2, '0')} of ${ELITE.chapters}`}
        title={chapter.title}
        lede={`Module ${String(module.number).padStart(2, '0')} ${module.name}. Entries ${chapter.firstEntry} to ${chapter.lastEntry}, in journal ${chapter.volume}.`}
        pills={
          <>
            <span className="pill">Opens {formatEliteChapter(start, n)}</span>
            <span className="pill">{ELITE.entriesPerChapter} entries</span>
            <span className="pill">{ELITE.weeksPerChapter} weeks</span>
            {n === open ? <span className="pill !text-ink">This chapter</span> : null}
          </>
        }
      />

      <Section label="The chapter's work">
        <p className="!mb-6">
          Four weeks against the journal, seven entries in each. Preview your day, work the entry,
          then review it.
        </p>
        <div className="!mb-0 space-y-6">
          {weeks.map((week) => (
            <div key={week.n} className="border-t border-line pt-5">
              <p className="label !mb-3">
                Week {week.n} of {ELITE.weeksPerChapter}
              </p>
              <ul className="!list-none !pl-0 !mb-0">
                {week.entries.map((entry) => (
                  <li key={entry.n} className="border-t border-line">
                    <Link
                      href={`/journal/${entry.n}`}
                      className="flex items-baseline gap-4 py-2.5 !no-underline hover:bg-ink-3"
                    >
                      <span className="label w-16 shrink-0">{entry.n}</span>
                      <span className="min-w-0 flex-1 text-[0.9375rem] text-ink">
                        {entry.title ?? entry.prompts[0] ?? 'Reflection'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section label="The digest">
        <p className="!mb-0 !text-ink-56">
          The digest for this chapter is not loaded into the platform yet. It goes out from Kit in
          the meantime, when the chapter opens.
        </p>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 sm:px-10">
        <MarkWeekDone week={n} done={progress.completedWeeks.has(n)} />
        <div className="flex gap-6">
          {prev ? (
            <Link href={`/elite/chapter/${prev.n}`} className="label hover:!text-ink">
              ← {prev.title}
            </Link>
          ) : (
            <Link href="/elite" className="label hover:!text-ink">
              The year
            </Link>
          )}
          {next ? (
            <Link href={`/elite/chapter/${next.n}`} className="label hover:!text-ink">
              {next.title} →
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
