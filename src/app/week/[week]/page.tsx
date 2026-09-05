import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { Quote } from '@/components/Quote'
import { ChapterVisual } from '@/components/ChapterVisual'
import { VideoEmbed } from '@/components/VideoEmbed'
import { DriveEmbed } from '@/components/DriveEmbed'
import { DigestBody } from '@/components/DigestBody'
import { StyleGuide } from '@/components/StyleGuide'
import { MarkWeekDone } from '@/components/MarkWeekDone'
import { LockIcon } from '@/components/icons'
import type { TocItem } from '@/components/OnThisPage'
import { getWeek, moduleForWeek, weeks, COHORT } from '@/content/programme'
import { getDigest } from '@/content/digests'
import { leadStyle } from '@/content/know-thyself'
import { entriesForWeek } from '@/content/journal'
import { workshopRecordings } from '@/content/assets'
import { getMember, getMyScores, getProgress } from '@/lib/member'
import { currentWeek, formatWeekRelease, formatWeekStart, isUnlocked } from '@/lib/cohort'

export function generateStaticParams() {
  return weeks.map((w) => ({ week: String(w.number) }))
}

/*
 * The chapter that teaches the behavioural styles, and the only one that
 * prints the four cards under its digest.
 */
const STYLES_WEEK = 1

export default async function WeekPage({ params }: { params: Promise<{ week: string }> }) {
  const { week: weekParam } = await params
  const n = Number(weekParam)
  const week = getWeek(n)
  if (!week) notFound()

  const module = moduleForWeek(n)!
  const member = await getMember()
  const progress = member
    ? await getProgress(member.id)
    : { completedWeeks: new Set<number>(), completedItems: new Set<string>() }

  const tier = member?.tier ?? 'core'

  if (!isUnlocked(n)) {
    const open = currentWeek()
    return (
      <Shell>
        <PageHeader
          eyebrow={`Module ${String(module.number).padStart(2, '0')} · ${module.name}`}
          title={week.title}
          pills={
            <span className="pill">
              <LockIcon /> Locked
            </span>
          }
        />
        <Section label="Not yet">
          <p>
            This week opens on {formatWeekRelease(n)}, alongside the digest in your inbox. The
            programme is released a week at a time.
          </p>
          {open >= 1 && open <= weeks.length ? (
            <p>
              <Link href={`/week/${open}`}>Go to the current week</Link>
            </p>
          ) : null}
        </Section>
      </Shell>
    )
  }

  const digest = getDigest(n)
  /*
   * The four styles are printed with the Know Thyself chapter and nowhere else,
   * so the scores are only read on the one week that draws them.
   */
  const scores = n === STYLES_WEEK ? await getMyScores() : {}
  const entries = entriesForWeek(n)
  const recording = workshopRecordings[n]
  const quote = digest?.quote
  const prev = n > 1 ? getWeek(n - 1) : undefined
  const next = n < weeks.length && isUnlocked(n + 1) ? getWeek(n + 1) : undefined

  const toc: TocItem[] = [
    { id: 'overview', label: 'Overview' },
    ...(week.type === 'deload' && week.recap ? [{ id: 'why', label: 'Why this matters' }] : []),
    {
      id: 'masterclass',
      label: week.type === 'deload' ? 'Workshop keynote' : 'Video masterclass',
    },
    { id: 'digest', label: 'Weekly digest' },
    { id: 'journal', label: 'To close' },
    ...(n === 16 ? [{ id: 'workshop', label: 'Finishing the programme' }] : []),
  ]

  return (
    <Shell toc={toc}>
      <PageHeader
        eyebrow={`Module ${String(module.number).padStart(2, '0')} · ${module.name}`}
        title={week.title}
        pills={
          <>
            <span className="pill">Week {String(n).padStart(2, '0')} of 16</span>
            {week.topic ? <span className="pill">{week.topic}</span> : null}
            <span className="pill">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
            <span className="pill">{formatWeekStart(n)}</span>
          </>
        }
      />

      <Section id="overview">
        {week.opening.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        <ChapterVisual week={n} />
      </Section>

      {week.type === 'deload' && week.recap ? (
        <Section id="why" label="Why this matters">
          <p>This module covered three chapters:</p>
          <ul>
            {week.recap.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p>
            This week adds nothing new. Revisit what you have written, keep what is working, and be
            honest about what is not.
          </p>
        </Section>
      ) : null}

      {week.type === 'deload' ? (
        <Section id="masterclass" label="Workshop keynote">
          {recording?.url ? (
            <DriveEmbed
              url={recording.url}
              title={`Module ${String(module.number).padStart(2, '0')} workshop`}
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center border border-line bg-ink-3">
              <p className="label">Recording to follow</p>
            </div>
          )}
          <p className="mt-4 !text-ink-56 text-[0.8125rem]">
            Chris works through the whole of {module.name}, drawing the three chapters together.
            The workshop runs live during this week and the recording lands here afterwards.
          </p>
        </Section>
      ) : (
        <Section id="masterclass" label="Video masterclass">
          <VideoEmbed youtubeId={week.youtubeId} title={`${week.title} masterclass`} />
          <p className="mt-4 !text-ink-56 text-[0.8125rem]">
            Chris walks through the chapter. Watch it before you start the week.
          </p>
        </Section>
      )}

      <Section id="digest" label="Weekly digest">
        {digest ? (
          <>
            <DigestBody
              nodes={digest.nodes}
              week={n}
              firstEntry={week.firstEntry}
              completedItems={[...progress.completedItems]}
            />
            <p className="label !mt-8">Chris</p>
            {n === STYLES_WEEK ? (
              <div className="!mt-10">
                <p className="label !mb-1">The four styles</p>
                <p className="!mb-5 text-[0.9375rem] !text-ink-56">
                  Open one to see where it wins, what it hides, and what it costs at scale.
                </p>
                <StyleGuide scores={scores} lead={leadStyle(scores)?.name} />
              </div>
            ) : null}
          </>
        ) : (
          <p className="!text-ink-56">
            The digest for this week is not loaded yet. It arrives by email on the Sunday evening
            and appears here at the same time.
          </p>
        )}
      </Section>

      <Section id="journal" label="To close">
        {quote ? <Quote lines={quote.lines} author={quote.author} /> : null}
        <p className={quote ? 'mt-10' : ''}>
          <Link href={`/journal#week-${n}`}>See this week&rsquo;s entries</Link>
        </p>
      </Section>

      {n === 16 ? (
        <Section id="workshop" label="Finishing the programme">
          <p>
            <a href={COHORT.postAssessmentUrl} target="_blank" rel="noreferrer">
              Complete your post-programme assessment
            </a>
          </p>
        </Section>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-8 sm:px-10">
        <MarkWeekDone week={n} done={progress.completedWeeks.has(n)} />
        <div className="flex gap-6">
          {prev ? (
            <Link href={`/week/${prev.number}`} className="label hover:!text-ink">
              ← {prev.title}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/week/${next.number}`} className="label hover:!text-ink">
              {next.title} →
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
