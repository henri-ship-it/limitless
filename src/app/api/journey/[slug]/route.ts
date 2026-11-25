import { NextResponse } from 'next/server'

import { journeyFor, questionsOf, spineScores, type Question } from '@/content/journey'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

/**
 * Receives a finished baseline or reflection.
 *
 * The member comes from their session rather than from the request, so a run
 * cannot be filed against anybody else's profile. That is the whole reason
 * these two sit behind the sign-in while the printed assessments do not.
 *
 * Answers are validated against the journey's own questions and anything that
 * is not one is dropped. The six scale answers are turned into scores here
 * rather than in the browser, so a result cannot be posted with numbers
 * somebody picked for themselves.
 */

/** The most we will store from one open answer. Long, but not unbounded. */
const TEXT_LIMIT = 4000

function clean(question: Question, value: unknown): number | string | string[] | undefined {
  if (question.kind === 'scale' || question.kind === 'score') {
    const number = Number(value)
    if (!Number.isFinite(number)) return undefined
    const top = question.kind === 'score' ? 10 : 100
    if (number < 0 || number > top) return undefined
    return Math.round(number)
  }

  if (question.kind === 'text') {
    if (typeof value !== 'string') return undefined
    const text = value.trim().slice(0, TEXT_LIMIT)
    return text || undefined
  }

  if (question.kind === 'choice') {
    return typeof value === 'string' && question.options.includes(value) ? value : undefined
  }

  // multi and rank: known options only, no duplicates, no more than the limit.
  if (!Array.isArray(value)) return undefined
  const picked = value
    .filter((item): item is string => typeof item === 'string' && question.options.includes(item))
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, question.limit)
  return picked.length ? picked : undefined
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const journey = journeyFor(slug)
  if (!journey) return NextResponse.json({ error: 'Unknown journey' }, { status: 404 })

  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected JSON' }, { status: 400 })
  }

  const given = (body as { answers?: unknown } | null)?.answers
  if (!given || typeof given !== 'object') {
    return NextResponse.json({ error: 'No answers' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  const source = given as Record<string, unknown>
  const answers: Record<string, number | string | string[]> = {}
  for (const question of questionsOf(journey)) {
    const value = clean(question, source[question.id])
    if (value !== undefined) answers[question.id] = value
  }

  if (!Object.keys(answers).length) {
    return NextResponse.json({ error: 'No usable answers' }, { status: 400 })
  }

  const scores = spineScores(answers)

  /*
   * Read, merge, write. The assessment column holds every slot a member has,
   * Know Thyself and Light The Fire included, so replacing it wholesale would
   * throw their behavioural style away.
   */
  const { data: profile } = await supabase
    .from('profiles')
    .select('assessment')
    .eq('id', user.id)
    .maybeSingle()

  const held = (profile?.assessment ?? {}) as Record<string, unknown>

  const { error } = await supabase
    .from('profiles')
    .update({
      assessment: {
        ...held,
        [journey.slot]: {
          scores,
          answers,
          takenAt: new Date().toISOString(),
        },
      },
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'That did not save' }, { status: 500 })
  }

  return NextResponse.json({ status: 'stored', scores })
}
