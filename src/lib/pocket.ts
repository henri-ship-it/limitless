import { distil } from '@/lib/distil'
import { matchSpeaker } from '@/lib/speakers'

/**
 * Getting the Wednesday call off Pocket and onto the members who were on it.
 *
 * Two ways in, because they fail differently. The webhook is a push and arrives
 * within a minute of the recording finishing, which is what you want. The
 * poller is a pull and finds anything the push missed, which happens: webhooks
 * are at-least-once, which also means at-most-never when a deploy is mid-flight
 * or the signature is misconfigured. The second costs one request a day and
 * means a call is never silently lost.
 *
 * Both end up here, so a call filed either way is filed the same way.
 */

const API = 'https://public.heypocketai.com/api/v1/public'

/**
 * Only the Wednesday group call belongs on the platform.
 *
 * The recorder is Chris's, not the programme's, and it records his day: a
 * partnership call, a catch up with a founder, whatever else he is in. Those
 * recordings mention members by name, so without a filter they would be filed
 * against whoever was named and read back as context the next time a message
 * was drafted. That is somebody else's private conversation landing on a
 * member's record.
 *
 * Matched on the title, because that is the only thing the listing and the
 * webhook both carry. Pocket writes those titles itself from the content, so
 * they are not a guarantee, which is why this fails closed: a recording with
 * no title, or a title that matches nothing, is left alone. A call that does
 * not arrive is a thing somebody notices and asks about. A call that arrives
 * on the wrong record is not.
 */
const DEFAULT_MATCH = 'mindset matters'

/** The phrases in force, from the environment or the default. */
export function titlePatterns(configured = process.env.POCKET_TITLE_MATCH): string[] {
  const given = (configured ?? '')
    .split(',')
    .map((phrase) => phrase.trim().toLowerCase())
    .filter(Boolean)
  return given.length ? given : [DEFAULT_MATCH]
}

/** Whether a recording with this title is the group call. */
export function isGroupCall(title: string | null | undefined, patterns = titlePatterns()): boolean {
  const found = (title ?? '').trim().toLowerCase()
  if (!found) return false
  return patterns.some((phrase) => found.includes(phrase))
}

export type Segment = { speaker?: string; speakerName?: string; text?: string }

export type Speakers = Record<string, { name?: string }> | undefined

type Person = {
  id: string
  first_name: string | null
  recording_name: string | null
  is_admin: boolean
  personalised_nudges: boolean
}

export type Filed = { recordingId: string; filed: string[]; unmatched: string[] }

/*
 * Only what this file actually calls, rather than the full client type.
 *
 * The service client and the request-scoped one are the same object with
 * different generic parameters, and naming either of them here would make this
 * usable from one caller and not the other.
 */
type Db = {
  from: (table: string) => any
}

/** The name against a line, however the payload happens to carry it. */
function speakerOf(segment: Segment, speakers: Speakers): string {
  return (
    segment.speakerName ??
    (segment.speaker ? speakers?.[segment.speaker]?.name : undefined) ??
    ''
  ).trim()
}

/**
 * One recording, filed as one row per member who was on it.
 *
 * Each gets the whole conversation as their transcript, because what Chris said
 * to somebody else is usually the context for what he said to them, and a
 * reading written about them alone.
 */
