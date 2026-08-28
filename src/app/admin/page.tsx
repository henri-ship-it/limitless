import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { NudgePlan } from '@/components/admin/NudgePlan'
import { getCohort, requireAdmin, since } from '@/lib/admin'
import { weeks } from '@/content/programme'

export const metadata = { title: 'Cohort · Limitless' }

const TOC = [
  { id: 'members', label: 'Members' },
  { id: 'nudges', label: 'Nudges' },
]

export default async function AdminPage() {
  const admin = await requireAdmin()
  if (!admin) notFound()

  const cohort = await getCohort()

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Admin"
        title="The cohort"
        lede="Who is with you and who has gone quiet. Sorted by the longest gone."
        pills={
          <>
            <span className="pill">{cohort.members.length} members</span>
            <span className="pill">{cohort.signedIn} signed in</span>
            <span className="pill">{cohort.activeThisWeek} active this week</span>
            {cohort.notStarted ? (
              <span className="pill !text-ink">{cohort.notStarted} never signed in</span>
            ) : null}
          </>
        }
      />

      <Section id="members" label="Members">
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {['Member', 'Tier', 'Last seen', 'Wrote', 'Weeks', 'Entries'].map((h) => (
                  <th key={h} className="label py-2 pr-4 font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohort.members.map((m) => (
                <tr key={m.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4">
                    <Link href={`/admin/${m.id}`} className="text-[0.9375rem] !text-ink">
                      {m.firstName ?? m.email.split('@')[0]}
                    </Link>
                    <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-40">
                      {m.email}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="tier-tag" data-tier={m.tier}>
                      {m.tier}
                    </span>
                  </td>
                  <td className="label py-3 pr-4 !text-ink-72">{since(m.lastSeenAt)}</td>
                  <td className="label py-3 pr-4 !text-ink-72">{since(m.lastWroteAt)}</td>
                  <td className="label py-3 pr-4 !text-ink-72">
                    {m.weeksComplete}/{weeks.length}
                  </td>
                  <td className="label py-3 !text-ink-72">{m.entriesWritten}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 !text-ink-56 text-[0.8125rem]">
          Last seen is a page load. Wrote is the last time an entry changed, which says more.
        </p>
      </Section>

      <Section id="nudges" label="Nudges">
        <NudgePlan members={cohort.members} currentWeek={cohort.currentWeek} />
      </Section>
    </Shell>
  )
}
