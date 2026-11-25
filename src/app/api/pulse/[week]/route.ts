import { NextResponse } from 'next/server'

import { PULSE_WEEKS } from '@/content/pulse'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'

/**
 * Receives a module check-in.
 *
 * Called more than once for the same week on purpose: the score is saved the
 * moment it is tapped, and the writing arrives afterwards if it arrives at
 * all. So this merges into whatever is already there for that week rather
 * than replacing it, and a second call carrying only `dismissed` cannot wipe
 * a score that is already in.
 *
 * Filed on `profiles.assessment` under `pulse`, keyed by week, beside the
 * behavioural style and the baseline. No migration, and an admin reading a
 * member already has the column.
 */
export async function POST(request: Request, { params }: { params: Promise<{ week: string }> }) {
  const { week: raw } = await params
  const week = Number(raw)
  if (!PULSE_WEEKS.includes(week)) {
    return NextResponse.json({ error: 'Not a check-in week' }, { status: 404 })
  }
  if (!supabaseConfigured) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Expected JSON' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 })

  const score = Number(body.score)
  const chapter = typeof body.chapter === 'string' ? body.chapter.slice(0, 120) : undefined
  const words = typeof body.words === 'string' ? body.words.trim().slice(0, 2000) : undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('assessment')
    .eq('id', user.id)
    .maybeSingle()

  const held = (profile?.assessment ?? {}) as Record<string, unknown>
  const pulses = (held.pulse ?? {}) as Record<string, Record<string, unknown>>
  const already = pulses[String(week)] ?? {}

  const merged: Record<string, unknown> = { ...already }
  if (Number.isInteger(score) && score >= 1 && score <= 5) merged.score = score
  if (chapter !== undefined) merged.chapter = chapter || null
  if (words) merged.words = words
  if (body.dismissed === true) merged.dismissed = true
  merged.at = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update({ assessment: { ...held, pulse: { ...pulses, [String(week)]: merged } } })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'That did not save' }, { status: 500 })
  return NextResponse.json({ status: 'stored' })
}
