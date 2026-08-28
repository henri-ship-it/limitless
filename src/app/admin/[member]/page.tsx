import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getMemberDetail, readable, requireAdmin, since } from '@/lib/admin'
import { resolveEntry } from '@/lib/entry'
import { getWeek } from '@/content/programme'
import { HUDDLE_QUESTIONS } from '@/content/entry-fields'
import { SITE } from '@/content/site'
import type { EntryData } from '@/content/journal-fields'
import {
  BehaviouralStyle,
  PreAssessment,
  type AssessmentData,
} from '@/components/admin/Assessments'
import { MemberTabs } from '@/components/admin/MemberTabs'
import { DraftMessage } from '@/components/admin/DraftMessage'

export const metadata = { title: 'Member · Limitless' }

export default async function MemberPage({ params }: { params: Promise<{ member: string }> }) {
  const admin = await requireAdmin()
  if (!admin) notFound()

  const { member: id } = await params
  const detail = await getMemberDetail(id)
  if (!detail) notFound()

  const { profile, weeksComplete, entries, totalWeeks, time, secondsSpent, arrivals } = detail
  const name = profile.first_name ?? profile.email.split('@')[0]
  const assessment = (profile.assessment ?? {}) as AssessmentData

  return (
    <Shell>
      <PageHeader
        eyebrow="Admin only"
        title={name}
        lede={profile.email}
        pills={
          <>
            <span className="tier-tag" data-tier={profile.tier}>
              {profile.tier}
            </span>
            <span className="pill">{readable(secondsSpent)} on the platform</span>
            <span className="pill">Last seen {since(profile.last_seen_at)}</span>
            <span className="pill">
              {weeksComplete.length}/{totalWeeks} weeks
            </span>
            <span className="pill">{entries.length} entries</span>
            {profile.personalised_nudges ? null : <span className="pill">Nudges off</span>}
          </>
        }
      />

      <Section label="Get in touch">
        <div className="!mb-4 flex flex-wrap gap-3">
          <a
            href={`mailto:${profile.email}?subject=Limitless`}
            className="label !no-underline border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
          >
            Email {name}
          </a>
          {profile.phone ? (
            <a
              href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="label !no-underline border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
            >
              WhatsApp {name}
            </a>
          ) : null}
          <a
            href={`/api/admin/${profile.id}/markdown`}
            className="label !no-underline border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
          >
            Export markdown
          </a>
        </div>
        <p className="!text-ink-56 text-[0.8125rem]">
          Both open in your own client, so it reads as a person rather than a system. Replies come
          back to {SITE.email}.
        </p>
      </Section>

      <Section label="Draft a message">
        <DraftMessage
          memberId={profile.id}
          name={name}
          email={profile.email}
          phone={profile.phone}
        />
      </Section>

      <Section label="Their record">
        <MemberTabs
          tabs={[
            {
              key: 'style',
              label: 'Behavioural style',
              panel: <BehaviouralStyle filled={assessment.scorecard} />,
            },
            {
              key: 'told',
              label: 'What they told us',
              panel: <PreAssessment filled={assessment.preAssessment} />,
            },
            {
              key: 'written',
              label: 'What they have written',
              note: entries.length ? String(entries.length) : undefined,
              panel: <Written entries={entries} />,
            },
            {
              key: 'activity',
              label: 'Activity',
              panel: <Activity arrivals={arrivals} time={time} />,
            },
          ]}
        />
      </Section>

      <div className="px-6 py-8 sm:px-10">
        <Link href="/admin" className="label hover:!text-ink">
          ← All members
        </Link>
      </div>
    </Shell>
  )
}

type Detail = NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>

