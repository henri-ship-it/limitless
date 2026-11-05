import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fileCall } from '@/lib/pocket'

/**
 * Takes the Wednesday group call off the recorder and files it per member.
 *
 * Pocket records the call, transcribes it with speaker labels, and posts the
 * whole thing here when it has finished. One recording becomes one row per
 * member who was on it: each gets the full conversation as their transcript,
 * because what Chris said to somebody else is usually the context for what he
 * said to them, and a distillation written about them alone.
 *
 * From there it is the same road as a 1:1. The notes land on the member's
 * profile and the drafting brief reads them, so a message can remember
 * something said out loud on a Wednesday, which is the one place members say
 * things they never write down.
 *
 * Runs with the service key and no session, because the caller is a machine
 * with a shared secret rather than a signed-in admin. The signature is the only
 * thing standing between this and anybody who finds the URL, so it is checked
 * before the body is parsed and before anything touches the database.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'

/** Pocket retries for thirty seconds. Older than this is a replay, not a retry. */
const MAX_AGE_MS = 10 * 60 * 1000

/**
 * The event carrying a transcript.
 *
 * `transcription.completed` fires earlier but Pocket documents the full body
 * only for this one, and speaker names are settled by the time it arrives.
 * Taking both would file the same call twice, which the unique index would
 * catch, but there is no reason to make it work for a living.
 */
const WANTED = 'summary.completed'

type Segment = { speaker?: string; speakerName?: string; text?: string }

type Payload = {
  event?: string
  recording?: { id?: string; title?: string; recordingAt?: string; createdAt?: string }
  transcript?: Segment[]
  speakers?: Record<string, { name?: string }>
}

export async function POST(request: Request) {
  const secret = process.env.POCKET_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }

  const raw = await request.text()
  const signature = request.headers.get('x-heypocket-signature') ?? ''
  const timestamp = request.headers.get('x-heypocket-timestamp') ?? ''

  /*
   * Signed over "{timestamp}.{body}" rather than the body alone, which is what
   * stops a captured request being replayed at us for ever.
   */
  const expected = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
  const given = signature.replace(/^sha256=/, '')

  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(given, 'utf8')
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  }

  const age = Date.now() - Number(timestamp)
  if (!Number.isFinite(age) || age > MAX_AGE_MS || age < -MAX_AGE_MS) {
    return NextResponse.json({ error: 'Stale' }, { status: 401 })
  }

  const body = JSON.parse(raw) as Payload

  // Anything else is acknowledged and dropped, so Pocket stops retrying it.
  if (body.event !== WANTED) {
    return NextResponse.json({ ok: true, ignored: body.event ?? 'unknown' })
  }

  const recordingId = body.recording?.id
  const segments = body.transcript ?? []
  if (!recordingId || !segments.length) {
    return NextResponse.json({ ok: true, ignored: 'nothing to file' })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  const key = process.env.ANTHROPIC_API_KEY
  if (!url || !service) {
    return NextResponse.json({ error: 'No database' }, { status: 503 })
  }

  const supabase = createClient(url, service, { auth: { persistSession: false } })

  const { filed, unmatched } = await fileCall(supabase, {
    recordingId,
    segments,
    speakers: body.speakers,
    happenedOn:
      (body.recording?.recordingAt ?? body.recording?.createdAt ?? '').slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    anthropicKey: key,
    model: MODEL,
  })

  /*
   * Reported rather than silently dropped. A speaker nobody matched is usually
   * a member whose Pocket label is not their first name, and the fix is to put
   * it in recording_name. Without this the call just quietly misses them.
   */
  return NextResponse.json({ ok: true, recordingId, filed, unmatched })
}

/**
 * Whether this deployment can accept a call, and if not, why.
 *
 * The same shape as the scorecard webhook's: a boolean and a length, never a
 * value, because a typo in a secret looks exactly like a correct one from here.
 */
export function GET() {
  const secret = process.env.POCKET_WEBHOOK_SECRET ?? ''
  return NextResponse.json({
    configured: Boolean(secret),
    secretLength: secret.length,
    pollingConfigured: Boolean(process.env.POCKET_API_KEY),
    distillingConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    databaseConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    expects: WANTED,
    environment: process.env.VERCEL_ENV ?? 'not on Vercel',
  })
}
