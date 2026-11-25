import { NextResponse } from 'next/server'

import { getMemberDetail, requireAdmin } from '@/lib/admin'
import { BASELINE, questionsOf } from '@/content/journey'
import { isBlueprint, BLUEPRINT_SLOT, type Blueprint } from '@/content/blueprint'
import { leadStyle } from '@/content/know-thyself'
import { createClient } from '@/lib/supabase/server'

/**
 * Drafts a member's blueprint from their baseline and the welcome call.
 *
 * **It is a draft, not a delivery.** This returns the document; nothing is
 * filed and nothing reaches the member until Chris saves it. The whole value
 * of a blueprint is that it reads as though somebody sat down after the call
 * and wrote it, and a model's first attempt is not that. It gets read, edited
 * and then sent, which is the same shape the message drafting already uses.
 *
 * **Pro and Elite only.** It is written out of a welcome call, and Core and
 * Elevate do not have one. Refused here rather than hidden in the UI.
 *
 * The call notes are the other half of the input and the half that makes it
 * specific. Without them the model has only a questionnaire, and a blueprint
 * written from a questionnaire reads like one.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

const SYSTEM = `You draft the Limitless Blueprint for Chris Bodman, who runs the Limitless programme at LMNTARY Performance.

He has just come off a 30 minute welcome call with this member. You are writing up what he would have written, from their baseline answers and his notes from the call.

How this has to read.

It is written TO the member, as "you". It is one person who has paid attention writing to another, not a report. Chris has read their answers and spoken to them, and it should be obvious that both happened: use their own words and the specifics of their situation, not categories they fall into.

Never tell them what they are. Everything here is about where they are now and what they do under pressure, never a type or a fixed trait. "You tend to" and "under pressure you" rather than "you are".

Be concrete. Every claim should be traceable to something they said. If the baseline and the notes do not support a point, leave it out rather than inventing one. A short blueprint built on real material beats a full one built on guesses.

House style, which is not optional:
- British spelling.
- No em dashes and no en dashes anywhere. Use a comma or end the sentence.
- No "journey", "unlock", "elevate", "transformative", "delve", "landscape", "crucial", "seamless".
- Short sentences. One idea each.
- Never open a sentence with "This is not X, it is Y".
- Do not flatter them and do not congratulate them for signing up.

The four stages are fixed and in this order: Learn, Manage, Nurture, Thrive. They spell LMNT. Each gets a title of two to four words that is specific to this member, then why that stage matters for them, then what they should have by the end of it.

Return ONLY a JSON object, no prose around it, shaped exactly:

{
  "territory": {
    "challenge": "one sentence naming the thing they are actually up against",
    "challengeReflection": "two or three sentences on why it persists for them",
    "direction": ["three", "single", "words"],
    "directionReflection": "two or three sentences on what those three words ask of them"
  },
  "resistance": {
    "rows": [
      { "heading": "Slippery Behaviours", "title": "short name", "watchFor": "what it looks like from the inside", "playsOut": "what happens when it wins" },
      { "heading": "Patterns of Thinking", "title": "short name", "watchFor": "the thought, in their own register", "playsOut": "where it takes them" }
    ],
    "shiftFrom": "a few words",
    "shiftTo": "a few words"
  },
  "journey": [
    { "stage": "Learn", "title": "...", "relevance": "...", "outcomes": "..." },
    { "stage": "Manage", "title": "...", "relevance": "...", "outcomes": "..." },
    { "stage": "Nurture", "title": "...", "relevance": "...", "outcomes": "..." },
    { "stage": "Thrive", "title": "...", "relevance": "...", "outcomes": "..." }
  ],
  "integration": {
    "strengths": ["three or four, each a short phrase"],
    "opportunities": ["three or four, each a short phrase"],
    "reflection": "three or four sentences to close, addressed to them"
  }
}`

export async function POST(request: Request, { params }: { params: Promise<{ member: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const { member: memberId } = await params
  const detail = await getMemberDetail(memberId)
  if (!detail) return NextResponse.json({ error: 'No such member' }, { status: 404 })

  const tier = detail.profile.tier as string
  const firstName = (detail.profile.first_name as string | null) ?? null

  if (tier !== 'pro' && tier !== 'elite') {
    return NextResponse.json(
      { error: 'Blueprints are written for Pro and Elite only.' },
      { status: 400 },
    )
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'No ANTHROPIC_API_KEY set' }, { status: 503 })

  const body = (await request.json().catch(() => ({}))) as { notes?: unknown; save?: unknown }
  const notes = typeof body.notes === 'string' ? body.notes.trim() : ''

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('assessment')
    .eq('id', memberId)
    .maybeSingle()

  const assessment = (profile?.assessment ?? {}) as Record<string, unknown>

  /* Saving a blueprint Chris has edited. No model call, no second guess. */
  if (body.save) {
    if (!isBlueprint(body.save)) {
      return NextResponse.json({ error: 'That is not a complete blueprint' }, { status: 400 })
    }
    const issued: Blueprint = { ...(body.save as Blueprint), issuedAt: new Date().toISOString() }
    const { error } = await supabase
      .from('profiles')
      .update({ assessment: { ...assessment, [BLUEPRINT_SLOT]: issued } })
      .eq('id', memberId)
    if (error) return NextResponse.json({ error: 'That did not save' }, { status: 500 })
    return NextResponse.json({ status: 'issued', blueprint: issued })
  }

  if (notes.length < 40) {
    return NextResponse.json(
      { error: 'Add your notes from the call first. Without them this writes itself from a form.' },
      { status: 400 },
    )
  }

  /* --- what the model gets to work from --- */

  const baseline = (assessment.baseline ?? {}) as {
    scores?: Record<string, number>
    answers?: Record<string, number | string | string[]>
  }
  const asked = new Map(questionsOf(BASELINE).map((question) => [question.id, question.text]))

  const lines: string[] = [`Name: ${firstName ?? 'the member'}`, `Product: ${tier}`]

  const style = leadStyle(
    ((assessment.scorecard as { scores?: Record<string, number> } | undefined)?.scores ?? {}),
  )
  if (style) {
    lines.push(
      '',
      `Behavioural style: they lead with ${style.name}. ${style.reads}`,
      'Use this to decide how direct to be and how much to explain. Never name it.',
    )
  }

  const spine = Object.entries(baseline.scores ?? {})
    .sort((a, b) => a[1] - b[1])
    .map(([domain, value]) => `${domain} ${value}`)
    .join(', ')
  if (spine) {
    lines.push('', `Baseline out of 100, lowest first: ${spine}.`)
  }

  const written: string[] = []
  const picked: string[] = []
  for (const [id, value] of Object.entries(baseline.answers ?? {})) {
    const question = asked.get(id)
    if (!question) continue
    if (typeof value === 'string' && value.trim().length > 20) {
      written.push(`${question}\n  "${value.trim()}"`)
    } else if (Array.isArray(value) && value.length) {
      picked.push(`${question} ${value.join('; ')}`)
    } else if (typeof value === 'string') {
      picked.push(`${question} ${value}`)
    }
  }
  if (written.length) lines.push('', 'In their own words:', ...written.map((w) => `- ${w}`))
  if (picked.length) lines.push('', 'What they chose:', ...picked.map((p) => `- ${p}`))

  lines.push('', "Chris's notes from the welcome call:", notes)

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
      system: SYSTEM,
      messages: [{ role: 'user', content: lines.join('\n') }],
    }),
  })

  if (!response.ok) {
    const detailText = await response.text()
    return NextResponse.json(
      { error: `The model refused that (${response.status}).`, detail: detailText.slice(0, 400) },
      { status: 502 },
    )
  }

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] }
  const text = (payload.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim()

  // Asked for JSON, but a stray sentence around it should not lose the draft.
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) {
    return NextResponse.json({ error: 'The model did not return a blueprint' }, { status: 502 })
  }

  let draft: unknown
  try {
    draft = JSON.parse(text.slice(start, end + 1))
  } catch {
    return NextResponse.json({ error: 'The model returned broken JSON' }, { status: 502 })
  }

  if (!isBlueprint(draft)) {
    return NextResponse.json({ error: 'The draft is missing sections' }, { status: 502 })
  }

  /*
   * Never filed from here. It comes back for Chris to read and change, and
   * saving it is a second, deliberate call. A blueprint that arrived in
   * somebody's account without being read by the person whose name is on it
   * would be exactly the thing this is supposed not to be.
   */
  return NextResponse.json({ status: 'drafted', blueprint: draft })
}