export async function fileCall(
  supabase: Db,
  {
    recordingId,
    segments,
    speakers,
    happenedOn,
    anthropicKey,
    model,
  }: {
    recordingId: string
    segments: Segment[]
    speakers: Speakers
    happenedOn: string
    anthropicKey?: string
    model: string
  },
): Promise<Filed> {
  const { data: people } = await supabase
    .from('profiles')
    .select('id, first_name, recording_name, is_admin, personalised_nudges')

  /*
   * Chris is on every one of these and is not a member of it, so admins are
   * out. Anybody who has turned personalised messages off is out too: this is
   * precisely the kind of thing that switch is about.
   */
  const members = ((people ?? []) as Person[])
    .filter((p) => !p.is_admin && p.personalised_nudges)
    .map((p) => ({ id: p.id, firstName: p.first_name, recordingName: p.recording_name }))

  const transcript = segments
    .map((s) => ({ who: speakerOf(s, speakers), text: (s.text ?? '').trim() }))
    .filter((line) => line.text)
    .map((line) => `${line.who || 'Unknown'}: ${line.text}`)
    .join('\n')

  if (!transcript) return { recordingId, filed: [], unmatched: [] }

  const heard = [...new Set(segments.map((s) => speakerOf(s, speakers)).filter(Boolean))]

  const filed: string[] = []
  const unmatched: string[] = []

  for (const speaker of heard) {
    const member = matchSpeaker(speaker, members)
    if (!member) {
      unmatched.push(speaker)
      continue
    }

    /*
     * Skipped where this recording is already on file. The reading is the
     * expensive part and re-running it on every poll would spend a model call a
     * day per member to arrive at the same notes.
     */
    const { data: already } = await supabase
      .from('member_conversations')
      .select('id')
      .eq('member_id', member.id)
      .eq('external_id', recordingId)
      .maybeSingle()
    if (already) continue

    /*
     * A failed reading still files the transcript. That is the part that cannot
     * be made again; notes can be rebuilt from it at any time.
     */
    const notes = anthropicKey
      ? await distil(transcript, anthropicKey, model, member.firstName ?? speaker)
      : null

    const { error } = await supabase.from('member_conversations').upsert(
      {
        member_id: member.id,
        happened_on: happenedOn,
        transcript,
        notes,
        source: 'group',
        external_id: recordingId,
      },
      { onConflict: 'member_id,external_id' },
    )
    if (!error) filed.push(member.firstName ?? member.id)
  }

  return { recordingId, filed, unmatched }
}

type Listed = {
  id: string
  title?: string
  recording_at?: string
  created_at?: string
  state?: string
}

/**
 * Anything recorded in the last few days that is not on file yet.
 *
 * A window rather than a change feed, because Pocket's list endpoint filters by
 * date and offers no "since" cursor. A week is wide enough to cover a recording
 * that sat on the device unsynced over a weekend, and `fileCall` skips whatever
 * is already stored, so a wide window costs a listing rather than repeated work.
 */
export async function pullRecentCalls(
  supabase: Db,
  {
    apiKey,
    anthropicKey,
    model,
    days = 8,
  }: { apiKey: string; anthropicKey?: string; model: string; days?: number },
): Promise<{ checked: number; skipped?: number; results: Filed[]; error?: string }> {
  const from = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

  const listing = await fetch(`${API}/recordings?start_date=${from}&limit=50`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!listing.ok) {
    return { checked: 0, results: [], error: `Pocket would not list recordings (${listing.status}).` }
  }

  const payload = (await listing.json()) as { data?: Listed[]; recordings?: Listed[] }
  const recordings = payload.data ?? payload.recordings ?? []

  const results: Filed[] = []

  let skipped = 0

  for (const row of recordings) {
    if (!row.id) continue

    /*
     * Checked before the detail is fetched, not after. An unwanted recording
     * then costs nothing: its transcript is never pulled, so Chris's other
     * calls are not read by this at all, let alone stored.
     */
    if (!isGroupCall(row.title)) {
      skipped += 1
      continue
    }

    const detail = await fetch(`${API}/recordings/${row.id}?include_transcript=true`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!detail.ok) continue

    const body = (await detail.json()) as {
      data?: { transcript?: { segments?: Segment[] }; speakers?: Speakers }
      transcript?: { segments?: Segment[] }
      speakers?: Speakers
    }
    const inner = body.data ?? body
    const segments = inner.transcript?.segments ?? []
    if (!segments.length) continue

    results.push(
      await fileCall(supabase, {
        recordingId: row.id,
        segments,
        speakers: inner.speakers,
        happenedOn: (row.recording_at ?? row.created_at ?? '').slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
        anthropicKey,
        model,
      }),
    )
  }

  return { checked: recordings.length, skipped, results }
}
