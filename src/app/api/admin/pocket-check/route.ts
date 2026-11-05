import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { pullRecentCalls } from '@/lib/pocket'
import { requireAdmin } from '@/lib/admin'
import type { Segment, Speakers } from '@/lib/pocket'
import { MIN_MEMBERS, onCallDay, titlePatterns, worthReading } from '@/lib/pocket'

/**
 * Whether the Pocket key works, asked without changing anything.
 *
 * The daily job is the only other thing that calls Pocket, and it runs once a
 * day behind a cron secret. So a key that is present but wrong, or an endpoint
 * that has moved, would look exactly like a quiet week with no recordings: no
 * error anybody sees, and a call that never arrives. This asks Pocket the same
 * question the poller asks and reports what came back.
 *
 * Read only on purpose. It lists, it counts, and it files nothing, so it can be
 * run as often as you like while setting the key up.
 */

const API = 'https://public.heypocketai.com/api/v1/public'

export const dynamic = 'force-dynamic'

type Listed = { id?: string; recording_at?: string; created_at?: string; title?: string }

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const apiKey = process.env.POCKET_API_KEY
  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      reason: 'No POCKET_API_KEY is set on this deployment.',
    })
  }

  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)

  let listing: Response
  try {
    listing = await fetch(`${API}/recordings?start_date=${from}&limit=50`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    })
  } catch (problem) {
    return NextResponse.json({
      ok: false,
      reason: 'Could not reach Pocket at all.',
      detail: problem instanceof Error ? problem.message : String(problem),
    })
  }

  /*
   * The body is reported on a failure because the status alone does not
   * separate a wrong key from a moved endpoint, and those need different
   * fixes. Truncated, because a 404 from a CDN is an entire HTML page.
   */
  if (!listing.ok) {
    const body = await listing.text().catch(() => '')
    return NextResponse.json({
      ok: false,
      status: listing.status,
      reason:
        listing.status === 401 || listing.status === 403
          ? 'Pocket refused the key. Check it was copied whole, and that it has not been regenerated since.'
          : listing.status === 404
            ? 'Pocket does not recognise that endpoint. The API may have moved.'
            : 'Pocket returned an error.',
      detail: body.slice(0, 300),
    })
  }

  const payload = (await listing.json().catch(() => ({}))) as {
    data?: Listed[]
    recordings?: Listed[]
  }
  const recordings = payload.data ?? payload.recordings ?? []

  /*
   * The shape matters as much as the status. The poller reads `data` or
   * `recordings` and then an `id` on each row, so a two hundred carrying
   * neither would still file nothing, and saying so here is the whole point.
   */
  const shapeUnderstood = Array.isArray(payload.data) || Array.isArray(payload.recordings)

  /*
   * Listed with the verdict against each one, because the filter is the part
   * most worth seeing. Everything on the recorder shows up here, including the
   * calls that are none of the platform's business, and each says plainly
   * whether it would be filed. A private call marked `filed: true` is the one
   * thing on this page that needs acting on immediately.
   */
  const patterns = titlePatterns()
  const seen = recordings.map((r) => {
    const on = (r.recording_at ?? r.created_at ?? '').slice(0, 10)
    return {
      on,
      title: r.title ?? '(no title)',
      wouldOpen: worthReading({ title: r.title, happenedOn: on }, patterns),
    }
  })
  const wanted = seen.filter((r) => r.wouldOpen).length

  return NextResponse.json({
    ok: true,
    status: listing.status,
    since: from,
    recordings: recordings.length,
    shapeUnderstood,
    withIds: recordings.filter((r) => r.id).length,
    filesCallsOn: 'Wednesday',
    alsoOpensTitlesContaining: patterns,
    membersNeededOnIt: MIN_MEMBERS,
    wouldOpen: wanted,
    wouldSkip: seen.length - wanted,
    seen,
    note: !shapeUnderstood
      ? 'Pocket answered, but not in a shape this reads. The listing field may have been renamed.'
      : !recordings.length
        ? 'The key works, but Pocket has no recordings in the last thirty days.'
        : wanted
          ? `The key works. Only the Wednesday recordings above are opened, and one is filed only if at least ${MIN_MEMBERS} members are heard on it.`
          : 'The key works, but none of these happened on a Wednesday, so none would be opened. If the call moved, set POCKET_TITLE_MATCH to a phrase from its title.',
  })
}

/**
 * Runs the pull now instead of waiting for tonight.
 *
 * Exactly what the daily cron does, through the same function, with the same
 * two gates: Wednesday off the listing, and at least two members heard before
 * anything is stored. Nothing is special-cased for being triggered by hand,
 * because a button that files calls differently from the job that normally
 * files them is a button that proves nothing.
 *
 * Safe to press twice. A recording already on a member's record is skipped
 * before the reading is made, so a second press costs a listing and nothing
 * else.
 *
 * It is here rather than on a member's page because a call is not a member's:
 * one recording lands on everyone who was heard on it.
 */
