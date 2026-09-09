import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getMember } from '@/lib/member'
import { ELITE, currentEliteMonth, eliteMonth, eliteMonths, formatEliteMonth } from '@/content/elite'

export const metadata = { title: 'Month · Elite' }

/**
 * One month of Elite.
 *
 * The month's work is four weeks against the journal, which is how the digest
 * already breaks it up, so that is how it is set out here rather than as
 * twenty eight entries in a row. Twenty eight numbered boxes is a wall; four
 * weeks of seven is a plan.
 *
 * The entries themselves are not loaded. The Elite journal is four printed
 * books that have not been parsed the way the sixteen week one was, and a page
 * that pretends to have them would be worse than one that says plainly it does
 * not.
 */
export default async function EliteMonthPage({
  params,
}: {
  params: Promise<{ month: string }>
}) {
  const member = await getMember()
  // Their own programme, or one of the two people who run it.
  if (!member || (!member.isAdmin && member.tier !== 'elite')) notFound()

  const { month: raw } = await params
  const n = Number(raw)
  const month = eliteMonth(n)
  if (!month) notFound()

  const open = Math.max(1, currentEliteMonth())
  const prev = eliteMonths.find((m) => m.n === n - 1)
  const next = eliteMonths.find((m) => m.n === n + 1)

  const weeks = [0, 1, 2, 3].map((i) => ({
    n: i + 1,
    from: month.firstEntry + i * 7,
    to: month.firstEntry + i * 7 + 6,
  }))

  return (
    <Shell>
      <PageHeader
        eyebrow={`Elite · Month ${String(n).padStart(2, '0')} of ${ELITE.months}`}
        title={month.title}
        lede={`Entries ${month.firstEntry} to ${month.lastEntry}, in journal ${month.volume}.`}
        pills={
          <>
            <span className="pill">{formatEliteMonth(n)}</span>
            <span className="pill">{ELITE.entriesPerMonth} entries</span>
            {n === open ? <span className="pill !text-ink">This month</span> : null}
          </>
        }
      />

      <Section label="The month's work">
        <p className="!mb-6">
          Four weeks against the journal. The digest sets out what each week is for; the pages
          themselves are in journal {month.volume}.
        </p>
        <ol className="!mb-0 !list-none !pl-0 grid gap-3 sm:grid-cols-2">
          {weeks.map((week) => (
            <li key={week.n} className="border border-line p-4">
              <p className="label !mb-1">Week {week.n}</p>
              <p className="!mb-0 text-[0.9375rem] text-ink-72">
                Entries {week.from} to {week.to}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="The digest">
        <p className="!mb-0 !text-ink-56">
          The monthly digest for this chapter is not loaded into the platform yet. It goes out from
          Kit in the meantime, on the first of the month.
        </p>
      </Section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-8 sm:px-10">
        <Link href="/elite" className="label hover:!text-ink">
          The year
        </Link>
        <div className="flex gap-6">
          {prev ? (
            <Link href={`/elite/month/${prev.n}`} className="label hover:!text-ink">
              ← {prev.title}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/elite/month/${next.n}`} className="label hover:!text-ink">
              {next.title} →
            </Link>
          ) : null}
        </div>
      </div>
    </Shell>
  )
}
