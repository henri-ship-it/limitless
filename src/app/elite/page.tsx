import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getMember } from '@/lib/member'
import {
  ELITE,
  ELITE_ENTRIES,
  currentEliteMonth,
  eliteMonths,
  formatEliteMonth,
} from '@/content/elite'

export const metadata = { title: 'Elite · Limitless' }

const TOC = [
  { id: 'where', label: 'Where you are' },
  { id: 'months', label: 'The twelve months' },
  { id: 'how', label: 'How it runs' },
]

/**
 * The Elite dashboard.
 *
 * A year is not sixteen weeks with more gaps in it, so this does not try to be
 * the Start Guide with different numbers. What matters on a monthly programme
 * is which month you are in and how much of it is left, because the failure
 * mode is not falling behind, it is a fortnight going by without opening it.
 *
 * Admin only while the member facing half is built. Luke is the one member and
 * he has not been switched over yet, so showing him a half finished programme
 * would be worse than showing him nothing.
 */
export default async function ElitePage() {
  const member = await getMember()
  if (!member?.isAdmin) notFound()

  const month = currentEliteMonth()
  const open = Math.min(ELITE.months, Math.max(1, month))
  const current = eliteMonths.find((m) => m.n === open)!

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow={`${ELITE.label}, also sold as ${ELITE.alias}`}
        title="The year"
        lede="Twelve chapters, one a month, across four printed journals. The same frameworks as the sixteen week programme, taken further and given room."
        pills={
          <>
            <span className="pill !text-ink">
              Month {String(open).padStart(2, '0')} of {ELITE.months}
            </span>
            <span className="pill">{ELITE_ENTRIES} entries</span>
            <span className="pill">{ELITE.entriesPerMonth} a month</span>
            <span className="pill">No deloads</span>
          </>
        }
      />

      <Section id="where" label="Where you are">
        <div className="!mb-0 border border-line p-6">
          <p className="label !mb-2">
            {formatEliteMonth(open)} · Journal {current.volume}
          </p>
          <p className="!mb-3 text-[1.625rem] leading-tight font-medium tracking-[-0.022em]">
            {current.title}
          </p>
          <p className="!mb-5 text-[0.9375rem] leading-relaxed text-ink-72">
            Entries {current.firstEntry} to {current.lastEntry}, broken into four weeks of work
            against the journal.
          </p>
          <Link
            href={`/elite/month/${open}`}
            className="label !text-white bg-ink px-4 py-3 !no-underline hover:bg-ink-72"
          >
            Open this month
          </Link>
        </div>
      </Section>

      <Section id="months" label="The twelve months">
        <ol className="!mb-0 !list-none !pl-0">
          {eliteMonths.map((m) => {
            const done = m.n < open
            const now = m.n === open
            return (
              <li key={m.n} className="border-t border-line last:border-b">
                <Link
                  href={`/elite/month/${m.n}`}
                  className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3.5 !no-underline hover:bg-ink-3"
                >
                  <span className="label w-6 shrink-0">{String(m.n).padStart(2, '0')}</span>
                  <span
                    className={`min-w-0 flex-1 text-[1rem] ${now ? 'font-medium text-ink' : done ? 'text-ink-72' : 'text-ink-56'}`}
                  >
                    {m.title}
                  </span>
                  <span className="label !text-ink-40">
                    {m.firstEntry} to {m.lastEntry}
                  </span>
                  <span className="label !text-ink-40 w-16 text-right">Journal {m.volume}</span>
                  {now ? <span className="radar shrink-0" aria-hidden /> : null}
                </Link>
              </li>
            )
          })}
        </ol>
      </Section>

      <Section id="how" label="How it runs">
        <p>
          One chapter a month. The digest arrives {ELITE.digest.toLowerCase()}, written to the month
          rather than the week: one long piece with the work split across four weeks against the
          journal, rather than a short note every Sunday.
        </p>
        <p>
          There are no deload weeks. A deload exists on the sixteen week programme because a new
          framework every week is more than anybody can absorb without a pause. A month a chapter
          is already that pause, so a month of nothing would only be a month of nothing.
        </p>
        <p className="!mb-0">
          The journal runs to {ELITE_ENTRIES} entries across {ELITE.volumes} printed books, three
          months to a book.
        </p>
      </Section>
    </Shell>
  )
}
