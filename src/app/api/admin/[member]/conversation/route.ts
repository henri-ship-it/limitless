import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import type { ConversationNotes } from '@/lib/admin'

/**
 * Reads a 1:1 transcript once, and keeps what is useful about it.
 *
 * The transcript itself is far too long and far too noisy to put in front of
 * every draft. An hour of talking is mostly throat clearing, and a model handed
 * all of it fastens onto whatever was said most recently rather than whatever
 * mattered. So it is distilled here, once, into the handful of things that
 * change how you write to somebody: what actually moves them, how they like to
 * be spoken to, what they are working towards, and the few details of their
 * life worth remembering.
 *
 * Both halves are stored. The distillation is an opinion, and a better prompt
 * in six months should be able to go back to what was actually said rather than
 * to the last summary of it.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'
const MAX_TRANSCRIPT = 400_000

type Body = { transcript?: string; happenedOn?: string }

const INSTRUCTION = [
  'This is a transcript of a one to one coaching call between Chris Bodman, who runs the Limitless programme, and one of his members.',
  'Chris was in the room. Read it the way he would remember it: not to summarise the call, but to come away knowing how to write to this person.',
  '',
  'Return JSON only, in this shape:',
  '{',
  '  "motivation": "One or two sentences on what actually moves this person. Not what they say they want, what visibly lights them up or gets them working. Be specific to them.",',
  '  "communication": "One or two sentences on how to talk to them. Long or short. Direct or warm. Do they want a challenge, a plan, or a nudge. How they responded when Chris pushed.",',
  '  "goals": ["What they are working towards, in their own words where you can. Two to five."],',
  '  "life": ["Things about their life outside the programme that a person who listened would remember. Family, work, a trip, something they are training for. Two to five. Leave it empty if they did not say anything personal."],',
  '  "quotes": ["Up to three short lines they actually said, word for word, that are worth having. Only if genuinely striking."]',
  '}',
  '',
  'Rules:',
  '- Only what is in the transcript. Never infer a diagnosis, a personality type, or a motive they did not show.',
  '- Leave a field empty rather than filling it thinly. An empty list is honest; a vague one gets used and is wrong.',
  '- Write it for Chris to read, in plain sentences. No jargon, no coaching language, no bullet-point personality profiling.',
  '- Never use an em dash or an en dash.',
].join('\n')

/** Em and en dashes never survive into anything that feeds a draft. */
function plain(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ' - ')
}

function clean(notes: ConversationNotes): ConversationNotes {
  const list = (items?: string[]) =>
    (items ?? []).map((item) => plain(String(item)).trim()).filter(Boolean)

  return {
    motivation: notes.motivation ? plain(notes.motivation).trim() : undefined,
    communication: notes.communication ? plain(notes.communication).trim() : undefined,
    goals: list(notes.goals),
    life: list(notes.life),
    quotes: list(notes.quotes),
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ member: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'No API key set.' }, { status: 503 })
  }

  const { member: id } = await params
  const { transcript = '', happenedOn }: Body = await request.json().catch(() => ({}))

  const text = transcript.trim()
  if (text.length < 200) {
    return NextResponse.json({ error: 'That is too short to be a transcript.' }, { status: 400 })
  }
  if (text.length > MAX_TRANSCRIPT) {
    return NextResponse.json({ error: 'That transcript is too long.' }, { status: 413 })
  }

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: `${INSTRUCTION}\n\nTranscript:\n\n${text}` }],
    }),
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: `The model would not read that (${response.status}).` },
      { status: 502 },
    )
  }

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] }
  const reply = (payload.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')

  let notes: ConversationNotes | null = null
  const start = reply.indexOf('{')
  const end = reply.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      notes = clean(JSON.parse(reply.slice(start, end + 1)) as ConversationNotes)
    } catch {
      // Kept anyway. The transcript is the thing that cannot be recreated.
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('member_conversations')
    .insert({
      member_id: id,
      happened_on: happenedOn || new Date().toISOString().slice(0, 10),
      transcript: text,
      notes,
    })
    .select('id, happened_on, transcript, notes')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ conversation: data })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ member: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const { member: id } = await params
  const { searchParams } = new URL(request.url)
  const conversation = searchParams.get('id')
  if (!conversation) return NextResponse.json({ error: 'Which one?' }, { status: 400 })

  const supabase = await createClient()
  const { error } = await supabase
    .from('member_conversations')
    .delete()
    .eq('id', conversation)
    .eq('member_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
