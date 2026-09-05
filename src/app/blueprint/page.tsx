import { notFound } from 'next/navigation'
import { Shell } from '@/components/Shell'
import { PageHeader } from '@/components/PageHeader'
import { Section } from '@/components/Section'
import { getMember } from '@/lib/member'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { SUPPORT_EMAIL } from '@/content/assets'
import {
  BLUEPRINT_SLOT,
  isBlueprint,
  PREVIEW_BLUEPRINT,
  type Blueprint,
} from '@/content/blueprint'
import { leadStyle, STYLES } from '@/content/know-thyself'
import { StyleGuide } from '@/components/StyleGuide'

export const metadata = { title: 'Your blueprint · Limitless' }

const TOC = [
  { id: 'territory', label: 'Your territory' },
  { id: 'resistance', label: 'Resistance' },
  { id: 'journey', label: 'Your journey' },
  { id: 'integration', label: 'Integration' },
]

export default async function BlueprintPage() {
  const member = await getMember()
  if (!member) notFound()

  const { blueprint, scores } = await readBlueprint(member.id)

  /*
   * Core gets the half of this that is theirs: their own scorecard and what
   * the four styles mean. The blueprint itself is written from a welcome call
   * they have not had, so none of it reaches their HTML.
   */
  if (member.tier !== 'pro') return <HowYoureWired scores={scores} />

  if (!blueprint) return <NotYet />

  const { territory, resistance, journey, integration } = blueprint

  return (
    <Shell toc={TOC}>
      <PageHeader
        eyebrow="Limitless Pro"
        title="Your blueprint"
        lede="Written from your pre-assessment and your welcome call. It is a read on how you are wired to perform, and where the programme will ask something different of you."
        pills={
          <>
            <span className="tier-tag" data-tier="pro">
              pro
            </span>
            {blueprint.issuedAt ? (
              <span className="pill">
                Issued{' '}
                {new Date(blueprint.issuedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            ) : null}
            <a href="/blueprint/download" className="pill hover:!text-ink">
              Download PDF
            </a>
          </>
        }
      />

      <StyleBand scores={scores} />

      <Section id="territory" label="Mapping your territory">
        <div className="!mb-0 grid gap-5 sm:grid-cols-2">
          <Panel heading="Challenge">
            <p className="!mb-4 text-[1rem] leading-relaxed text-ink">{territory.challenge}</p>
            <Reflection>{territory.challengeReflection}</Reflection>
          </Panel>
          <Panel heading="Direction">
            <ul className="!mb-4 !list-none !pl-0">
              {territory.direction.map((word) => (
                <li key={word} className="!mt-0 flex items-center gap-2.5 py-1 text-[1rem] text-ink">
                  <Arrow />
                  {word}
                </li>
              ))}
            </ul>
            <Reflection>{territory.directionReflection}</Reflection>
          </Panel>
        </div>
      </Section>

      <Section id="resistance" label="Areas of resistance">
        {resistance.rows.map((row) => (
          <div key={row.heading} className="mb-8">
            <p className="label !mb-3">{row.heading}</p>
            <div className="border border-line p-5">
              <p className="!mb-5 text-[1rem] leading-relaxed font-medium text-ink">{row.title}</p>
              <div className="!mb-0 grid gap-5 sm:grid-cols-2">
                <Field label="Watch for">{row.watchFor}</Field>
                <Field label="How it plays out">{row.playsOut}</Field>
              </div>
            </div>
          </div>
        ))}

        <p className="label !mb-3">Mindset shift</p>
        <p className="!mb-0 text-[1rem] leading-relaxed text-ink-72">
          From &ldquo;{resistance.shiftFrom}&rdquo; to{' '}
          <span className="text-ink">&ldquo;{resistance.shiftTo}&rdquo;</span>
        </p>
      </Section>

      <Section id="journey" label="Your journey">
        <ol className="!mb-0 !list-none !pl-0">
          {journey.map((step, i) => (
            <li key={step.stage} className="!mt-0 relative pb-8 pl-11 last:pb-0">
              {i < journey.length - 1 ? (
                <span
                  className="absolute top-8 bottom-0 left-[0.6875rem] w-px bg-accent"
                  aria-hidden
                />
              ) : null}
              <span className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[0.75rem] font-semibold text-white">
                {i + 1}
              </span>
              <p className="!mt-0 !mb-4 text-[1.0625rem] font-medium text-ink">
                {step.stage}: {step.title}
              </p>
              <div className="grid gap-5 border border-line p-5 sm:grid-cols-2">
                <Field label="Personal relevance">{step.relevance}</Field>
                <Field label="Key outcomes">{step.outcomes}</Field>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="integration" label="Success integration">
        <p className="label !mb-3">Your advantage points</p>
        <div className="!mb-8 grid gap-5 sm:grid-cols-2">
          <Panel heading="Leverage these strengths">
            <Bullets items={integration.strengths} />
          </Panel>
          <Panel heading="Growth opportunities">
            <Bullets items={integration.opportunities} />
          </Panel>
        </div>

        <p className="label !mb-3">Integration reflection</p>
        <p className="!mb-0 text-[1rem] leading-relaxed text-ink-72">{integration.reflection}</p>
      </Section>
    </Shell>
  )
}

/**
 * The member's own blueprint, or null.
 *
 * With no Supabase configured the app runs in preview mode against a stub
 * member, so a sample is returned rather than nothing: the point of preview
 * mode is being able to look at the interface before the data exists.
 */
async function readBlueprint(
  memberId: string,
): Promise<{ blueprint: Blueprint | null; scores: Record<string, number> }> {
  if (!supabaseConfigured) {
    return {
      blueprint: PREVIEW_BLUEPRINT,
      scores: { Dynamo: 78, Energiser: 71, Caretaker: 64, Analyst: 55 },
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('assessment')
    .eq('id', memberId)
    .single()

  /*
   * Both halves come out of the same column. The style scores are the
   * scorecard's own, so a retaken scorecard shows here without the blueprint
   * being republished.
   */
  const assessment = data?.assessment as {
    scorecard?: { scores?: Record<string, number> }
    blueprint?: unknown
  } | null
  const held = assessment?.[BLUEPRINT_SLOT]
  return {
    blueprint: isBlueprint(held) ? held : null,
    scores: assessment?.scorecard?.scores ?? {},
  }
}

/** Pro, but nothing written for them yet. Says so rather than 404ing. */
function NotYet() {
  return (
    <Shell>
      <PageHeader
        eyebrow="Limitless Pro"
        title="Your blueprint"
        lede="Yours is written after your welcome call, from that conversation and your pre-assessment."
        pills={
          <span className="tier-tag" data-tier="pro">
            pro
          </span>
        }
      />
      <Section label="Not here yet">
        <p>
          It lands on this page as soon as it is ready, and you will hear from Chris when it does.
          If you have had your welcome call and this still looks empty, email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </Section>
    </Shell>
  )
}

/**
 * The four Know Thyself scores, highest first.
 *
 * Not decoration: it is the same read the blueprint is written from, in the
 * same icons the journal prints, so the two say the same thing. Left out
 * entirely for anybody who has not taken the scorecard.
 */
function StyleBand({ scores }: { scores: Record<string, number> }) {
  const ranked = STYLES.map((style) => ({ style, score: scores[style.name] }))
    .filter((row): row is { style: (typeof STYLES)[number]; score: number } =>
      Number.isFinite(row.score),
    )
    .sort((a, b) => b.score - a.score)

  if (!ranked.length) return null

  return (
    <div className="border-b border-line px-6 py-8 sm:px-10">
      <p className="label mb-5">How you&rsquo;re wired</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
        {ranked.map(({ style, score }, i) => (
          <div key={style.key} className="flex items-center gap-3">
            <img
              src={style.icon}
              alt=""
              width={32}
              height={32}
              className={`h-8 w-8 shrink-0 object-contain ${i ? 'opacity-30' : ''}`}
            />
            <div>
              <dd
                className={`text-[1.375rem] leading-none font-medium ${i ? 'text-ink' : ''}`}
                style={i ? undefined : { color: 'var(--color-accent-ink)' }}
              >
                {Math.round(score)}
              </dd>
              <dt className="label mt-1">{style.name}</dt>
            </div>
          </div>
        ))}
      </dl>

      {/*
        * The scores say where you sit. This says what sitting there costs, which
        * is the part worth reading once rather than every time, so it is shut
        * until asked for.
        */}
      <details className="mt-7">
        <summary className="label cursor-pointer hover:!text-ink">
          What each style involves
        </summary>
        <StyleGuide className="mt-5" scores={scores} lead={ranked[0]?.style.name} />
      </details>
    </div>
  )
}

function Panel({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="border border-line p-5">
      <p className="label !mb-3">{heading}</p>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="!mb-1.5 text-[0.8125rem] font-semibold text-ink">{label}</p>
      <p className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">{children}</p>
    </div>
  )
}

function Reflection({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-line pt-3">
      <p className="!mb-1.5 text-[0.8125rem] font-semibold text-ink">Reflection</p>
      <p className="!mb-0 text-[0.9375rem] leading-relaxed text-ink-72">{children}</p>
    </div>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="!mb-0 !list-none !pl-0">
      {items.map((item) => (
        <li
          key={item}
          className="!mt-0 flex gap-2.5 py-1.5 text-[0.9375rem] leading-relaxed text-ink-72"
        >
          <Arrow className="mt-1.5 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--color-accent-ink)' }}
      aria-hidden
    >
      <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" />
    </svg>
  )
}

/**
 * What Core gets in place of the blueprint: their own scorecard, and what the
 * four styles actually mean.
 *
 * The blueprint proper is written out of a welcome call, so there is nothing
 * honest to show somebody who has not had one. The scorecard is theirs either
 * way, and on its own it is only four numbers, so the reading of the styles is
 * the part that makes it worth a page.
 */
function HowYoureWired({ scores }: { scores: Record<string, number> }) {
  const lead = leadStyle(scores)

  return (
    <Shell>
      <PageHeader
        eyebrow="Limitless Core"
        title="How you&rsquo;re wired"
        lede={
          lead
            ? `Your Know Thyself scorecard, and what each style means in practice. You lead with ${lead.name}.`
            : 'Your Know Thyself scorecard, and what each style means in practice.'
        }
        pills={
          <span className="tier-tag" data-tier="core">
            core
          </span>
        }
      />

      {lead ? (
        <>
          <StyleBand scores={scores} />
          <Section label="What this is for">
            <p className="!mb-0">
              None of these is better than the others, and nobody is only one of them. The useful
              part is knowing which way you lean by default, so you can tell the difference between
              a situation that suits you and one that is asking you to work against the grain.
            </p>
          </Section>
        </>
      ) : (
        <Section label="Not here yet">
          <p>
            This fills in from your Know Thyself scorecard. If you have completed it and this still
            looks empty, it may have been answered from a different email address. Email{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and it will be put right.
          </p>
          <div className="mt-8">
            <p className="label !mb-5">The four styles</p>
            <StyleGuide />
          </div>
        </Section>
      )}
    </Shell>
  )
}
