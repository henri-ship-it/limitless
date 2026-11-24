import { NextResponse } from 'next/server'

import { assessmentFor, scoreAssessment } from '@/content/assessments'
import { fileAssessment } from '@/lib/scorecard'

/**
 * Receives a sitting of an assessment taken on the platform.
 *
 * The scoring happens here rather than in the browser so a result cannot be
 * posted with scores somebody chose themselves: the answers come in, the
 * percentages go out. Filing goes through the same function the ScoreApp
 * webhook uses, so a result taken here is indistinguishable on a profile from
 * one that arrived while ScoreApp was still running.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const assessment = assessmentFor(slug)
  if (!assessment) return NextResponse.json({ error: 'Unknown assessment' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected JSON' }, { status: 400 })
  }

  const { email, answers } = (body ?? {}) as {
    email?: unknown
    answers?: unknown
  }

  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'A valid email address is needed' }, { status: 400 })
  }

  if (!answers || typeof answers !== 'object') {
    return NextResponse.json({ error: 'No answers' }, { status: 400 })
  }

  /*
   * Only positions on the scale are accepted, and only for questions that
   * exist. Anything else is dropped rather than refused: a half-finished
   * sitting is still worth filing, and scoreAssessment leaves gaps out of the
   * average instead of counting them as nought.
   */
  const clean: Record<number, number> = {}
  for (const [key, value] of Object.entries(answers as Record<string, unknown>)) {
    const index = Number(key)
    const answer = Number(value)
    if (!Number.isInteger(index)) continue
    if (index < 0 || index >= assessment.questions.length) continue
    if (!Number.isFinite(answer) || answer < 0 || answer > 100) continue
    clean[index] = answer
  }

  if (!Object.keys(clean).length) {
    return NextResponse.json({ error: 'No usable answers' }, { status: 400 })
  }

  const scores = scoreAssessment(assessment, clean)

  const outcome = await fileAssessment(email.trim().toLowerCase(), assessment.slot, {
    scores,
    notes: {},
  })

  if (!outcome.ok && outcome.status === 500) {
    return NextResponse.json({ error: outcome.reason }, { status: 500 })
  }

  /*
   * Someone who is not a member still sees their result. The scores are
   * computed either way; all that differs is whether there was a profile to
   * write them to, which is the sender's problem rather than the reader's.
   */
  return NextResponse.json({
    status: outcome.ok ? 'stored' : outcome.reason,
    scores,
    answered: Object.keys(clean).length,
    of: assessment.questions.length,
  })
}
