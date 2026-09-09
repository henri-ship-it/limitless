import { NextResponse } from 'next/server'
import { getMemberDetail, requireAdmin } from '@/lib/admin'
import { since } from '@/lib/format'
import { currentWeek } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'
import { leadStyle } from '@/content/know-thyself'
import { coreValues, exerciseAnswers } from '@/lib/entry-text'
import { resolveEntry } from '@/lib/entry'
import type { EntryData } from '@/content/journal-fields'
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

/*
 * How far back to read. Enough for a thread to show, few enough that this week
 * is not buried under sixteen. A check in is about where somebody is now.
 */
const RECENT_ENTRIES = 12

/** Where the two values are settled on. */
const VALUES_ENTRY = 8

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

type Length = 'short' | 'standard' | 'long'

type Body = {
  channel?: 'whatsapp' | 'email'
  intent?: string
  length?: Length
  /** The draft on screen, when Chris wants it changed rather than replaced. */
  current?: string
  /** What he wants changed about it. */
  change?: string
}

/*
 * Length as a range rather than a number of words. A message told to be exactly
 * eighty words pads to eighty; a message told to be short is short.
 */
const LENGTHS: Record<Length, { whatsapp: string; email: string }> = {
  short: {
    whatsapp: 'Two or three lines. One thought, said once.',
    email: 'Four or five lines. One thought, said once.',
  },
  standard: {
    whatsapp: 'Four to six lines.',
    email: 'Up to about ten lines.',
  },
  long: {
    whatsapp: 'Eight to twelve lines. Still a message, not an essay.',
    email: 'Up to about eighteen lines. Room for two thoughts, not five.',
  },
}

