import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { CohortTable } from '@/components/admin/CohortTable'
import { GroupMessage } from '@/components/admin/GroupMessage'
import { CallAgenda } from '@/components/admin/CallAgenda'
import { Trend } from '@/components/admin/Trend'
import { getCoachData } from '@/lib/coach'
import { getCohort, requireAdmin } from '@/lib/admin'
import { weekStartDate } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'

export const metadata = { title: 'Admin · Limitless' }

const TOC = [
  { id: 'pulse', label: 'The pulse' },
  { id: 'agenda', label: 'Call agenda' },
  { id: 'group', label: 'Group message' },
  { id: 'members', label: 'Members' },
]

export default async function AdminPage() {
  const admin = await requireAdmin()
  if (!admin) notFound()

  const [cohort, coach] = await Promise.all([getCohort(), getCoachData()])

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

      <Section id="pulse" label="The pulse">
        <div className="!mb-0 grid gap-8 lg:grid-cols-2">
          <Trend
            label="Minutes on the platform"
            suffix=" min"
            points={coach.days.map((d) => ({ day: d.day, value: d.minutes }))}
          />
          <Trend
            label="Members in on the day"
            points={coach.days.map((d) => ({ day: d.day, value: d.people }))}
          />
        </div>

        {/*
          * Where the journal thins out. A chapter everybody read and nobody
          * wrote is a different problem from one nobody opened, and the only
          * way to tell them apart is per entry.
          */}
        <div className="mt-10">
          <p className="label !mb-3">Entries written, by week</p>
          <div className="flex flex-wrap gap-x-6 gap-y-4">
            {Array.from(new Set(coach.entries.map((e) => e.week))).map((week) => {
              const inWeek = coach.entries.filter((e) => e.week === week)
              const any = inWeek.some((e) => e.written > 0)
              return (
                <div key={week} className={any ? '' : 'opacity-30'}>
                  <p className="label !mb-1.5">Week {String(week).padStart(2, '0')}</p>
                  <div className="flex items-end gap-[3px]">
                    {inWeek.map((entry) => (
                      <div
                        key={entry.n}
                        className="w-2 rounded-sm"
                        title={`Entry ${entry.n}, ${entry.title}: ${entry.written} of ${coach.members}`}
                        style={{
                          height: `${Math.max(2, (entry.written / Math.max(1, coach.members)) * 40)}px`,
                          background:
                            entry.written > 0 ? 'var(--color-accent)' : 'var(--color-line)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-4 !mb-0 text-[0.8125rem] !text-ink-40">
            {coach.writers} of {coach.members} have written in the digital journal. Admins are left
            out of every figure here.
          </p>
        </div>
      </Section>

      <Section id="agenda" label="Call agenda">
        <CallAgenda week={groupWeek} />
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
    </Shell>
  )
}
