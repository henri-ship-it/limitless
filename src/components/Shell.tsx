import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { getMember, getProgress, getStreak } from '@/lib/member'
import { getSetup, isOpen } from '@/lib/onboarding'
import { Tour } from './Tour'
import { supabaseConfigured } from '@/lib/env'
import { clockFor, currentWeek, unlockedThrough } from '@/lib/cohort'
import { viewingAs } from '@/lib/programme-mode'
import { modeFor, tierInfo } from '@/content/programme'
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
  /*
   * The sidebar is drawn against this member's own clock. On a cohort member
   * that is the cohort's, which is every 4.0 member and how this read before
   * Core was sold on its own.
   */
  const clock = clockFor(member)
  const active = currentWeek(new Date(), clock)
  const isAdmin = member?.isAdmin ?? false
  /*
   * The product being drawn. A member's own, and for an admin whichever one
   * they have picked, which is the whole of what the switcher does: the rest of
   * this component reads `viewing` and so draws Core's platform for an admin
   * looking at Core, not just Core's journal.
   *
   * It does not widen or narrow what anybody is allowed to reach. Route guards
   * read the real tier and isAdmin, so an admin looking at Core keeps every
   * door an admin has.
   */
  const viewing = await viewingAs(tier, isAdmin)
  const mode = modeFor(viewing)
  const openThrough = unlockedThrough(new Date(), isAdmin, clock)
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

  /*
   * Setting up, which gates the whole platform for a new member.
   *
   * Somebody who has not set a baseline is sent to set one rather than shown
   * a programme they have no starting point for, and the blueprint, the
   * nudges and the check-ins all read from it. Only members on the rebuilt
   * journey: nobody mid-cohort is locked out of a platform they have been
   * using for three months.
   *
   * The path comes from the middleware as a header, because a server
   * component cannot otherwise ask what it is rendering. Without it the gate
   * would bounce somebody off the privacy notice and out of their own
   * account.
   */
  const setup = member ? await getSetup(member.id, member.cohort) : null
  const path = (await headers()).get('x-pathname') ?? ''

  if (setup?.applies && !setup.hasBaseline && !isOpen(path)) {
    redirect('/journey/baseline')
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Shown once, after the baseline and before anything else. */}
      {setup?.applies && setup.hasBaseline && !setup.toured && (
        <Tour firstName={member?.firstName ?? null} />
      )}
      {/* Preview mode has a stub member but no client to report to. */}
      {member && supabaseConfigured ? <TimeOnPage /> : null}
      <TopBar
        tier={viewing}
        viewing={viewing}
        isAdmin={isAdmin}
        currentWeek={active}
        openThrough={openThrough}
        completedWeeks={completed}
        streak={streak}
        mode={mode}
        eliteChapter={eliteChapter}
      />

      <div className="mx-auto flex max-w-[var(--container)] items-stretch">
        <Sidebar
          mode={mode}
          currentWeek={active}
          openThrough={openThrough}
          completedWeeks={completed}
          isPro={tierInfo(viewing).groupCalls}
          viewing={viewing}
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
