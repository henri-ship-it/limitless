import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { CohortTable } from '@/components/admin/CohortTable'
import { getCohort, requireAdmin } from '@/lib/admin'

export const metadata = { title: 'Admin · Limitless' }

const TOC = [{ id: 'members', label: 'Members' }]

export default async function AdminPage() {
  const admin = await requireAdmin()
  if (!admin) notFound()

  const cohort = await getCohort()

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Admin only"
        title="Cohort admin"
        lede="Who is with you and who has gone quiet, sorted by the longest gone. Only admins can open this. Members cannot see it, and cannot see each other."
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
        <CohortTable members={cohort.members} />
        <p className="mt-6 !text-ink-56 text-[0.8125rem]">
          Last seen takes the later of a page load and a sign-in. Wrote is the last time an entry
          changed, which says more. Time counts only while the tab was actually in front.
        </p>
      </Section>
    </Shell>
  )
}
