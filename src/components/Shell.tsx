import { getMember, getProgress } from '@/lib/member'
import { currentWeek, resumeHref, unlockedThrough } from '@/lib/cohort'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { OnThisPage, type TocItem } from './OnThisPage'
import { Footer } from './Footer'

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
  const tier = member?.tier ?? 'core'
  const active = currentWeek()
  const openThrough = unlockedThrough()
  const completed = [...progress.completedWeeks]
  const resume = resumeHref(progress.completedWeeks, openThrough)

  return (
    <div className="min-h-screen bg-bg">
      <TopBar
        resumeHref={resume}
        tier={tier}
        currentWeek={active}
        openThrough={openThrough}
        completedWeeks={completed}
      />

      <div className="mx-auto flex max-w-[var(--container)] items-stretch">
        <Sidebar
          currentWeek={active}
          openThrough={openThrough}
          completedWeeks={completed}
          isPro={tier === 'pro'}
          isAdmin={member?.isAdmin ?? false}
        />
        <main className="guides min-w-0 flex-1 bg-surface">
          {children}
          <Footer />
        </main>
        {toc ? <OnThisPage items={toc} /> : null}
      </div>
    </div>
  )
}