function brief(detail: NonNullable<Awaited<ReturnType<typeof getMemberDetail>>>): string {
  const { profile, entries, weeksComplete, secondsSpent, arrivals, conversations } = detail
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
   * The values they settled on, which is the one answer most likely to be
   * quoted back and so the one that must not be wrong. Read from the two they
   * narrowed to, never from the long list they ticked on the way there.
   */
  const valuesRow = entries.find((row) => row.n === VALUES_ENTRY)
  const values = valuesRow ? coreValues(valuesRow.data as EntryData) : []
  if (values.length) {
    lines.push('', `The values they chose for themselves: ${values.join(' and ')}.`)
  }

  /*
   * What they have written, newest first, and only the exercise.
   *
   * Withholding this produced the opposite of the restraint it was meant to
   * buy. With nothing real to work from the model invented, and told a member
   * his values were two words he had never chosen. A draft has to be built on
   * what somebody actually said or it is fiction, however carefully worded.
   *
   * What was wrong before was reciting it back. That is a rule about how to use
   * this, not a reason to withhold it, and the rule lives in content/voice.
   */
  const recent = [...entries].sort((a, b) => b.n - a.n).slice(0, RECENT_ENTRIES)
  if (recent.length) {
    lines.push('', 'What they have written, newest first. This matters more than anything else here.')
    for (const row of recent) {
      const answers = exerciseAnswers(row.n, row.data as EntryData)
      if (!answers.length) continue
      const entry = resolveEntry(row.n)
      lines.push('', `Entry ${row.n}${entry?.title ? `, ${entry.title}` : ''}:`)
      for (const answer of answers) lines.push(`- ${answer.label}: ${answer.text}`)
    }
    const older = entries.length - recent.length
    if (older > 0) lines.push('', `There are ${older} earlier entries not shown here.`)
  }

  /*
   * The 1:1s, which sit on the opposite side of the line from the journal.
   *
   * The journal is somebody writing to themselves, and quoting it back reads as
   * having been watched. A call is a conversation Chris was actually in, so
   * remembering it is the ordinary courtesy of having listened. It is the one
   * personal thing in this brief, and the most useful.
   */
  const call = conversations[0]
  if (call?.notes) {
    const { motivation, communication, goals, life, quotes } = call.notes
    lines.push('', `From the 1:1 on ${call.happened_on}:`)
    if (motivation) lines.push(`What moves them: ${motivation}`)
    if (communication) lines.push(`How to talk to them: ${communication}`)
    if (goals?.length) lines.push(`Working towards: ${goals.join('; ')}.`)
    if (life?.length) lines.push(`Worth remembering: ${life.join('; ')}.`)
    if (quotes?.length) lines.push(`Things they said: ${quotes.map((q) => `"${q}"`).join(' ')}`)
    lines.push(
      'Use this. It is the difference between a message to a member and a message to a person.',
      'At most one reference to their own life, dropped in as an aside rather than made the subject. Asking after the daughter by name once is warm; building the message around her is not.',
      'Never quote the call back at them, and never say that Chris made notes on it.',
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

  const {
    channel = 'whatsapp',
    intent = '',
    length = 'standard',
    current = '',
    change = '',
  }: Body = await request.json().catch(() => ({}))

  const size = LENGTHS[length] ?? LENGTHS.standard
  const shape =
    channel === 'whatsapp'
      ? `This is a WhatsApp message. ${size.whatsapp} No subject line, no sign-off.`
      : `This is an email. ${size.email} Give it a short subject line on the first line, prefixed "Subject: ", then a blank line, then the message, ending with "Chris" on its own line.`

  const system = [CHRIS, RULES, RESTRAINT, LANGUAGE, EXAMPLES].join('\n\n')

  /*
   * Revising is a different job from writing, and asking for a rewrite with an
   * extra instruction gets a different message rather than the same one with a
   * change made. Chris has usually already edited the draft by hand by this
   * point, so anything he did not ask about has to survive untouched.
   */
  const revising = Boolean(current.trim() && change.trim())

  const task = revising
    ? [
        'Chris has a draft in front of him and wants one thing about it changed.',
        '',
        'The draft as it stands:',
        current.trim(),
        '',
        `What he wants different: ${change.trim()}`,
        '',
        'Return the same message with that change made and nothing else altered. Keep every line he has not asked about word for word, including any edits of his own. Do not take the opportunity to improve anything else.',
        shape,
      ].join('\n')
    : [
        shape,
        intent.trim()
          ? `Chris wants this message to do the following: ${intent.trim()}`
          : 'Chris has not said what he wants the message to do. Pick the one thing most worth saying to this person this week, based on the brief.',
      ].join('\n')

  const prompt = [
    'Here is what is known about the member. Everything in it is real; anything not in it, you do not know.',
    '',
    brief(detail),
    '',
    task,
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
      max_tokens: 2500,
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
        return NextResponse.json({
          message: plainDashes(parsed.message.trim()),
          angle: parsed.angle ?? '',
        })
      }
    } catch {
      // Fall through to salvage.
    }
  }

  /*
   * A reply cut off mid-string has no closing brace, so it will not parse, and
   * handing back the raw text put a wall of {"angle": ... in the box Chris is
   * meant to read. Pull the message out by hand instead: a draft missing its
   * last sentence is still a draft, and he can see that it is short.
   */
  const salvaged = salvage(text)
  if (salvaged) return NextResponse.json({ message: plainDashes(salvaged), angle: '' })

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

/** The message out of a JSON reply that did not finish. Null when there is none. */
function salvage(text: string): string | null {
  const at = text.search(/"message"\s*:\s*"/)
  if (at === -1) return null

  const from = text.indexOf('"', text.indexOf(':', at)) + 1
  let out = ''
  for (let i = from; i < text.length; i += 1) {
    const c = text[i]
    if (c === '\\') {
      const next = text[i + 1]
      // \u0027 and friends: models reach for them on apostrophes and quotes.
      if (next === 'u') {
        const code = text.slice(i + 2, i + 6)
        if (/^[0-9a-fA-F]{4}$/.test(code)) {
          out += String.fromCharCode(parseInt(code, 16))
          i += 5
          continue
        }
      }
      out += next === 'n' ? '\n' : next === 't' ? '\t' : (next ?? '')
      i += 1
      continue
    }
    // An unescaped quote ends the string, whether or not the reply got that far.
    if (c === '"') break
    out += c
  }

  return out.trim() || null
}
