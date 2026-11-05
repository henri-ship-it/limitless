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
 * Which of Chris's recordings belong to the programme.
 *
 * The recorder is his, not the programme's, and it records his day: a
 * partnership call, a catch up with a founder, whatever else he is in. Those
 * recordings mention people by name, so without a gate they would be filed
 * against whichever member was named and read back as context the next time a
 * message was drafted. That is a private conversation landing on a member's
 * record.
 *
 * Not matched on the title. Pocket writes titles itself from the content, so
 * they describe what was discussed rather than name the call: the Pro call on
 * the fourth of November came out as "Mindset Matters Group Flow State
 * Coaching", which is a sentence about that week rather than a label, and next
 * week's will be a sentence about next week. A filter built on it would file
 * the right call once and then quietly stop.
 *
 * So the gate is the two things that are actually true of this call and not of
 * his others. It happens on a Wednesday, and the people on it are members. The
 * first is cheap and is checked off the listing, before any transcript is
 * fetched. The second is the one that matters and is checked in `fileCall`,
 * which has to work out who spoke anyway.
 *
 * Both have to hold. A private call on a Wednesday fails the second; a call
 * full of members on a Tuesday is not this call and fails the first.
 */

/** The day the programme's calls happen. Sunday is 0. */
const CALL_DAY = 3

/**
 * How many members must be heard before a recording is filed as the call.
 *
 * Two rather than one, because one member's name coming up in a conversation
 * about them is exactly what a private call sounds like, and that is the case
 * this is here to stop.
 */
export const MIN_MEMBERS = 2

/** Whether a date falls on the day the calls happen. Anything unparseable does not. */
export function onCallDay(date: string | null | undefined): boolean {
  const when = (date ?? '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(when)) return false
  const parsed = new Date(`${when}T12:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getUTCDay() === CALL_DAY
}

/**
 * An optional override, for a call moved off its usual day.
 *
 * Unset it matches nothing and changes nothing, so the day alone decides. Set
 * to a phrase it lets that recording through whatever day it happened on, for
 * the week the call moves to a Thursday and would otherwise be lost.
 */
export function titlePatterns(configured = process.env.POCKET_TITLE_MATCH): string[] {
  return (configured ?? '')
    .split(',')
    .map((phrase) => phrase.trim().toLowerCase())
    .filter(Boolean)
}

/** Whether a title matches a configured override. No phrases means no. */
export function titleAllows(title: string | null | undefined, patterns = titlePatterns()): boolean {
  const found = (title ?? '').trim().toLowerCase()
  if (!found) return false
  return patterns.some((phrase) => found.includes(phrase))
}

/** Whether a recording is worth opening at all: the right day, or named explicitly. */
export function worthReading(
  recording: { title?: string | null; happenedOn?: string | null },
  patterns = titlePatterns(),
): boolean {
  return onCallDay(recording.happenedOn) || titleAllows(recording.title, patterns)
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

export type Filed = {
  recordingId: string
  filed: string[]
  unmatched: string[]
  /** Set when the recording was read and then left alone, saying why. */
  ignored?: string
}

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

  /*
   * Who was on it, worked out before anything is written.
   *
   * This is the gate that actually protects members. The day a recording
   * happened says it might be the call; the people on it say it is. A private
   * conversation on a Wednesday will mention a member by name but will not
   * have two of them speaking in it, so it stops here, having been read into
   * memory and never stored.
   */
  const unmatched: string[] = []
  /* The label is kept beside the member so a failed name lookup can fall back to it. */
  const present: { id: string; firstName: string | null; label: string }[] = []

  for (const speaker of heard) {
    const member = matchSpeaker(speaker, members)
    if (member) present.push({ ...member, label: speaker })
    else unmatched.push(speaker)
  }

  if (present.length < MIN_MEMBERS) {
    return {
      recordingId,
      filed: [],
      unmatched,
      ignored: `Only ${present.length} member${present.length === 1 ? '' : 's'} heard, so this was not the call.`,
    }
  }

  const filed: string[] = []

  for (const member of present) {

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
      ? await distil(transcript, anthropicKey, model, member.firstName ?? member.label)
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
    const happenedOn =
      (row.recording_at ?? row.created_at ?? '').slice(0, 10) ||
      new Date().toISOString().slice(0, 10)

    if (!worthReading({ title: row.title, happenedOn })) {
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
        happenedOn,
        anthropicKey,
        model,
      }),
    )
  }

  return { checked: recordings.length, skipped, results }
}
