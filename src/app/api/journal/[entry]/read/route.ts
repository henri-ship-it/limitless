import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { resolveEntry } from '@/lib/entry'
import { isHuddleEntry, HUDDLE_QUESTIONS, type Field } from '@/content/entry-fields'
import { REVIEW_FIELDS } from '@/content/journal-fields'
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
 * The schedule grid is deliberately not read. It is a drawing, not text, and a
 * plausible looking grid that is wrong is worse than an empty one.
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
    for (const field of REVIEW_FIELDS) wanted.push(`"${field.key}": ${field.label}`)
  }
  entry.fields.forEach((field, i) => describe(field, String(i), wanted))
  if (n === 8) {
    wanted.push(`"values": the values circled or ticked, from this list only: ${VALUES.join(', ')}`)
  }

  const prompt = [
    `This is a photograph of page ${n} of a printed performance journal, titled "${entry.title}".`,
    'Transcribe the handwriting into the fields below. It is the writer of the page asking.',
    '',
    'Fields:',
    ...wanted.map((line) => `- ${line}`),
    '',
    'Rules:',
    '- Transcribe what is written, word for word. Do not tidy it up, complete a half finished sentence, or improve the grammar.',
    '- Leave a field out entirely if it is blank, or if you cannot read it with confidence. An empty field is right; a guess is not.',
    '- Ignore the hour by hour schedule grid and any ticks or boxes. Those are not being asked for.',
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

  return NextResponse.json({ path, data: nest(flat) })
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