export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const apiKey = process.env.POCKET_API_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!apiKey) return NextResponse.json({ error: 'No Pocket API key is set.' }, { status: 503 })
  if (!url || !service) return NextResponse.json({ error: 'No database.' }, { status: 503 })

  /*
   * The service key, because this writes a row for every member heard on the
   * call and an admin's own session cannot write to somebody else's record.
   * The gate is requireAdmin above.
   */
  const supabase = createServiceClient(url, service, { auth: { persistSession: false } })

  const pulled = await pullRecentCalls(supabase, {
    apiKey,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL ?? 'claude-opus-5',
  })

  /*
   * Reported per recording, including the ones that were opened and then left
   * alone. A call dropped for having too few members on it is the failure
   * worth seeing: it usually means Pocket labelled somebody by a name that is
   * not on their profile, and the fix is recording_name rather than anything
   * here.
   */
  return NextResponse.json({
    ok: true,
    checked: pulled.checked,
    skippedWithoutOpening: pulled.skipped ?? 0,
    error: pulled.error,
    results: pulled.results.map((r) => ({
      recordingId: r.recordingId,
      filed: r.filed,
      unmatched: r.unmatched,
      ignored: r.ignored,
      problems: r.problems,
    })),
    note: pulled.results.some((r) => r.problems?.length)
      ? 'The call was read but the database refused to store it. The reason is below.'
      : pulled.error
      ? 'Pocket would not answer.'
      : pulled.results.some((r) => r.filed.length)
        ? 'Filed. Open the members named below and look at their Calls tab.'
        : pulled.results.length
          ? 'A recording was opened but nothing was filed. See ignored and unmatched below: a name Pocket used that is not on a profile goes in that member\'s recording_name.'
          : 'Nothing was opened. Nothing on the recorder happened on a Wednesday within the last month.',
  })
}

/**
 * What Pocket actually says about who was speaking.
 *
 * The first real pull filed nothing and reported one name, Chris, which either
 * means the room was silent or means Pocket names the person holding the
 * recorder and nobody else. Those need completely different answers, and the
 * difference is not something to infer from an empty result.
 *
 * So this opens the most recent call and reports the speaker labels verbatim:
 * how many distinct ones, what they are called, and how many lines each said.
 * No transcript text, because who spoke is the question and the content of a
 * call is not something to print into a debugging endpoint. Nothing is stored.
 */
export async function PUT() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const apiKey = process.env.POCKET_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No Pocket API key is set.' }, { status: 503 })

  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10)
  const listing = await fetch(`${API}/recordings?start_date=${from}&limit=50`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  })
  if (!listing.ok) {
    return NextResponse.json({ error: `Pocket would not list recordings (${listing.status}).` })
  }

  const payload = (await listing.json().catch(() => ({}))) as {
    data?: Listed[]
    recordings?: Listed[]
  }
  const all = payload.data ?? payload.recordings ?? []

  const call = all.find((r) =>
    onCallDay((r.recording_at ?? r.created_at ?? '').slice(0, 10)),
  )
  if (!call?.id) {
    return NextResponse.json({ ok: true, note: 'No recording on a Wednesday in the last month.' })
  }

  const detail = await fetch(`${API}/recordings/${call.id}?include_transcript=true`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  })
  if (!detail.ok) {
    return NextResponse.json({ error: `Pocket would not open it (${detail.status}).` })
  }

  const body = (await detail.json().catch(() => ({}))) as {
    data?: { transcript?: { segments?: Segment[] }; speakers?: Speakers }
    transcript?: { segments?: Segment[] }
    speakers?: Speakers
  }
  const inner = body.data ?? body
  const segments = inner.transcript?.segments ?? []

  /*
   * Counted by the raw label rather than the resolved name, so a speaker Pocket
   * knows only as an id still shows up here as that id. The whole point is to
   * see what is there, including the parts the normal path throws away.
   */
  const lines = new Map<string, number>()
  for (const segment of segments) {
    const label =
      segment.speakerName ??
      (segment.speaker ? (inner.speakers?.[segment.speaker]?.name ?? segment.speaker) : null) ??
      '(no label at all)'
    lines.set(label, (lines.get(label) ?? 0) + 1)
  }

  const spoke = [...lines.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, lines: count }))

  return NextResponse.json({
    ok: true,
    recording: { on: (call.recording_at ?? call.created_at ?? '').slice(0, 10), title: call.title },
    segments: segments.length,
    distinctSpeakers: spoke.length,
    spoke,
    speakersBlock: inner.speakers ?? null,
    note:
      spoke.length <= 1
        ? 'Pocket is not separating the people on this call. Matching members to what they said is not possible from this, however the names are configured.'
        : 'Pocket is separating speakers. Any label below that is a member needs to be that member\'s recording name.',
  })
}
