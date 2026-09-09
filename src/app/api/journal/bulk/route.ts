import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { resolveEntry } from '@/lib/entry'
import { entriesForWeek } from '@/content/journal'
import { isHuddleEntry, HUDDLE_QUESTIONS, type Field } from '@/content/entry-fields'
import { REVIEW_FIELDS, SCHEDULE_HOURS } from '@/content/journal-fields'
import { VALUES } from '@/content/entry-extras'

/**
 * Reads a week's worth of photographed pages in one go and files each one
 * against the entry it belongs to.
 *
 * Somebody who writes on paper does not sit down seven times to photograph
 * seven spreads. They finish the week, open the huddle and want to hand over a
 * pile. So the sorting is the platform's job, not theirs.
 *
 * Two passes per photo rather than one. Asking a model to work out which page
 * it is looking at and transcribe it in the same breath produced confident
 * filing into the wrong entry: it would find something that looked like an
 * answer and reverse into a page number that suited it. Identifying first,
 * against the seven titles this week actually has, keeps the two questions
 * apart, and a page that cannot be placed is returned unplaced rather than
 * guessed at.
 *
 * Nothing already written is overwritten. A transcription is a convenience and
 * their own typing is the record, so a field with something in it is left
 * exactly as it is and reported as skipped.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MAX_BYTES = 6_000_000

type Body = { week?: number; image?: string; type?: string }

async function ask(key: string, image: string, type: string, prompt: string, maxTokens: number) {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: type, data: image } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) return null

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] }
  return (payload.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
}

/** Describes one answerable field, so the model knows what to look for. */
function describe(field: Field, path: string, out: string[]) {
  switch (field.kind) {
    case 'note':
      return
    case 'group':
      field.fields.forEach((child, i) => describe(child, `${path}.${i}`, out))
      return
    case 'lines':
      out.push(`"fields.${path}": an array of up to ${field.count} short lines, ${field.label}`)
      return
    case 'percent':
    case 'scale':
    case 'gauge':
      out.push(`"fields.${path}": a number written as a string, ${field.label}`)
      return
    default:
      out.push(`"fields.${path}": ${field.label}`)
  }
}

