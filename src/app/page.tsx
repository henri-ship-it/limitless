import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { Checklist } from '@/components/Checklist'
import { checklistFor } from '@/content/checklist'
import { tierComparison } from '@/content/tiers'
import { COHORT, modules, weeks } from '@/content/programme'
import { assets } from '@/content/assets'
import { getMember, getProgress } from '@/lib/member'
import { currentWeek, formatWeekStart } from '@/lib/cohort'

export default async function StartGuide() {
  const member = await getMember()
  const progress = member
    ? await getProgress(member.id)
    : { completedItems: new Set<string>(), completedWeeks: new Set<number>() }
  const tier = member?.tier ?? 'core'
  const items = checklistFor(tier)
  const week = currentWeek()

  return (
    <Shell>
      <PageHeader
        eyebrow={`Cohort ${COHORT.label}`}
        title={member?.firstName ? `Welcome, ${member.firstName}` : 'Start Guide'}
        meta={
          <>
            <span className="label">
              {progress.completedItems.size}/{items.length} set up
            </span>
            <span className="label">
              {progress.completedWeeks.size}/{weeks.length} weeks complete
            </span>
            <span className="label">
              {week === 0 ? 'Onboarding week' : week > 16 ? 'Programme complete' : `Week ${week}`}
            </span>
          </>
        }
      />

      <Section label="Get started">
        <p className="mb-6 text-ink-muted">
          Work through these before Monday {formatWeekStart(1).replace(' 2026', '')}. Your
          progress is saved as you go.
        </p>
        <Checklist items={items} completed={[...progress.completedItems]} />
      </Section>

      <Section label="Onboarding call">
        {assets.onboardingRecording.url ? (
          <p>
            <a href={assets.onboardingRecording.url} target="_blank" rel="noreferrer">
              Watch the recording
            </a>
          </p>
        ) : (
          <p className="text-ink-muted">
            The call is on {new Date(COHORT.onboardingCall.date).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            , {COHORT.onboardingCall.time}. The recording is posted here afterwards.
          </p>
        )}
      </Section>

      <Section label="Your journal">
        <p>
          Your physical journal is posted to you. The PDF is the same book, with all 112 entries.
        </p>
        <p>
          <a href="/journal/download">Download the PDF journal</a>
        </p>
      </Section>

      <Section label="How the sixteen weeks work">
        <p>
          Sixteen weeks, four modules. Each module runs three chapters and then a deload week. A
          deload week introduces no new concepts. It is there to integrate what you have covered,
          and it closes with the module workshop.
        </p>
        <div className="mt-6 space-y-6">
          {modules.map((m) => (
            <div key={m.number} className="border-t border-line pt-4">
              <p className="label mb-2">
                Module {String(m.number).padStart(2, '0')} · {m.name}
              </p>
              <p className="mb-3 text-[0.9375rem] text-ink-muted">{m.summary}</p>
              <ul className="!list-none !pl-0 text-[0.9375rem]">
                {m.weeks.map((n) => {
                  const w = weeks.find((x) => x.number === n)!
                  return (
                    <li key={n} className="flex gap-3">
                      <span className="label w-14 shrink-0 pt-0.5">Week {n}</span>
                      <span>
                        {w.title}
                        {w.topic ? (
                          <span className="text-ink-muted"> · {w.topic.toLowerCase()}</span>
                        ) : null}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section label="What your membership includes">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] border-collapse text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line">
                <th className="label py-3 text-left font-normal">Included</th>
                <th className="label w-20 py-3 text-left font-normal">Core</th>
                <th className="label w-20 py-3 text-left font-normal">Pro</th>
              </tr>
            </thead>
            <tbody>
              {tierComparison.map((row) => (
                <tr key={row.feature} className="border-b border-line">
                  <td className="py-3 pr-4">{row.feature}</td>
                  <td className={row.core ? 'text-accent' : 'text-ink-muted'}>
                    {row.core ? '✓' : '—'}
                  </td>
                  <td className={row.pro ? 'text-accent' : 'text-ink-muted'}>
                    {row.pro ? '✓' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-6 text-[0.8125rem] text-ink-muted">
          You are on {tier === 'pro' ? 'Pro' : 'Core'}.
          {tier === 'core' ? ' Interested in Pro? Reply to any email from Chris.' : null}
        </p>
      </Section>

      <Section label="Getting support">
        <p>
          {tier === 'pro'
            ? 'Message the WhatsApp community for anything to do with the programme. For something you would rather keep private, message Chris directly or reply to any email.'
            : 'Reply to any email from Chris. He reads and answers every one.'}
        </p>
      </Section>

      <Section label="Timeline">
        <ul className="!list-none !pl-0">
          <li className="flex gap-4 border-b border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">This week</span>
            <span>Onboarding. Work through the list above.</span>
          </li>
          <li className="flex gap-4 border-b border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">{formatWeekStart(1)}</span>
            <span>Week 1 begins. Know Thyself.</span>
          </li>
          <li className="flex gap-4 border-b border-line py-3">
            <span className="label w-28 shrink-0 pt-0.5">Every Sunday</span>
            <span>The week ahead is released, by email and here.</span>
          </li>
          <li className="flex gap-4 py-3">
            <span className="label w-28 shrink-0 pt-0.5">{formatWeekStart(16)}</span>
            <span>Week 16, the final deload, and your post-programme assessment.</span>
          </li>
        </ul>
        <p className="mt-8">
          <Link
            href="/week/1"
            className="label !text-white inline-block bg-accent px-5 py-3 no-underline"
          >
            Read week 1
          </Link>
        </p>
      </Section>
    </Shell>
  )
}
