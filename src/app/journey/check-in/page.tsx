import { notFound } from 'next/navigation'

import { Pulse } from '@/components/Pulse'
import { elitePulseFor, pulseFor } from '@/content/pulse'

/**
 * The module check-in, on a page of its own so it can be looked at.
 *
 * The real one appears over the week or the chapter it belongs to, and only
 * for a member who has reached that week and not answered yet, which makes it
 * the one thing on the platform nobody can simply go and look at. This is
 * that, on a stand-in page, so it can be reviewed or shown to somebody without
 * waiting eleven weeks.
 *
 * `?preview=w7` and so on picks which one. Nothing posts: the component saves
 * to the API as usual and the API refuses without a session, which is the
 * right way round for a page anybody can open.
 */
export const dynamic = 'force-dynamic'

const EXAMPLES = [
  { key: 'w3', label: 'Week 3, end of Learn' },
  { key: 'w7', label: 'Week 7, end of Manage' },
  { key: 'w11', label: 'Week 11, end of Nurture' },
  { key: 'w15', label: 'Week 15, end of Thrive' },
  { key: 'c1', label: 'Elite, chapter 1' },
  { key: 'c4', label: 'Elite, chapter 4' },
  { key: 'c8', label: 'Elite, chapter 8' },
  { key: 'c12', label: 'Elite, chapter 12' },
]

export const metadata = { title: 'Check-in · Limitless' }

export default async function CheckInPreview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const asked = (await searchParams).preview
  if (asked === undefined) notFound()

  const value = Array.isArray(asked) ? asked[0] : asked
  const key = value && EXAMPLES.some((e) => e.key === value) ? value : 'w7'
  const n = Number(key.slice(1))
  const spec = key.startsWith('c') ? elitePulseFor(n) : pulseFor(n)
  if (!spec) notFound()

  return (
    <main className="min-h-[100dvh] bg-bg px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-caption text-[2rem] leading-[0.95] font-bold uppercase">
          The module check-in
        </h1>
        <p className="mt-4 max-w-prose text-[0.9375rem] leading-relaxed text-ink-72">
          It comes up over the week it belongs to, once, and can be ignored. One tap answers it and
          saves the score; everything after that is offered rather than asked for. Pick one below
          and it will appear in the corner.
        </p>

        <ul className="mt-7 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <li key={example.key}>
              <a
                href={`?preview=${example.key}`}
                aria-current={example.key === key ? 'page' : undefined}
                className={
                  example.key === key
                    ? 'inline-block border border-ink bg-ink px-3 py-1.5 text-[0.8125rem] font-medium text-surface'
                    : 'inline-block border border-line px-3 py-1.5 text-[0.8125rem] text-ink-56 hover:border-line-strong hover:text-ink'
                }
              >
                {example.label}
              </a>
            </li>
          ))}
        </ul>

        {/* A stand-in for the page it normally sits over, so the sheet has
            something to sit over. */}
        <div className="mt-10 border border-line bg-surface p-8 opacity-40">
          <p className="font-mono text-[0.6875rem] tracking-[0.12em] text-ink-40 uppercase">
            Week {spec.week}
          </p>
          <p className="mt-3 font-caption text-[2rem] leading-[0.95] font-bold uppercase">
            {spec.moduleTitle}
          </p>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-56">
            The week page sits here. The check-in is the thing in the corner.
          </p>
        </div>
      </div>

      <Pulse key={key} spec={spec} firstName="Henri" />
    </main>
  )
}
