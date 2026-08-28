import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { resolveEntry } from '@/lib/entry'
import { isHuddleEntry, HUDDLE_QUESTIONS, type Field } from '@/content/entry-fields'
import { REVIEW_FIELDS, SCHEDULE_HOURS } from '@/content/journal-fields'
import { VALUES } from '@/content/entry-extras'

/**
 * Reads a photograph of a printed journal page into the entry's own fields.
 *
 * This is not open ended handwriting recognition, which is why it can be
 * accurate: the platform already knows exactly what is on page forty seven, so
 * the model is asked to fill in a known form rather than to work out what it is
 * looking at. Anything it cannot read comes back empty, and the member proofs
 * the result against the page in their hand before it counts.
 *
 * The schedule is read as times and labels rather than as a grid. Asked for as
 * geometry it comes back as confident nonsense; asked as "nine to eleven, deep
 * work" it is just handwriting again, and anything that does not land on an
 * hour the journal actually prints is dropped rather than rounded.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MAX_BYTES = 6_000_000

type Body = { image?: string; type?: string }

/** Describes one answerable field, so the model knows what to look for. */
function describe(field: Field, path: string, out: string[]) {
  switch (field.kind) {
    case 'note':
      return
    case 'group':
      field.fields.forEach((child, i) => describe(child, `${path}.${i}`, out))
      return
    case 'lines':
      out.push(`"fields.${path}": an array of up to ${field.count} short lines — ${field.label}`)
      return
    case 'percent':
    case 'scale':
    case 'gauge':
      out.push(`"fields.${path}": a number written as a string — ${field.label}`)
      return
    default:
      out.push(`"fields.${path}": ${field.label}`)
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ entry: string }> }) {
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

  const n = Number((await params).entry)
  const entry = Number.isInteger(n) ? resolveEntry(n) : undefined
  if (!entry) return NextResponse.json({ error: 'No such entry' }, { status: 404 })

  const { image, type = 'image/jpeg' }: Body = await request.json().catch(() => ({}))
  if (!image) return NextResponse.json({ error: 'No photo' }, { status: 400 })

  const bytes = Buffer.from(image, 'base64')
  if (!bytes.length || bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: 'That photo is too large' }, { status: 413 })
  }

  /*
   * Kept as well as read. The transcription is a convenience; the photograph is
   * what they actually wrote, and the thing to check against when a line comes
   * out wrong months later.
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
        ' written or blocked out on the hour by hour schedule, using only these hour labels: ' +
        SCHEDULE_HOURS.join(', ') +
        '. "to" is the hour the block ends at. Leave it out entirely if the schedule is empty.',
    )
    for (const field of REVIEW_FIELDS) wanted.push(`"${field.key}": ${field.label}`)
  }
  entry.fields.forEach((field, i) => describe(field, String(i), wanted))
  if (n === 8) {
    wanted.push(`"values": the values circled or ticked, from this list only: ${VALUES.join(', ')}`)
  }

  const prompt = [
    `This is a photograph of the open spread for entry ${n} of a printed performance journal, titled "${entry.title}".`,
    isHuddleEntry(n)
      ? 'The left page closes the week with three questions. The right page carries the exercise.'
      : 'The left page previews and reviews the day. The right page carries the exercise.',
    'Transcribe the handwriting into the fields below. It is the writer of the page asking.',
    '',
    'Fields:',
    ...wanted.map((line) => `- ${line}`),
    '',
    'Rules:',
    '- Transcribe what is written, word for word. Do not tidy it up, complete a half finished sentence, or improve the grammar.',
    '- Leave a field out entirely if it is blank, or if you cannot read it with confidence. An empty field is right; a guess is not.',
    '- Ignore any ticks, boxes and checkmarks. Whether something was done is not being asked for.',
    '- For the schedule, read the times and what is written beside them. Do not infer a block from an empty row.',
    '- Only one page of the spread may be in shot, or one page may be blank. Fill in what you can see and leave the rest out.',
    '- Ignore the printed prompts and quotations. Only the handwriting is wanted.',
    '- If the page is not a journal page at all, return {}.',
    '',
    'Reply with JSON only, no other text. Use exactly the field names above, with the dots meaning nesting: "huddle.0" is the first item of a "huddle" array, "fields.2" is key "2" of a "fields" object.',
  ].join('\n')

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
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

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Could not read that photo. It is saved, so nothing is lost.', path },
      { status: 502 },
    )
  }

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] }
  const text = (payload.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  let flat: Record<string, unknown> = {}
  if (start !== -1 && end > start) {
    try {
      flat = JSON.parse(text.slice(start, end + 1))
    } catch {
      return NextResponse.json({ error: 'That came back unreadable. Try again.' }, { status: 502 })
    }
  }

  return NextResponse.json({ path, data: withBlocks(nest(flat)) })
}

/**
 * Turns "9am to 11am" into the pair of row numbers the schedule is stored as.
 *
 * A block covers both ends, so nine to eleven is rows 4 to 6 of a day starting
 * at five. An hour the journal does not print is a misreading, and is dropped.
 */
function withBlocks(data: Record<string, unknown>): Record<string, unknown> {
  const raw = data.blocks
  if (!Array.isArray(raw)) {
    delete data.blocks
    return data
  }

  const blocks = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as { from?: string; to?: string; label?: string }
      const label = (row.label ?? '').trim()
      const start = SCHEDULE_HOURS.indexOf((row.from ?? '').trim().toLowerCase())
      if (!label || start === -1) return null
      const end = SCHEDULE_HOURS.indexOf((row.to ?? '').trim().toLowerCase())
      return { start, end: end > start ? end : start, label }
    })
    .filter((block): block is { start: number; end: number; label: string } => Boolean(block))

  if (blocks.length) data.blocks = blocks
  else delete data.blocks

  return data
}

/**
 * Turns the flat "huddle.0" keys back into the shape the entry is stored in.
 *
 * Asked for flat because a model holds a flat list of names far more reliably
 * than a nested shape, and the nesting is trivial to rebuild here.
 */
function nest(flat: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(flat)) {
    if (value === null || value === undefined || value === '') continue

    const [head, tail] = key.split('.', 2)
    if (tail === undefined) {
      out[head] = value
      continue
    }

    const index = Number(tail)
    if (head === 'fields') {
      const held = (out.fields ?? {}) as Record<string, unknown>
      held[tail] = value
      out.fields = held
    } else if (Number.isInteger(index)) {
      const held = (out[head] ?? []) as unknown[]
      held[index] = value
      out[head] = held
    }
  }

  // A model that answers "huddle.0" and "huddle.2" leaves a hole in the middle.
  for (const key of ['intentions', 'achievements', 'huddle', 'values']) {
    if (Array.isArray(out[key])) {
      out[key] = (out[key] as unknown[]).map((item) => item ?? '')
    }
  }

  return out
}