function json(text: string | null): Record<string, unknown> | null {
  if (!text) return null
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  if (!supabaseConfigured) {
    return NextResponse.json({ error: 'Not available here' }, { status: 503 })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'Reading photos is not switched on yet. Type it in for now.' },
      { status: 503 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { week, image, type = 'image/jpeg' }: Body = await request.json().catch(() => ({}))
  if (!image) return NextResponse.json({ error: 'No photo' }, { status: 400 })
  if (!Number.isInteger(week)) return NextResponse.json({ error: 'No week' }, { status: 400 })

  const bytes = Buffer.from(image, 'base64')
  if (!bytes.length || bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: 'That photo is too large' }, { status: 413 })
  }

  const candidates = entriesForWeek(week!)
  if (!candidates.length) return NextResponse.json({ error: 'No such week' }, { status: 404 })

  /*
   * Which page is this. Constrained to the seven the week actually contains,
   * so a misread number cannot file a page into a week they have not reached.
   */
  const identify = [
    `This is a photograph of an open spread from a printed performance journal, somewhere in week ${week}.`,
    'Work out which entry it is. These are the only entries it can be:',
    ...candidates.map((e) => {
      const resolved = resolveEntry(e.n)
      return `- Entry ${e.n}${resolved?.title ? `: ${resolved.title}` : ''}`
    }),
    '',
    'The printed page carries its own number and usually a title. Go by those, not by what the handwriting is about.',
    'Reply with JSON only: {"entry": <the number>, "sure": true or false}.',
    'Set "sure" to false if the page number is not legible, if the page is not from this week, or if it is not a journal page at all. A wrong answer files somebody\'s writing under the wrong day, so being unsure is the better mistake.',
  ].join('\n')

  const found = json(await ask(key, image, type, identify, 200))
  const n = Number(found?.entry)
  const sure = found?.sure === true

  if (!sure || !candidates.some((e) => e.n === n)) {
    return NextResponse.json({ placed: false, reason: 'Could not tell which page this is.' })
  }

  const entry = resolveEntry(n)
  if (!entry) return NextResponse.json({ placed: false, reason: 'No such entry.' })

  /*
   * Kept as well as read. The transcription is the convenience; the photograph
   * is what they actually wrote, and the thing to check a wrong line against.
   */
  const path = `${user.id}/${n}/${Date.now()}.jpg`
  const stored = await supabase.storage
    .from('journal-photos')
    .upload(path, bytes, { contentType: type, upsert: false })
  if (!stored.error) {
    await supabase.from('member_photos').insert({ member_id: user.id, entry_number: n, path })
  }

  const wanted: string[] = []
  if (isHuddleEntry(n)) {
    HUDDLE_QUESTIONS.forEach((question, i) => wanted.push(`"huddle.${i}": ${question}`))
  } else {
    wanted.push('"intentions": an array of up to three intentions for the day')
    wanted.push('"achievements": an array of the achievements listed, however many there are')
    wanted.push(
      '"blocks": an array of {"from": "9am", "to": "11am", "label": "what it says"} for anything' +
        ' written on the hour by hour schedule, using only these hour labels: ' +
        SCHEDULE_HOURS.join(', ') +
        '. Leave it out entirely if the schedule is empty.',
    )
    for (const field of REVIEW_FIELDS) wanted.push(`"${field.key}": ${field.label}`)
  }
  entry.fields.forEach((field, i) => describe(field, String(i), wanted))
  if (n === 8) {
    wanted.push(`"values": the values circled or ticked, from this list only: ${VALUES.join(', ')}`)
  }

  const read = [
    `This is the spread for entry ${n} of a printed performance journal, titled "${entry.title}".`,
    'Transcribe the handwriting into the fields below. It is the writer of the page asking.',
    '',
    'Fields:',
    ...wanted.map((line) => `- ${line}`),
    '',
    'Rules:',
    '- Transcribe what is written, word for word. Do not tidy it up, finish a half written sentence, or improve the grammar.',
    '- Leave a field out entirely if it is blank or you cannot read it with confidence. An empty field is right; a guess is not.',
    '- Ignore ticks, boxes and checkmarks, and ignore the printed prompts and quotations. Only the handwriting is wanted.',
    '',
    'Reply with JSON only. Use exactly the field names above, with the dots meaning nesting.',
  ].join('\n')

  const flat = json(await ask(key, image, type, read, 4000)) ?? {}

  /*
   * Merged under whatever is already there. Somebody who typed an entry up and
   * then photographed the page should not lose the typing to the photograph.
   */
  const { data: existing } = await supabase
    .from('member_journal')
    .select('data')
    .eq('member_id', user.id)
    .eq('entry_number', n)
    .maybeSingle()

  const before = (existing?.data ?? {}) as Record<string, unknown>
  const { merged, added, kept } = merge(before, nest(flat))

  if (added > 0) {
    await supabase.from('member_journal').upsert(
      {
        member_id: user.id,
        entry_number: n,
        data: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'member_id,entry_number' },
    )
  }

  return NextResponse.json({ placed: true, entry: n, title: entry.title, added, kept })
}

/** Turns "fields.2" and "huddle.0" into real nesting. */
function nest(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(flat)) {
    if (!key.includes('.')) {
      out[key] = value
      continue
    }

    const [head, ...rest] = key.split('.')
    const tail = rest.join('.')

    if (head === 'huddle') {
      const list = (out.huddle as string[]) ?? []
      list[Number(tail)] = String(value)
      out.huddle = list
      continue
    }

    const group = (out[head] as Record<string, unknown>) ?? {}
    group[tail] = value
    out[head] = group
  }

  return out
}

/**
 * Adds what the photograph found without touching what is already written.
 *
 * Counted both ways so the member is told what happened rather than left to
 * work out why one page changed six things and another changed none.
 */
function merge(before: Record<string, unknown>, found: Record<string, unknown>) {
  const merged: Record<string, unknown> = { ...before }
  let added = 0
  let kept = 0

  const empty = (v: unknown) =>
    v === undefined ||
    v === null ||
    (typeof v === 'string' && !v.trim()) ||
    (Array.isArray(v) && v.every((x) => !String(x ?? '').trim()))

  for (const [key, value] of Object.entries(found)) {
    if (empty(value)) continue

    // Nested objects, such as `fields`, are merged one answer at a time.
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const target = { ...((merged[key] as Record<string, unknown>) ?? {}) }
      for (const [inner, innerValue] of Object.entries(value as Record<string, unknown>)) {
        if (empty(innerValue)) continue
        if (empty(target[inner])) {
          target[inner] = innerValue
          added += 1
        } else {
          kept += 1
        }
      }
      merged[key] = target
      continue
    }

    if (empty(merged[key])) {
      merged[key] = value
      added += 1
    } else {
      kept += 1
    }
  }

  return { merged, added, kept }
}

