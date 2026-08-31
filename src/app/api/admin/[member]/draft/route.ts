import { NextResponse } from 'next/server'
import { getMemberDetail, requireAdmin } from '@/lib/admin'
import { since } from '@/lib/format'
import { currentWeek } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'
import { leadStyle } from '@/content/know-thyself'
import { CHRIS, EXAMPLES, LANGUAGE, RESTRAINT, RULES, STYLE_NOTES } from '@/content/voice'

/**
 * Drafts a message to one member, in Chris's voice.
 *
 * The point of this is not to send anything. It is to save the twenty minutes
 * of reading back through somebody's journal before writing to them, and to
 * hand Chris a first draft he can edit. Nothing is sent from here: the draft
 * comes back to the screen and he copies it into WhatsApp or his own mail.
 *
 * What the model gets is a brief built from what the member has actually
 * written, their two assessments and where they are in the programme. What it
 * does not get is permission to invent anything - see RULES in content/voice.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

type Body = { channel?: 'whatsapp' | 'email'; intent?: string }

function brief(detail: NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>): string {
  const { profile, entries, weeksComplete, secondsSpent, arrivals } = detail
  const name = profile.first_name ?? profile.email.split('@')[0]
  const week = currentWeek()
  const chapter = getWeek(week)

  const lines: string[] = [
    `Name: ${name}`,
    `Tier: ${profile.tier === 'pro' ? 'Pro (has the group calls and direct access to Chris)' : 'Core (journal, digests and masterclasses, no group calls)'}`,
    `The cohort is in week ${week} of ${weeks.length}${chapter ? `, the ${chapter.title} chapter` : ''}, and that week is open to them now.`,
    `They have marked ${weeksComplete.length} weeks complete and written ${entries.length} journal entries.`,
    `Last seen on the platform: ${since(profile.last_seen_at)}.`,
    `Time on the platform all told: about ${Math.max(1, Math.round(secondsSpent / 60))} minutes.`,
  ]

  const wrote = entries.at(-1)
  lines.push(
    wrote
      ? `Last wrote something ${since(wrote.updatedAt)}, in entry ${wrote.n}.`
      : 'They have not written anything in the digital journal. They may well be writing in the printed one.',
  )

  const assessment = (profile.assessment ?? {}) as {
    scorecard?: { scores?: Record<string, number>; notes?: Record<string, string> }
    preAssessment?: { scores?: Record<string, number>; notes?: Record<string, string> }
  }

  const style = leadStyle(assessment.scorecard?.scores ?? {})
  if (style) {
    lines.push(
      '',
      `Know Thyself: they lead with ${style.name}. ${style.reads}`,
      `Writing to them: ${STYLE_NOTES[style.name] ?? style.respondsTo}`,
      'This is the strongest steer you have. Let it set the length and the shape of the message, without ever naming it.',
    )
    const scores = Object.entries(assessment.scorecard?.scores ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${v}`)
      .join(', ')
    if (scores) lines.push(`Full spread: ${scores}.`)
  }

  /*
   * The pre-assessment runs to fifty-odd answers, most of them a word or a
   * number. What they wrote at length is the part worth putting in front of a
   * draft; the importance ratings go in as a ranked line rather than a list.
   */
  const preNotes = Object.entries(assessment.preAssessment?.notes ?? {})
  const written = preNotes.filter(([, answer]) => answer.length > 60)
  const ratings = preNotes
    .filter(([, answer]) => /^\d+(\.\d+)?$/.test(answer.trim()))
    .sort((a, b) => Number(b[1]) - Number(a[1]))

  if (written.length) {
    lines.push('', 'What they said in the pre-assessment, in their own words:')
    for (const [question, answer] of written) lines.push(`- ${question} ${answer}`)
  }
  if (ratings.length) {
    lines.push(
      '',
      `What they said matters most, highest first: ${ratings
        .slice(0, 6)
        .map(([question, answer]) => `${question} ${answer}`)
        .join('; ')}`,
    )
  }

  /*
   * Which entries they have been in, and nothing of what is in them.
   *
   * The journal is where somebody writes for themselves. Feeding it to a model
   * produced messages that named the meeting, the colleague and the city, and
   * read as though their diary had been read over their shoulder - which it
   * had. Chris can open an entry himself when he wants to; a draft does not
   * need it, and the message is better without it.
   */
  if (entries.length) {
    const numbers = entries.map((row) => row.n).join(', ')
    lines.push(
      '',
      `They have worked on ${entries.length === 1 ? 'entry' : 'entries'} ${numbers}.`,
      'What they wrote in them is private and is deliberately not here. Do not guess at it.',
    )
  }

  return lines.join('\n')
}

export async function POST(request: Request, { params }: { params: Promise<{ member: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return NextResponse.json(
      { error: 'No API key set. Add ANTHROPIC_API_KEY in Vercel and redeploy.' },
      { status: 503 },
    )
  }

  const { member: id } = await params
  const detail = await getMemberDetail(id)
  if (!detail) return NextResponse.json({ error: 'No such member' }, { status: 404 })

  /*
   * The privacy notice tells members their entries may inform the messages they
   * get, and gives them a switch. If they have turned it off, their writing
   * does not leave the platform - write to them yourself.
   */
  if (!detail.profile.personalised_nudges) {
    return NextResponse.json(
      { error: 'They have turned personalised messages off, so their entries stay here.' },
      { status: 403 },
    )
  }

  const { channel = 'whatsapp', intent = '' }: Body = await request.json().catch(() => ({}))

  const shape =
    channel === 'whatsapp'
      ? 'This is a WhatsApp message. Keep it to four to six lines, no subject line, no sign-off.'
      : 'This is an email. Slightly longer is fine, up to about ten lines. Give it a short subject line on the first line, prefixed "Subject: ", then a blank line, then the message, ending with "Chris" on its own line.'

  const system = [CHRIS, RULES, RESTRAINT, LANGUAGE, EXAMPLES].join('\n\n')

  const prompt = [
    'Here is what is known about the member. Everything in it is real; anything not in it, you do not know.',
    '',
    brief(detail),
    '',
    shape,
    intent.trim()
      ? `Chris wants this message to do the following: ${intent.trim()}`
      : 'Chris has not said what he wants the message to do. Pick the one thing most worth saying to this person this week, based on the brief.',
    '',
    'Reply with JSON only, no other text, in this shape:',
    '{"angle": "one short line telling Chris why you took this approach", "message": "the message itself"}',
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
      max_tokens: 1200,
      system,
      messages: [{ role: 'user', content: prompt }],
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
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1)) as { angle?: string; message?: string }
      if (parsed.message) {
        return NextResponse.json({ message: plainDashes(parsed.message.trim()), angle: parsed.angle ?? '' })
      }
    } catch {
      // Fall through and hand back whatever came out.
    }
  }

  return NextResponse.json({ message: plainDashes(text), angle: '' })
}

/**
 * Takes the em and en dashes out, whatever the draft came back with.
 *
 * The rule is in the voice guide, and a model will still reach for one now and
 * then. Asking twice is cheaper than a dash going out over Chris's name, so
 * this is the belt to that braces.
 */
function plainDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ' - ')
}
