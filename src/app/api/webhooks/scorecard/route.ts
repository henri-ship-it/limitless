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
 * Post JSON with an email and whatever scores came out. Shapes vary between
 * senders, so the reader is lenient: any number alongside a name is taken as a
 * score, and the email is found wherever it is.
 *
 *   curl -X POST https://limitless.lmntaryperformance.com/api/webhooks/scorecard \
 *     -H "x-limitless-secret: ..." -H "content-type: application/json" \
 *     -d '{"email":"someone@example.com","Dynamo":72,"Analyst":41}'
 */

/**
 * Flattens whatever shape arrived into one level of name and value.
 *
 * Senders nest differently and there is no point guessing which wrapper names
 * they will use, so anything object shaped is opened up. Arrays of scored items
 * are read as name and value pairs, which is how most quiz tools express them.
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
    if (value && typeof value === 'object') {
      Object.assign(flat, unwrap(value, depth + 1))
    } else {
      flat[key] = value
    }
  }
  return flat
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

export async function POST(request: Request) {
  const secret = process.env.SCORECARD_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }
  if (request.headers.get('x-limitless-secret') !== secret) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Expected JSON' }, { status: 400 })
  }

  const flat = unwrap(body)
  const email = findEmail(flat)
  if (!email) {
    return NextResponse.json(
      { error: 'No email in the payload', sawKeys: Object.keys(flat).slice(0, 20) },
      { status: 400 },
    )
  }

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
    // Answered with a different address than they enrolled with. Worth a 200 so
    // the sender does not retry forever, and worth saying so in the body.
    return NextResponse.json({ status: 'no matching member', email }, { status: 200 })
  }

  const assessment = {
    ...((profile.assessment as Record<string, unknown>) ?? {}),
    scorecard: { scores, notes, receivedAt: new Date().toISOString() },
  }

  const { error } = await supabase.from('profiles').update({ assessment }).eq('id', profile.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ status: 'stored', email, scores: Object.keys(scores).length })
}
