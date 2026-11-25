import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { CohortTable } from '@/components/admin/CohortTable'
import { GroupMessage } from '@/components/admin/GroupMessage'
import { CallAgenda } from '@/components/admin/CallAgenda'
import { PullCalls } from '@/components/admin/PullCalls'
import { getCohort, requireAdmin } from '@/lib/admin'
import { weekStartDate } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'

export const metadata = { title: 'Admin · Limitless' }

const TOC = [
  { id: 'agenda', label: 'Call agenda' },
  { id: 'recording', label: 'Call recording' },
  { id: 'group', label: 'Group message' },
  { id: 'members', label: 'Members' },
  { id: 'review', label: 'Review' },
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

      <Section id="agenda" label="Call agenda">
        <CallAgenda week={groupWeek} />
      </Section>

      <Section id="recording" label="Call recording">
        <PullCalls />
      </Section>

      <Section id="group" label="Group message">
        <GroupMessage
          week={groupWeek}
          title={chapter?.title ?? ''}
          day={dayOfWeek}
          weeks={weeks.length}
        />
      </Section>

      <Section id="members" label="Members">
        <CohortTable members={cohort.members} />
      </Section>

      {/*
        * The states that cannot be reached by browsing.
        *
        * Each of these was a URL somebody had to remember, which in practice
        * meant none of them was ever looked at. The check-in preview has sat
        * unlinked since the day it was built.
        */}
      <Section id="review" label="Review">
        <p>
          What a member sees in the places you cannot get to from here. Each one renders the real
          page rather than a mock-up of it.
        </p>
        <ul>
          <li>
            <Link href="/week/16?preview=held">The final week, held back</Link> until the
            reflection is answered. Only a member ever sees this: an admin is asked but never
            held, so the real page will not show it to you.
          </li>
          <li>
            <Link href="/week/16?preview=ask">The final week with the ask on top</Link>, which is
            how it reads once they have answered and the week has opened.
          </li>
          <li>
            <Link href="/journey/baseline?preview">The baseline</Link> and{' '}
            <Link href="/journey/reflection?preview">the reflection</Link>, each on a finished
            result. Use <code>?preview=walk</code> on either to sit it from the first question.
          </li>
          <li>
            <Link href="/journey/check-in?preview=w3">The module check-ins</Link>, all eight of
            them. They appear once and cannot be reopened, so this is the only way to read one.
          </li>
        </ul>
      </Section>
    </Shell>
  )
}
