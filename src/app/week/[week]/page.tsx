import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { Quote } from '@/components/Quote'
import { VideoEmbed } from '@/components/VideoEmbed'
import { MarkWeekDone } from '@/components/MarkWeekDone'
import { LockIcon } from '@/components/icons'
import type { TocItem } from '@/components/OnThisPage'
import { getWeek, moduleForWeek, weeks, COHORT } from '@/content/programme'
import { getDigest } from '@/content/digests'
import { entriesForWeek } from '@/content/journal'
import { workshopRecordings } from '@/content/assets'
import { getMember, getProgress } from '@/lib/member'
import { currentWeek, formatWeekRelease, formatWeekStart, isUnlocked } from '@/lib/cohort'

export function generateStaticParams() {
  return weeks.map((w) => ({ week: String(w.number) }))
}

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
            This week opens on {formatWeekRelease(n)} evening, when the digest lands in your inbox.
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
  const entries = entriesForWeek(n)
  const recording = workshopRecordings[n]
  const prev = n > 1 ? getWeek(n - 1) : undefined
  const next = n < weeks.length && isUnlocked(n + 1) ? getWeek(n + 1) : undefined

  const toc: TocItem[] = [
    { id: 'overview', label: 'Overview' },
    ...(week.type === 'deload' && week.recap ? [{ id: 'why', label: 'Why this matters' }] : []),
    ...(week.youtubeId ? [{ id: 'masterclass', label: 'Video masterclass' }] : []),
    { id: 'digest', label: 'Weekly digest' },
    { id: 'journal', label: 'Your journal this week' },
    ...(week.type === 'deload' ? [{ id: 'workshop', label: 'Module workshop' }] : []),
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
      </Section>

      {week.type === 'deload' && week.recap ? (
        <Section id="why" label="Why this matters">
          <p>This module covered three chapters:</p>
          <ul>
            {week.recap.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>
            This week adds nothing new. Revisit what you have written, keep what is working, and be
            honest about what is not.
          </p>
        </Section>
      ) : null}

      {week.youtubeId ? (
        <Section id="masterclass" label="Video masterclass">
          <VideoEmbed youtubeId={week.youtubeId} title={`${week.title} masterclass`} />
          <p className="mt-4 !text-ink-56 text-[0.8125rem]">
            Chris walks through the chapter. Watch it before you start the week.
          </p>
        </Section>
      ) : null}

      <Section id="digest" label="Weekly digest">
        {digest ? (
          <>
            {digest.opening.map((p, i) => (
              <p key={i}>{p}</p>
            ))}

            {digest.focus.length ? (
              <>
                <h3>This week&rsquo;s focus</h3>
                <ul>
                  {digest.focus.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {digest.keyInsights.map((insight) => (
              <div key={insight.title}>
                <h3>{insight.title}</h3>
                <p>{insight.body}</p>
              </div>
            ))}

            {digest.implementation ? (
              <>
                <h3>Daily journal practice</h3>
                <ul>
                  {digest.implementation.dailyPractice.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <h3>Weekly challenge</h3>
                <p>{digest.implementation.weeklyChallenge}</p>
                <h3>Reflection questions</h3>
                <ul>
                  {digest.implementation.reflectionQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </>
            ) : null}

            {digest.science ? (
              <>
                <h3>{digest.science.title}</h3>
                {digest.science.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {digest.science.link ? (
                  <p>
                    <a href={digest.science.link.url} target="_blank" rel="noreferrer">
                      {digest.science.link.label}
                    </a>
                  </p>
                ) : null}
              </>
            ) : null}

            {digest.progressCheck?.length ? (
              <>
                <h3>Connecting the dots</h3>
                {digest.progressCheck.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            ) : null}

            {digest.lookingAhead?.length ? (
              <>
                <h3>Looking ahead</h3>
                {digest.lookingAhead.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </>
            ) : null}

            {digest.remember ? (
              <>
                <h3>Remember</h3>
                <p>{digest.remember}</p>
              </>
            ) : null}

            <p className="label !mt-8">Chris</p>
          </>
        ) : (
          <p className="!text-ink-56">
            The digest for this week is not loaded yet. It arrives by email on the Sunday evening
            and appears here at the same time.
          </p>
        )}
      </Section>

      <Section id="journal" label="Your journal this week">
        <p>
          {entries.length} entries, {week.firstEntry} to {week.firstEntry + entries.length - 1}.
          Six days of practice and a huddle to close the week. Write them in the journal.
        </p>
        <p>
          <Link href={`/journal#week-${n}`}>See this week&rsquo;s entries</Link>
        </p>
      </Section>

      {week.type === 'deload' ? (
        <Section id="workshop" label="Module workshop">
          {recording?.url ? (
            <p>
              <a href={recording.url} target="_blank" rel="noreferrer">
                Watch the module {String(module.number).padStart(2, '0')} workshop
              </a>
            </p>
          ) : (
            <p className="!text-ink-56">
              {member?.tier === 'pro'
                ? 'The live workshop runs this week. The recording is posted here afterwards.'
                : 'The recording is posted here on the Thursday of this week.'}
            </p>
          )}
          {n === 16 ? (
            <p className="mt-4">
              <a href={COHORT.postAssessmentUrl} target="_blank" rel="noreferrer">
                Complete your post-programme assessment
              </a>
            </p>
          ) : null}
        </Section>
      ) : null}

      {week.quote ? <Quote text={week.quote.text} author={week.quote.author} /> : null}

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
