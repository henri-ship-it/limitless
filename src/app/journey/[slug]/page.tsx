import { notFound } from 'next/navigation'

import { Journey } from './Journey'
import { journeyFor, JOURNEYS } from '@/content/journey'
import { WELCOME_CALL, tierInfo } from '@/content/programme'
import { getMember } from '@/lib/member'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

/**
 * The baseline and the reflection.
 *
 * Not under `/assessment`, which is the printed-QR namespace and is public
 * because a journal in somebody's hands cannot be reissued. These two are
 * handed out from inside the programme, so they sit behind the sign-in like
 * the rest of it. That has a second benefit: the member is already known, so
 * nobody is asked for their address and nothing can be filed against the
 * wrong one.
 */
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return JOURNEYS.map((journey) => ({ slug: journey.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const journey = journeyFor(slug)
  return { title: journey ? `${journey.title} · Limitless` : 'Not found' }
}

/**
 * The member's baseline scores, for the reflection to measure against.
 *
 * Returns null when there is none, and the reflection then shows where
 * somebody is rather than inventing a climb from zero. Members who joined
 * before this existed will not have one, which is the normal case for the
 * first cohort through it.
 */
async function baselineScores(memberId: string): Promise<Record<string, number> | null> {
  if (!supabaseConfigured) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('assessment')
      .eq('id', memberId)
      .maybeSingle()
    const filed = (data?.assessment as Record<string, unknown> | null)?.baseline as
      | { scores?: Record<string, number> }
      | undefined
    const scores = filed?.scores
    return scores && Object.keys(scores).length ? scores : null
  } catch {
    return null
  }
}

/** Where the example member started, so the example reflection has a distance. */
const EXAMPLE_BASELINE: Record<string, number> = {
  Performance: 50,
  Clarity: 33,
  Energy: 50,
  Resilience: 33,
  Alignment: 17,
  Fulfilment: 50,
}

export default async function JourneyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const journey = journeyFor(slug)
  if (!journey) notFound()

  const member = await getMember()
  const info = tierInfo(member?.tier ?? 'core')

  /*
   * `?preview` opens on a finished result built from made-up answers, so the
   * page can be looked at without sitting it. Nothing is scored or saved.
   */
  const asked = (await searchParams).preview
  const value = Array.isArray(asked) ? asked[0] : asked
  /* `?preview=walk` runs the flow from the start; any other value opens on a
     finished example result. */
  const preview: 'no' | 'result' | 'walk' =
    value === undefined ? 'no' : value === 'walk' ? 'walk' : 'result'

  return (
    <Journey
      spec={journey}
      firstName={member?.firstName ?? null}
      /*
       * Pro and Elite finish on booking the welcome call. Core and Elevate are
       * worked through alone and are sent to chapter one instead; showing them
       * a link to Chris's calendar would be offering something they have not
       * bought. In preview, Pro's ending is shown, because that is the one
       * worth checking.
       */
      welcomeCall={info.welcomeCall || preview !== 'no' ? WELCOME_CALL : null}
      /*
       * The reflection measures against the member's own baseline. The
       * example needs one too, or the page it shows is the one somebody
       * without a baseline gets, which is not the page worth reviewing.
       */
      previous={
        journey.slug !== 'reflection'
          ? null
          : preview !== 'no'
            ? EXAMPLE_BASELINE
            : member
              ? await baselineScores(member.id)
              : null
      }
      preview={preview}
    />
  )
}