/** Everything they have put in the digital journal, newest week last. */
function Written({ entries }: { entries: Detail['entries'] }) {
  if (!entries.length) {
    return (
      <p className="!mb-0 text-[0.9375rem] !text-ink-56">
        Nothing in the digital journal. Plenty of people write in the printed one instead, so this
        is not the same as not doing the work.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {entries.map((row) => {
        const entry = resolveEntry(row.n)
        const week = getWeek(row.week)
        return (
          <div key={row.n} className="border-t border-line pt-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="pill">Entry {row.n}</span>
              {week ? <span className="pill">Week {row.week}</span> : null}
              <span className="label ml-auto">{since(row.updatedAt)}</span>
            </div>
            <p className="!mb-3 text-[1rem] font-medium text-ink">
              {entry?.title ?? `Entry ${row.n}`}
            </p>
            <Answers entry={entry} data={row.data as EntryData} />
          </div>
        )
      })}
    </div>
  )
}

/** Where they came from and where the time went. */
function Activity({ arrivals, time }: { arrivals: Detail['arrivals']; time: Detail['time'] }) {
  if (!arrivals.length && !time.length) {
    return (
      <div>
        <p className="!mb-3 text-[0.9375rem] !text-ink-56">
          Nothing recorded yet. Two things fill this in as the programme runs.
        </p>
        <ul className="!mb-0 !text-ink-56 text-[0.9375rem]">
          <li>
            <span className="!text-ink">Where their time goes</span> — which pages they actually
            read, counted only while the tab is in front. It starts from their next visit.
          </li>
          <li>
            <span className="!text-ink">How they arrived</span> — this needs the links in a digest
            to carry <code>?from=digest</code> on the end. Without that tag there is no way to tell
            a click from a bookmark, so it stays empty.
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div>
      {arrivals.length ? (
        <>
          <p className="label !mb-3 !text-ink">How they arrived</p>
          <dl className="!mb-8">
            {arrivals.map((row, i) => (
              <div
                key={i}
                className="grid gap-1 border-t border-line py-2.5 sm:grid-cols-[8rem_1fr_auto] sm:gap-5"
              >
                <dt className="label !text-ink">{row.source}</dt>
                <dd className="font-mono text-[0.8125rem] text-ink-72">{row.path}</dd>
                <dd className="label !text-ink-40">{since(row.at)}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : null}

      {time.length ? (
        <>
          <p className="label !mb-3 !text-ink">Where their time goes</p>
          <dl className="!mb-0">
            {time.slice(0, 12).map((row) => (
              <div
                key={row.path}
                className="grid gap-1 border-t border-line py-2.5 sm:grid-cols-[1fr_auto] sm:gap-5"
              >
                <dt className="font-mono text-[0.8125rem] text-ink-72">{row.path}</dt>
                <dd className="label !text-ink">{readable(row.seconds)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 !mb-0 !text-ink-56 text-[0.8125rem]">
            Counted only while the tab was in front, and never more than ten minutes in one go, so a
            page left open overnight does not read as a night of study.
          </p>
        </>
      ) : null}
    </div>
  )
}

/** Shows only what they actually filled in, labelled by what was asked. */
function Answers({
  entry,
  data,
}: {
  entry: ReturnType<typeof resolveEntry>
  data: EntryData
}) {
  const rows: { label: string; value: string }[] = []

  const intentions = (data.intentions ?? []).filter(Boolean)
  if (intentions.length) {
    rows.push({
      label: 'Intentions',
      value: intentions
        .map((t, i) => `${data.intentionsDone?.[i] ? '✓' : '·'} ${t}`)
        .join('\n'),
    })
  }

  for (const block of data.blocks ?? []) {
    if (block.label) rows.push({ label: 'Scheduled', value: block.label })
  }

  const achievements = (data.achievements ?? []).filter(Boolean)
  if (achievements.length) rows.push({ label: 'Achievements', value: achievements.join('\n') })

  for (const [key, label] of [
    ['win', 'One win'],
    ['mind', 'On their mind'],
    ['grateful', 'Grateful for'],
  ] as const) {
    if (data[key]) rows.push({ label, value: data[key] as string })
  }

  ;(data.huddle ?? []).forEach((answer, i) => {
    if (answer) rows.push({ label: HUDDLE_QUESTIONS[i] ?? 'Huddle', value: answer })
  })

  if (data.values?.length) rows.push({ label: 'Values chosen', value: data.values.join(', ') })

  for (const [key, value] of Object.entries(data.fields ?? {})) {
    if (!value) continue
    const index = Number(key)
    const field = Number.isInteger(index) ? entry?.fields[index] : undefined
    const label =
      field && field.kind !== 'note' && field.kind !== 'group' ? field.label : 'Answer'
    rows.push({ label, value: Array.isArray(value) ? value.filter(Boolean).join('\n') : value })
  }

  if (!rows.length) return <p className="!mb-0 !text-ink-40 text-[0.875rem]">Opened, not filled in.</p>

  return (
    <dl className="!mb-0">
      {rows.map((row, i) => (
        <div key={i} className="grid gap-1 border-t border-line py-3 sm:grid-cols-[14rem_1fr] sm:gap-5">
          <dt className="label !text-ink-56 pt-0.5">{row.label}</dt>
          <dd className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-ink">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
