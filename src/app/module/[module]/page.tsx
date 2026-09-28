import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { LockIcon, TickIcon } from '@/components/icons'
import { getModule, getWeek, modules } from '@/content/programme'
import { getMember, getProgress } from '@/lib/member'
import { formatWeekStart, isUnlocked } from '@/lib/cohort'
import { getMode } from '@/lib/programme-mode'
import {
  ELITE,
  chaptersInModule,
  currentEliteChapter,
  formatEliteChapter,
} from '@/content/elite'

export function generateStaticParams() {
  return modules.map((m) => ({ module: String(m.number) }))
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: moduleParam } = await params
  const module = getModule(Number(moduleParam) as 1 | 2 | 3 | 4)
  if (!module) notFound()

  const member = await getMember()
  const progress = member
    ? await getProgress(member.id)
    : { completedWeeks: new Set<number>(), completedItems: new Set<string>() }
  const mode = await getMode(member?.tier ?? 'core', member?.isAdmin ?? false)

  /*
   * The same four modules hold both programmes, but they hold different things:
   * three chapters and a deload over four weeks here, three chapters over
   * twelve weeks there, dated from the member's own start rather than a
   * cohort's.
   */
  if (mode === 'elite') {
    const chapters = chaptersInModule(module.number)
    const start = member?.eliteStartDate ?? new Date().toISOString().slice(0, 10)
    const open = member?.eliteStartDate ? currentEliteChapter(start) : 0

    return (
      <Shell>
        <PageHeader
          eyebrow={`Module ${String(module.number).padStart(2, '0')} of 04`}
          title={module.name}
          lede={module.summary}
          pills={
            <>
              <span className="pill">
                Chapters {chapters[0].n} to {chapters[chapters.length - 1].n}
              </span>
              <span className="pill">Three chapters</span>
              <span className="pill">
                {chapters.length * ELITE.weeksPerChapter} weeks
              </span>
              <span className="pill">Journal {chapters[0].volume}</span>
            </>
          }
        />

        <Section label="Chapters">
          <ul className="!list-none !pl-0">
            {chapters.map((c) => {
              const done = progress.completedWeeks.has(c.n)
              return (
                <li key={c.n} className="border-t border-line last:border-b">
                  <Link
                    href={`/elite/chapter/${c.n}`}
                    className="flex items-center justify-between gap-4 py-5 no-underline hover:bg-bg/50"
                  >
                    <span className="flex min-w-0 items-baseline gap-4">
                      <span className="label w-6 shrink-0">
                        {String(c.n).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[1.0625rem]">{c.title}</span>
                        <span className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="pill">
                            Entries {c.firstEntry} to {c.lastEntry}
                          </span>
                          <span className="label">{formatEliteChapter(start, c.n)}</span>
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0">
                      {done ? (
                        <span className="pill !text-accent-ink">
                          <TickIcon /> Done
                        </span>
                      ) : c.n === open ? (
                        <span className="pill !text-ink">Now</span>
                      ) : (
                        <span className="pill">Open</span>
                      )}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </Section>
      </Shell>
    )
  }

  return (
    <Shell>
      <PageHeader
        eyebrow={`Module ${String(module.number).padStart(2, '0')} of 04`}
        title={module.name}
        lede={module.summary}
        pills={
          <>
            <span className="pill">
              Weeks {module.weeks[0]} to {module.weeks[module.weeks.length - 1]}
            </span>
            <span className="pill">Three chapters and a deload</span>
          </>
        }
      />

      <Section label="Chapters">
        <ul className="!list-none !pl-0">
          {module.weeks.map((n) => {
            const week = getWeek(n)!
            const unlocked = isUnlocked(n, member?.isAdmin ?? false)
            const done = progress.completedWeeks.has(n)
            const inner = (
              <>
                <span className="flex min-w-0 items-baseline gap-4">
                  <span className="label w-6 shrink-0">{String(n).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className="block text-[1.0625rem]">{week.title}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="pill">{week.topic ?? 'Integration'}</span>
                      <span className="label">{formatWeekStart(n)}</span>
                    </span>
                  </span>
                </span>
                <span className="shrink-0">
                  {done ? (
                    <span className="pill !text-accent-ink">
                      <TickIcon /> Done
                    </span>
                  ) : unlocked ? (
                    <span className="pill">Open</span>
                  ) : (
                    <span className="pill">
                      <LockIcon /> Locked
                    </span>
                  )}
                </span>
              </>
            )

            return (
              <li key={n} className="border-t border-line last:border-b">
                {unlocked ? (
                  <Link
                    href={`/week/${n}`}
                    className="flex items-center justify-between gap-4 py-5 no-underline hover:bg-bg/50"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-4 py-5 opacity-50">
                    {inner}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Section>
    </Shell>
  )
}
