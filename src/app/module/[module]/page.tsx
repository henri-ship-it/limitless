import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getModule, getWeek, modules } from '@/content/programme'
import { getMember, getProgress } from '@/lib/member'
import { formatWeekStart, isUnlocked } from '@/lib/cohort'

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

  return (
    <Shell>
      <PageHeader
        eyebrow={`Module ${String(module.number).padStart(2, '0')} of 04`}
        title={module.name}
        meta={
          <>
            <span className="label">
              Weeks {module.weeks[0]} to {module.weeks[module.weeks.length - 1]}
            </span>
            <span className="label">Three chapters and a deload</span>
          </>
        }
      />

      <Section>
        <p className="text-[1.125rem] leading-relaxed">{module.summary}</p>
      </Section>

      <Section label="Chapters">
        <ul className="!list-none !pl-0">
          {module.weeks.map((n) => {
            const week = getWeek(n)!
            const unlocked = isUnlocked(n)
            const done = progress.completedWeeks.has(n)
            const inner = (
              <>
                <span className="flex min-w-0 items-baseline gap-4">
                  <span className="label w-6 shrink-0">{String(n).padStart(2, '0')}</span>
                  <span className="min-w-0">
                    <span className="block text-[1.0625rem]">{week.title}</span>
                    <span className="mt-1 block text-[0.8125rem] text-ink-muted">
                      {week.topic ?? 'Integration week'} · {formatWeekStart(n)}
                    </span>
                  </span>
                </span>
                <span className="label shrink-0">
                  {done ? <span className="!text-accent">Done</span> : unlocked ? 'Open' : 'Locked'}
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
