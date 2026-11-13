import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { Quote } from '@/components/Quote'
import { ChapterVisual } from '@/components/ChapterVisual'
import { VideoEmbed } from '@/components/VideoEmbed'
import { DigestBody } from '@/components/DigestBody'
import { StyleRadar } from '@/components/StyleRadar'
import { WeekEntries } from '@/components/WeekEntries'
import { LastWeek } from '@/components/LastWeek'
import { ProgrammeProgress } from '@/components/ProgrammeProgress'
import { LockIcon } from '@/components/icons'
import type { TocItem } from '@/components/OnThisPage'
import { getWeek, moduleForWeek, weeks, COHORT } from '@/content/programme'
import { getDigest } from '@/content/digests'
import { leadStyle } from '@/content/know-thyself'
import { entriesForWeek } from '@/content/journal'
import { getMember, getMyScores, getProgress } from '@/lib/member'
import {
  clockFor,
  currentWeek,
  entryForToday,
  formatWeekRelease,
  formatWeekStart,
  isUnlocked,
} from '@/lib/cohort'
import { getWeekClose } from '@/lib/week-close'

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
  const isAdmin = member?.isAdmin ?? false

  const clock = clockFor(member)

  if (!isUnlocked(n, isAdmin, new Date(), clock)) {
    const open = currentWeek(new Date(), clock)
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
          {clock.start ? (
            <p>
              This week opens on {formatWeekRelease(n, clock)}, alongside the digest in your inbox.
              The programme is released a week at a time.
            </p>
          ) : (
            /* No start date, so there is no day to name. Naming one from the
             * cohort would promise a date that is not theirs. */
            <p>
              Your programme has not started yet. Choose the day you want to begin and this chapter
              opens the evening before.
            </p>
          )}
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
  const quote = digest?.quote
  const prev = n > 1 ? getWeek(n - 1) : undefined
  const next =
    n < weeks.length && isUnlocked(n + 1, isAdmin, new Date(), clock) ? getWeek(n + 1) : undefined

  /*
   * This week's entries, and the week before it.
   *
   * Both are read here rather than in the components so the two round trips go
   * out together. The week before is only read when there is one: nobody has a
   * last week in week one.
   */
  const close = member ? await getWeekClose(member.id, n) : null
  const lastClose = member && prev ? await getWeekClose(member.id, prev.number) : null
  // Only the week in hand has a day to be on.
  const today = n === currentWeek(new Date(), clock) ? entryForToday(n, new Date(), clock) : undefined

  const toc: TocItem[] = [
    { id: 'overview', label: 'Overview' },
    ...(week.type === 'deload' && week.recap ? [{ id: 'why', label: 'Why this matters' }] : []),
    ...(week.type === 'deload' ? [] : [{ id: 'masterclass', label: 'Video masterclass' }]),
    { id: 'digest', label: 'Weekly digest' },
    ...(quote ? [{ id: 'journal', label: 'To close' }] : []),
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
            <span className="pill">{formatWeekStart(n, clock)}</span>
          </>
        }
      />

      {/* Where they are, then the week just gone. Both before the chapter
        * itself, because both are about arriving rather than reading. */}
      <ProgrammeProgress completedWeeks={[...progress.completedWeeks]} />

      {lastClose && prev ? (
        <LastWeek
          week={prev.number}
          title={prev.title}
          progress={lastClose}
          ticked={progress.completedWeeks.has(prev.number)}
        />
      ) : null}

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

      {/* A deload week has no video. The module workshop runs live and the
        * week is for revisiting what is already written, so a keynote here
        * made the week off look like another thing to watch. */}
      {week.type === 'deload' ? null : (
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
                <p className="label !mb-5">The four styles</p>
                <StyleRadar scores={scores} lead={leadStyle(scores)?.name} />
              </div>
            ) : null}
          </>
        ) : (
          <p className="!text-ink-56">
            The digest for this week is not loaded yet. It arrives by email on the Sunday evening
            and appears here at the same time.
          </p>
        )}

        {/*
          * The week's entries, which is what the foot of the digest is for.
          * Outside the conditional above on purpose: a week whose digest has
          * not been loaded still has seven entries to write.
          */}
        {close ? <WeekEntries progress={close} today={today} /> : null}
      </Section>

      {/* The entries are listed at the foot of the digest, so this is the quote. */}
      {quote ? (
        <Section id="journal" label="To close">
          <Quote lines={quote.lines} author={quote.author} />
        </Section>
      ) : null}

      {n === 16 ? (
        <Section id="workshop" label="Finishing the programme">
          <p>
            <a href={COHORT.postAssessmentUrl} target="_blank" rel="noreferrer">
              Complete your post-programme assessment
            </a>
          </p>
        </Section>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-4 px-6 py-8 sm:px-10">
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
