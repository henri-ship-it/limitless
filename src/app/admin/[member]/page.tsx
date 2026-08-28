import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getMemberDetail, requireAdmin, since } from '@/lib/admin'
import { resolveEntry } from '@/lib/entry'
import { getWeek } from '@/content/programme'
import { HUDDLE_QUESTIONS } from '@/content/entry-fields'
import { SITE } from '@/content/site'
import type { EntryData } from '@/content/journal-fields'

export const metadata = { title: 'Member · Limitless' }

export default async function MemberPage({ params }: { params: Promise<{ member: string }> }) {
  const admin = await requireAdmin()
  if (!admin) notFound()

  const { member: id } = await params
  const detail = await getMemberDetail(id)
  if (!detail) notFound()

  const { profile, weeksComplete, entries, totalWeeks } = detail
  const name = profile.first_name ?? profile.email.split('@')[0]

  return (
    <Shell>
      <PageHeader
        eyebrow="Admin"
        title={name}
        lede={profile.email}
        pills={
          <>
            <span className="tier-tag" data-tier={profile.tier}>
              {profile.tier}
            </span>
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
        <p>
          <a href={`mailto:${profile.email}?subject=Limitless`}>Email {name}</a>
        </p>
        <p className="!text-ink-56 text-[0.8125rem]">
          Sent from your own mail, so it reads as a person rather than a system. Replies come back
          to {SITE.email}.
        </p>
      </Section>

      <Section label="What they have written">
        {entries.length === 0 ? (
          <p className="!text-ink-56">Nothing yet.</p>
        ) : (
          <div className="space-y-8">
            {entries.map((row) => {
              const entry = resolveEntry(row.n)
              const week = getWeek(row.week)
              const data = row.data as EntryData
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
                  <Answers entry={entry} data={data} />
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <div className="px-6 py-8 sm:px-10">
        <Link href="/admin" className="label hover:!text-ink">
          ← All members
        </Link>
      </div>
    </Shell>
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
