import Link from 'next/link'
import { getMember, getProgress } from '@/lib/member'
import { currentWeek } from '@/lib/cohort'
import { Nav } from './Nav'

export async function Shell({ children }: { children: React.ReactNode }) {
  const member = await getMember()
  const progress = member
    ? await getProgress(member.id)
    : { completedWeeks: new Set<number>(), completedItems: new Set<string>() }
  const active = currentWeek()

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-line bg-surface px-4">
        <Link href="/" className="label !text-ink !tracking-[0.18em] font-medium">
          Limitless
        </Link>
        <div className="flex items-center gap-4">
          {member ? (
            <>
              <span className="label hidden sm:inline">{member.tier}</span>
              <span className="label hidden md:inline">{member.email}</span>
              <a href="/auth/sign-out" className="label hover:!text-ink">
                Sign out
              </a>
            </>
          ) : null}
        </div>
      </header>

      <div className="lg:flex lg:items-stretch">
        <Nav
          completedWeeks={[...progress.completedWeeks]}
          currentWeek={active}
          tier={member?.tier ?? 'core'}
        />
        <main className="min-w-0 flex-1 bg-surface">{children}</main>
      </div>
    </div>
  )
}
