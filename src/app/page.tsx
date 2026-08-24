import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { Checklist } from '@/components/Checklist'
import { CopyEmail } from '@/components/CopyEmail'
import { Workshops } from '@/components/Workshops'
import { checklistFor } from '@/content/checklist'
import { COHORT, modules, weeks } from '@/content/programme'
import { SUPPORT_EMAIL } from '@/content/assets'
import { getMember, getProgress } from '@/lib/member'

const TOC = [
  { id: 'get-started', label: 'Get started' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'workshops', label: 'Workshops' },
  { id: 'rhythm', label: 'The weekly rhythm' },
  { id: 'support', label: 'Support' },
]

export default async function StartGuide() {
  const member = await getMember()
  const progress = member
    ? await getProgress(member.id)
    : { completedItems: new Set<string>(), completedWeeks: new Set<number>() }
  const tier = member?.tier ?? 'core'
  const items = checklistFor(tier)

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow={`Cohort ${COHORT.label}`}
        title={member?.firstName ? `Welcome, ${member.firstName}` : 'Start Guide'}
        lede="Sixteen weeks, four modules, one journal. This page covers how the programme runs and what to do before it begins."
        pills={
          <>
            <span className="pill">{tier}</span>
            <span className="pill">
              {progress.completedItems.size}/{items.length} set up
            </span>
            <span className="pill">
              {progress.completedWeeks.size}/{weeks.length} weeks complete
            </span>
          </>
        }
      />

      <Section id="get-started" label="Get started">
        <Checklist items={items} completed={[...progress.completedItems]} />
        <p className="mt-6 !text-ink-56 text-[0.8125rem]">
          Your progress is saved as you go.
        </p>
      </Section>

      <Section id="how-it-works" label="How it works">
        <p>
          Each module runs three chapters and then a deload week. A deload week introduces no new
          concepts. It is there to integrate what you have covered, and it closes with the module
          workshop.
        </p>
        <div className="mt-8 space-y-8">
          {modules.map((m) => (
            <div key={m.number} className="border-t border-line pt-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="pill">Module {String(m.number).padStart(2, '0')}</span>
                <span className="text-[1.0625rem] font-medium text-ink">{m.name}</span>
              </div>
              <p className="mb-4 text-[0.9375rem]">{m.summary}</p>
              <ul className="!list-none !pl-0 !mb-0">
                {m.weeks.map((n) => {
                  const w = weeks.find((x) => x.number === n)!
                  return (
                    <li key={n} className="flex items-baseline gap-4 border-t border-line py-2.5">
                      <span className="label w-14 shrink-0">Week {n}</span>
                      <span className="text-[0.9375rem] text-ink">{w.title}</span>
                      {w.topic ? <span className="pill ml-auto">{w.topic}</span> : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="workshops" label="Workshops">
        <p>
          Four workshops, one at the end of each module.
          {tier === 'pro'
            ? ' You join all four live.'
            : ' The recording is posted on the deload week page.'}
        </p>
        <Workshops />
      </Section>

      <Section id="rhythm" label="The weekly rhythm">
        <ul className="!list-none !pl-0 !mb-0">
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-24 shrink-0 pt-0.5">Sunday</span>
            <span>The week ahead is released, by email and here.</span>
          </li>
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-24 shrink-0 pt-0.5">Daily</span>
            <span>A journal entry. Preview the day, then review it.</span>
          </li>
          <li className="flex gap-5 border-t border-line py-3">
            <span className="label w-24 shrink-0 pt-0.5">End of week</span>
            <span>The huddle. What worked, what did not, what changes.</span>
          </li>
          <li className="flex gap-5 border-y border-line py-3">
            <span className="label w-24 shrink-0 pt-0.5">Every fourth</span>
            <span>A deload week and the module workshop.</span>
          </li>
        </ul>
      </Section>

      <Section id="support" label="Support">
        <p>
          {tier === 'pro'
            ? 'Message the WhatsApp community for anything to do with the programme. For something you would rather keep private, message Chris directly or email him.'
            : 'Email Chris, or reply to any email he sends. He reads and answers every one.'}
        </p>
        <CopyEmail address={SUPPORT_EMAIL} />
        {tier === 'core' ? (
          <p className="mt-8 text-[0.9375rem]">
            Interested in Pro? Reply to any email from Chris.
          </p>
        ) : null}
      </Section>

      <div className="px-6 py-10 sm:px-10">
        <Link
          href="/week/1"
          className="label !text-white inline-flex items-center bg-ink px-5 py-3 no-underline hover:bg-ink-72"
        >
          Start week 1
        </Link>
      </div>
    </Shell>
  )
}
