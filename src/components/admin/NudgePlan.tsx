import Link from 'next/link'
import type { MemberRow } from '@/lib/admin'
import { since } from '@/lib/admin'

/**
 * What the platform would send, if it were sending anything.
 *
 * Nothing here goes out. It exists so the shape of retention emails can be
 * judged against real people before any of it is switched on, and so the rules
 * can be argued with while they are still cheap to change.
 */

type Nudge = {
  key: string
  label: string
  why: string
  subject: string
  applies: (m: MemberRow, week: number) => boolean
}

const QUIET_DAYS = 5

function daysSince(iso: string | null): number {
  if (!iso) return Infinity
  return (Date.now() - Date.parse(iso)) / (24 * 60 * 60 * 1000)
}

const NUDGES: Nudge[] = [
  {
    key: 'never-signed-in',
    label: 'Never signed in',
    why: 'They have a place and have not opened it once.',
    subject: 'Your Limitless account is waiting',
    applies: (m) => !m.lastSeenAt,
  },
  {
    key: 'signed-in-not-written',
    label: 'Looked, not written',
    why: 'They have been in but have not put anything in the journal.',
    applies: (m) => Boolean(m.lastSeenAt) && m.entriesWritten === 0,
    subject: 'The first entry is the hard one',
  },
  {
    key: 'gone-quiet',
    label: 'Gone quiet',
    why: `Started writing, then nothing for ${QUIET_DAYS} days.`,
    subject: 'Still here when you are',
    applies: (m) => m.entriesWritten > 0 && daysSince(m.lastWroteAt) > QUIET_DAYS,
  },
  {
    key: 'behind',
    label: 'Behind the cohort',
    why: 'The programme has moved on more than a week ahead of them.',
    subject: 'Pick up where you left off',
    applies: (m, week) => week > 1 && m.weeksComplete < week - 1 && m.entriesWritten > 0,
  },
]

export function NudgePlan({
  members,
  currentWeek,
}: {
  members: MemberRow[]
  currentWeek: number
}) {
  const groups = NUDGES.map((nudge) => ({
    ...nudge,
    matched: members.filter((m) => nudge.applies(m, currentWeek)),
  }))

  const optedOut = members.filter((m) => !m.personalisedNudges).length

  return (
    <div>
      <div className="mb-6 border border-line bg-ink-3 p-4">
        <p className="label mb-1">Not connected</p>
        <p className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">
          Nothing on this page sends. It shows who each rule would catch today, so the rules can be
          judged against real people before any of it is switched on.
        </p>
      </div>

      <div className="space-y-px">
        {groups.map((group) => (
          <div key={group.key} className="border-t border-line py-5">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <p className="!mb-0 text-[1rem] font-medium text-ink">{group.label}</p>
              <span className="pill">{group.matched.length} today</span>
            </div>
            <p className="!mb-2 text-[0.875rem] text-ink-56">{group.why}</p>
            <p className="!mb-3 text-[0.875rem] text-ink-72">
              Subject: <span className="text-ink">{group.subject}</span>
            </p>

            {group.matched.length ? (
              <ul className="!list-none !pl-0 !mb-0 flex flex-wrap gap-1.5">
                {group.matched.map((m) => (
                  <li key={m.id}>
                    <Link href={`/admin/${m.id}`} className="pill !no-underline hover:!text-ink">
                      {m.firstName ?? m.email.split('@')[0]}
                      <span className="!text-ink-40">{since(m.lastSeenAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="!mb-0 text-[0.875rem] text-ink-40">Nobody, which is the good outcome.</p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 !text-ink-56 text-[0.8125rem]">
        {optedOut === 0
          ? 'Everyone is currently happy to receive these.'
          : `${optedOut} ${optedOut === 1 ? 'member has' : 'members have'} turned these off and would be skipped.`}
      </p>
    </div>
  )
}
