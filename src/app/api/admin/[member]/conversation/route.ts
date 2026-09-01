import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { distil } from '@/lib/distil'

/**
 * Takes a 1:1 transcript, reads it once, and keeps both halves.
 *
 * The transcript itself is far too long and far too noisy to put in front of
 * every draft. An hour of talking is mostly throat clearing, and a model handed
 * all of it fastens onto whatever was said most recently rather than whatever
 * mattered. The reading lives in lib/distil so the same one can be run again
 * over transcripts already stored.
 *
 * A transcript whose reading fails is still saved. The transcript is the part
 * that cannot be recreated; the notes can be made again at any time.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const MAX_TRANSCRIPT = 400_000

type Body = { transcript?: string; happenedOn?: string }

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

  const notes = await distil(text, key, MODEL)

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

/**
 * Reads a stored transcript again.
 *
 * The reason the transcript is kept whole. When the reading improves, the
 * conversations already on the platform can improve with it, rather than
 * staying frozen at whatever the prompt said the week they were pasted in.
 *
 * Old notes are only replaced by a reading that worked.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ member: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'No API key set.' }, { status: 503 })

  const { member: id } = await params
  const { searchParams } = new URL(request.url)
  const conversation = searchParams.get('id')
  if (!conversation) return NextResponse.json({ error: 'Which one?' }, { status: 400 })

  const supabase = await createClient()
  const { data: row } = await supabase
    .from('member_conversations')
    .select('transcript')
    .eq('id', conversation)
    .eq('member_id', id)
    .single()

  if (!row) return NextResponse.json({ error: 'No such conversation' }, { status: 404 })

  const notes = await distil(row.transcript, key, MODEL)
  if (!notes) {
    return NextResponse.json(
      { error: 'That would not read this time. The notes you had are untouched.' },
      { status: 502 },
    )
  }

  const { error } = await supabase
    .from('member_conversations')
    .update({ notes })
    .eq('id', conversation)
    .eq('member_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notes })
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
