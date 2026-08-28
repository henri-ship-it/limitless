import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Receives a completed scorecard and files it against the member.
 *
 * Built as a webhook rather than as a client of ScoreApp's API on purpose:
 * whatever is sending, ScoreApp directly or Zapier in between, points at this
 * one endpoint. Nothing here needs ScoreApp credentials, and results arrive as
 * they are completed rather than on a poll.
 *
 * Two slots, one per scorecard, so the behavioural style and the survey sit
 * side by side on a profile rather than overwriting each other. The Core and
 * Pro pre-assessments are separate scorecards in ScoreApp but the same slot
 * here: the tier is already known from the member's own record.
 */

export const SLOTS = {
  'know-thyself': 'scorecard',
  'pre-assessment': 'preAssessment',
} as const

export type SlotName = keyof typeof SLOTS

type Filed = {
  scores: Record<string, number>
  notes: Record<string, string>
}

/**
 * ScoreApp's own shape, which is worth reading properly rather than guessing at.
 *
 *   { event_name, data: { email, total_score: { percent },
 *     category_scores: [{ percent, category: { title } }],
 *     quiz_questions: [{ question, answers: [{ answer }] }] } }
 */
type ScoreApp = {
  event_name?: string
  data?: {
    email?: string | null
    total_score?: { percent?: number | string } | null
    category_scores?: { percent?: number | string; category?: { title?: string } }[] | null
    quiz_questions?: { question?: string; answers?: { answer?: string }[] }[] | null
  }
}

function looksLikeScoreApp(body: unknown): body is ScoreApp {
  if (!body || typeof body !== 'object') return false
  const data = (body as ScoreApp).data
  return Boolean(data && typeof data === 'object')
}

/**
 * The two scorecards want different halves of the payload.
 *
 * Know Thyself is the four style scores and nothing else - its questions are
 * the mechanism, not the answer, and thirty of them on a profile is noise. The
 * pre-assessment is the other way round: what somebody wrote is the point.
 */
function readScoreApp(body: ScoreApp, slot: string): Filed {
  const scores: Record<string, number> = {}
  const notes: Record<string, string> = {}
  const data = body.data ?? {}

  for (const row of data.category_scores ?? []) {
    const title = row?.category?.title
    const percent = Number(row?.percent)
    if (title && Number.isFinite(percent)) scores[title] = percent
  }

  if (slot !== 'scorecard') {
    for (const row of data.quiz_questions ?? []) {
      const question = row?.question
      const answer = (row?.answers ?? [])
        .map((a) => a?.answer)
        .filter((a): a is string => Boolean(a && a.trim()))
        .join(', ')
      if (question && answer) notes[question] = answer
    }

    const overall = Number(data.total_score?.percent)
    if (Number.isFinite(overall) && Object.keys(scores).length) scores.Overall = overall
  }

  return { scores, notes }
}

/**
 * Flattens whatever else arrived into one level of name and value.
 *
 * Anything not coming straight from ScoreApp - a Zapier step, a test post -
 * gets read leniently: any number alongside a name is taken as a score, any
 * sentence as an answer.
 */
function unwrap(body: unknown, depth = 0): Record<string, unknown> {
  const flat: Record<string, unknown> = {}
  if (depth > 4 || !body || typeof body !== 'object') return flat

  if (Array.isArray(body)) {
    for (const item of body) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const name = row.name ?? row.label ?? row.title ?? row.category
      const value = row.score ?? row.value ?? row.result
      if (typeof name === 'string' && value !== undefined) flat[name] = value
      else Object.assign(flat, unwrap(item, depth + 1))
    }
    return flat
  }

  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value && typeof value === 'object') Object.assign(flat, unwrap(value, depth + 1))
    else flat[key] = value
  }
  return flat
}

function readLoosely(flat: Record<string, unknown>): Filed {
  const scores: Record<string, number> = {}
  const notes: Record<string, string> = {}

  for (const [key, value] of Object.entries(flat)) {
    if (/email/i.test(key)) continue
    const asNumber = typeof value === 'number' ? value : Number(value)
    if (typeof value !== 'boolean' && value !== '' && value !== null && Number.isFinite(asNumber)) {
      scores[key] = asNumber
    } else if (typeof value === 'string' && value.trim()) {
      notes[key] = value.trim()
    }
  }

  return { scores, notes }
}

function findEmail(flat: Record<string, unknown>): string | null {
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== 'string') continue
    if (/email/i.test(key) && value.includes('@')) return value.trim().toLowerCase()
  }
  // Some senders put the address in a field named for the person, not the field.
  for (const value of Object.values(flat)) {
    if (typeof value === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim())) {
      return value.trim().toLowerCase()
    }
  }
  return null
}

function sameSecret(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/**
 * ScoreApp signs the body with the secret key and sends it as Scoreapp-Signature.
 *
 * Their own example hashes a re-serialised body, which is not always byte for
 * byte what arrived, so both the raw text and a re-serialised copy are checked.
 * A plain shared-secret header is accepted too, for Zapier or a manual test.
 */
function authorised(request: Request, raw: string, secret: string): boolean {
  const plain = request.headers.get('x-limitless-secret')
  if (plain && sameSecret(plain, secret)) return true

  const signature = request.headers.get('scoreapp-signature')
  if (!signature) return false

  const candidates = [raw]
  try {
    candidates.push(JSON.stringify(JSON.parse(raw)))
  } catch {
    // Not JSON, so the raw text is all there is to check.
  }

  return candidates.some((body) =>
    sameSecret(signature, createHmac('sha256', secret).update(body).digest('hex')),
  )
}

export async function receiveScorecard(request: Request, asked: string) {
  const slot = SLOTS[asked as SlotName]
  if (!slot) {
    return NextResponse.json(
      { error: 'Unknown type', expected: Object.keys(SLOTS) },
      { status: 400 },
    )
  }

  const secret = process.env.SCORECARD_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const raw = await request.text()
  if (!authorised(request, raw, secret)) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Expected JSON' }, { status: 400 })
  }

  const flat = unwrap(body)
  const email = findEmail(flat)
  const filed = looksLikeScoreApp(body) ? readScoreApp(body, slot) : readLoosely(flat)

  if (!email) {
    // Quiz-started events fire before anyone has given an address. Nothing to
    // do, but a 200 so ScoreApp does not log it as a failing endpoint.
    return NextResponse.json({ status: 'no email yet', event: (body as ScoreApp).event_name })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, assessment')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    // Answered with a different address than they enrolled with, or a lead who
    // is not on the programme at all. Worth a 200 so the sender stops retrying.
    return NextResponse.json({ status: 'no matching member', email })
  }

  const existing = (profile.assessment as Record<string, Filed & { receivedAt?: string }>) ?? {}
  const held = existing[slot]

  /*
   * Several events can fire for one sitting, and the later ones carry the
   * email but not always the answers. Keep what is already there unless this
   * payload actually has something to put in its place.
   */
  const scores = Object.keys(filed.scores).length ? filed.scores : (held?.scores ?? {})
  const notes = Object.keys(filed.notes).length ? filed.notes : (held?.notes ?? {})

  const assessment = {
    ...existing,
    [slot]: { scores, notes, receivedAt: new Date().toISOString() },
  }

  const { error } = await supabase.from('profiles').update({ assessment }).eq('id', profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    status: 'stored',
    type: asked,
    event: (body as ScoreApp).event_name,
    email,
    scores: Object.keys(scores).length,
    notes: Object.keys(notes).length,
  })
}
