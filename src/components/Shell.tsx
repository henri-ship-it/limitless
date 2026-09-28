import { getMember, getProgress, getStreak } from '@/lib/member'
import { supabaseConfigured } from '@/lib/env'
import { currentWeek, unlockedThrough } from '@/lib/cohort'
import { getMode } from '@/lib/programme-mode'
import { currentEliteChapter } from '@/content/elite'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { OnThisPage, type TocItem } from './OnThisPage'
import { Footer } from './Footer'
import { TimeOnPage } from './TimeOnPage'

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
  const streak = member ? await getStreak() : 0
  const active = currentWeek()
  const isAdmin = member?.isAdmin ?? false
  const mode = await getMode(tier, isAdmin)
  const openThrough = unlockedThrough(new Date(), isAdmin)
  const completed = [...progress.completedWeeks]
  /*
   * Only meaningful in Elite mode, and only from the member's own start date.
   * An admin looking at Elite has none, so nothing is marked as current rather
   * than chapter one being marked for everybody.
   */
  const eliteChapter =
    mode === 'elite' && member?.eliteStartDate
      ? currentEliteChapter(member.eliteStartDate)
      : 0

  return (
    <div className="min-h-screen bg-bg">
      {/* Preview mode has a stub member but no client to report to. */}
      {member && supabaseConfigured ? <TimeOnPage /> : null}
      <TopBar
        tier={tier}
        isAdmin={isAdmin}
        currentWeek={active}
        openThrough={openThrough}
        completedWeeks={completed}
        streak={streak}
        mode={mode}
      />

      <div className="mx-auto flex max-w-[var(--container)] items-stretch">
        <Sidebar
          mode={mode}
          currentWeek={active}
          openThrough={openThrough}
          completedWeeks={completed}
          isPro={tier === 'pro'}
          isAdmin={isAdmin}
          eliteChapter={eliteChapter}
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
