import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { CohortTable } from '@/components/admin/CohortTable'
import { GroupMessage } from '@/components/admin/GroupMessage'
import { getCohort, requireAdmin } from '@/lib/admin'
import { weekStartDate } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'

export const metadata = { title: 'Admin · Limitless' }

const TOC = [
  { id: 'group', label: 'Group message' },
  { id: 'members', label: 'Members' },
]

export default async function AdminPage() {
  const admin = await requireAdmin()
  if (!admin) notFound()

  const cohort = await getCohort()

  /*
   * Before the programme opens, currentWeek() is 0. The group message is always
   * about a real chapter, so it looks at week one until there is a week to be in.
   */
  const groupWeek = Math.max(1, cohort.currentWeek)
  const chapter = getWeek(groupWeek)
  const sinceStart = Date.now() - weekStartDate(groupWeek).getTime()
  const dayOfWeek =
    cohort.currentWeek === 0 ? 0 : Math.min(7, Math.floor(sinceStart / 86_400_000) + 1)

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

      <Section id="group" label="Group message">
        <GroupMessage
          week={groupWeek}
          title={chapter?.title ?? ''}
          day={dayOfWeek}
          weeks={weeks.length}
        />
        <p className="mt-6 !text-ink-56 text-[0.8125rem]">
          For the Pro group only, since Core members have no chat. Anything worth saying to one
          person is drafted from their own profile, where it can see them.
        </p>
      </Section>

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
