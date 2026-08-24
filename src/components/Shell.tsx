import { getMember, getProgress } from '@/lib/member'
import { currentWeek } from '@/lib/cohort'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { OnThisPage, type TocItem } from './OnThisPage'

export async function Shell({
  children,
  toc,
}: {
  children: React.ReactNode
  toc?: TocItem[]
}) {
  const member = await getMember()
  const progress = member
    ? await getProgress(member.id)
    : { completedWeeks: new Set<number>(), completedItems: new Set<string>() }
  const active = currentWeek()
  const completed = [...progress.completedWeeks]

  return (
    <div className="min-h-screen bg-bg">
      <TopBar tier={member?.tier ?? 'core'} currentWeek={active} completedWeeks={completed} />

      <div className="mx-auto flex max-w-[var(--container)] items-stretch">
        <Sidebar
          currentWeek={active}
          completedWeeks={completed}
          isPro={member?.tier === 'pro'}
        />
        <main className="guides min-w-0 flex-1 bg-surface">{children}</main>
        {toc ? <OnThisPage items={toc} /> : null}
      </div>
    </div>
  )
}
