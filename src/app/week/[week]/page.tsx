import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { Quote } from '@/components/Quote'
import { VideoEmbed } from '@/components/VideoEmbed'
import { MarkWeekDone } from '@/components/MarkWeekDone'
import { getWeek, moduleForWeek, weeks, COHORT } from '@/content/programme'
import { getDigest } from '@/content/digests'
import { entriesForWeek } from '@/content/journal'
import { workshopRecordings } from '@/content/assets'
import { getMember, getProgress } from '@/lib/member'
import { currentWeek, formatWeekStart, isUnlocked } from '@/lib/cohort'

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
    return (
      <Shell>
        <PageHeader
          eyebrow={`Module ${String(module.number).padStart(2, '0')} · ${module.name}`}
          title={week.title}
        />
        <Section label="Not yet">
          <p>
            Week {n} opens on {formatWeekStart(n)}, the same morning the digest lands in your inbox.
            The cohort is on week {currentWeek()}.
          </p>
          <p>
            <Link href={`/week/${currentWeek()}`}>Go to this week</Link>
          </p>
        </Section>
      </Shell>
    )
  }

  const digest = getDigest(n)
  const entries = entriesForWeek(n)
  const recording = workshopRecordings[n]
  const prev = n > 1 ? getWeek(n - 1) : undefined
  const next = n < weeks.length && isUnlocked(n + 1) ? getWeek(n + 1) : undefined

  return (
    <Shell>
      <PageHeader
        eyebrow={`Module ${String(module.number).padStart(2, '0')} · ${module.name}`}
        title={week.title}
        meta={
          <>
            <span className="label">Week {String(n).padStart(2, '0')} of 16</span>
            {week.topic ? <span className="label">{week.topic}</span> : null}
            <span className="label">
              Entries {week.firstEntry} to {week.firstEntry + 6}
            </span>
            <span className="label">{formatWeekStart(n)}</span>
          </>
        }
      />

      <Section>
        {(digest?.opening ?? week.opening).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </Section>

      {week.type === 'deload' && week.recap ? (
        <Section label="Why this matters">
          <p>You have covered three chapters in this module:</p>
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

      {digest?.focus?.length ? (
        <Section label="This week's focus">
          <ul>
            {digest.focus.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {week.youtubeId ? (
        <Section label="Video masterclass">
          <VideoEmbed youtubeId={week.youtubeId} title={`${week.title} masterclass`} />
          <p className="mt-4 text-[0.8125rem] text-ink-muted">
            Chris walks through the chapter. Watch before you start the week.
          </p>
        </Section>
      ) : null}

      {digest?.keyInsights?.length ? (
        <Section label="Key insights">
          {digest.keyInsights.map((insight) => (
            <div key={insight.title}>
              <h3>{insight.title}</h3>
              <p>{insight.body}</p>
            </div>
          ))}
        </Section>
      ) : null}

      {digest?.implementation ? (
        <Section label="Implementation guide">
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
        </Section>
      ) : null}

      {digest?.science ? (
        <Section label="The science behind it">
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
        </Section>
      ) : null}

      {entries.length ? (
        <Section label="Your journal this week">
          <p className="text-ink-muted">
            Entries {week.firstEntry} to {week.firstEntry + entries.length - 1}. Write them in the
            journal, not here.
          </p>
          <ul className="!list-none !pl-0 mt-4">
            {entries.map((e) => (
              <li key={e.n} className="flex gap-4 border-t border-line py-3">
                <span className="label w-16 shrink-0 pt-1">
                  {String(e.n).padStart(3, '0')}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.9375rem]">{e.title ?? 'Daily entry'}</span>
                  {e.prompts.slice(0, 1).map((p) => (
                    <span key={p} className="mt-1 block text-[0.8125rem] text-ink-muted">
                      {p}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6">
            <a href="/journal/download">Download the PDF journal</a>
          </p>
        </Section>
      ) : null}

      {week.type === 'deload' ? (
        <Section label="Module workshop">
          {recording?.url ? (
            <p>
              <a href={recording.url} target="_blank" rel="noreferrer">
                Watch the module {String(module.number).padStart(2, '0')} workshop
              </a>
            </p>
          ) : (
            <p className="text-ink-muted">
              {member?.tier === 'pro'
                ? 'The live workshop runs this week. The recording is posted here afterwards.'
                : 'The recording is posted here on Thursday of this week.'}
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

      {digest?.progressCheck?.length ? (
        <Section label="Connecting the dots">
          {digest.progressCheck.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Section>
      ) : null}

      {digest?.lookingAhead?.length ? (
        <Section label="Looking ahead">
          {digest.lookingAhead.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Section>
      ) : null}

      {digest?.remember ? (
        <Section label="Remember">
          <p>{digest.remember}</p>
          <p className="label mt-6">Chris</p>
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
