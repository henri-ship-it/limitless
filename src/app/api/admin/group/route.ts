import { NextResponse } from 'next/server'
import { getCohort, requireAdmin } from '@/lib/admin'
import { currentWeek } from '@/lib/cohort'
import { getWeek, modules, weeks } from '@/content/programme'
import { digests } from '@/content/digests'
import { CHRIS, GROUP_EXAMPLES, GROUP_RULES, LANGUAGE, RESTRAINT, RULES } from '@/content/voice'

/**
 * Drafts the Pro group message that opens or closes a week.
 *
 * The same idea as drafting to one member, with the opposite constraint: this
 * one goes to everybody, so nothing individual may reach it. The model is given
 * the chapter and the mood of the group, never a name and never a line anybody
 * wrote. What it cannot say is as much the point as what it can.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

type Body = { moment?: 'open' | 'close'; week?: number; intent?: string }

/** The digest for a week, flattened to something readable in a prompt. */
function digestFor(week: number): string {
  const digest = digests.find((d) => d.week === week)
  if (!digest) return ''

  return digest.nodes
    .map((node) => {
      if (node.type === 'ul') return node.items.map((item) => `- ${item}`).join('\n')
      if (node.type === 'h' || node.type === 'sub') return `\n${node.text}`
      return node.text
    })
    .join('\n')
    .slice(0, 4000)
}

export async function POST(request: Request) {
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

  const { moment = 'open', week: asked, intent = '' }: Body = await request
    .json()
    .catch(() => ({}))

  const n = Number.isInteger(asked) && asked! > 0 ? asked! : Math.max(1, currentWeek())
  const chapter = getWeek(n)
  if (!chapter) return NextResponse.json({ error: 'No such week' }, { status: 404 })

  const module_ = modules.find((m) => m.number === chapter.module)
  const cohort = await getCohort()

  /*
   * Aggregate only, and never quoted back at them. This is here so a message
   * closing a quiet week does not read as though it closed a busy one, which is
   * the sort of thing anyone running a group would notice without being told.
   */
  const pro = cohort.members.filter((m) => m.tier === 'pro' && !m.isAdmin)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const active = pro.filter((m) => m.lastSeenAt && Date.parse(m.lastSeenAt) > weekAgo).length
  const writing = pro.filter((m) => m.lastWroteAt && Date.parse(m.lastWroteAt) > weekAgo).length

  const mood =
    pro.length === 0
      ? 'There is nobody on Pro yet.'
      : `Of ${pro.length} Pro members, ${active} have been in this week and ${writing} have written something. Treat this as the temperature of the room and nothing more: never mention a number, a name, or anything anyone wrote.`

  const shape =
    moment === 'open'
      ? [
          `Write the message that opens week ${n} in the Pro WhatsApp group.`,
          'It sets up the chapter: what it is about, why it matters now, and what they will get out of the week. Six to twelve lines. No bullets of prompts - that is the closing message, not this one.',
        ].join('\n')
      : [
          `Write the message that closes week ${n} in the Pro WhatsApp group.`,
          `Use his established format: "*${chapter.title} - What Landed?*" on the first line, a line or two acknowledging the week, then the three prompts with their emoji - 💡 Biggest insight, 🏆 Biggest win, ⚡ Biggest breakthrough - each ending in a question specific to this chapter, not a generic one.`,
        ].join('\n')

  const prompt = [
    `Week ${n} of ${weeks.length} is "${chapter.title}", in module ${chapter.module}${module_ ? ` (${module_.name})` : ''}.`,
    chapter.topic ? `The framework it teaches: ${chapter.topic}.` : 'This is a deload week.',
    '',
    'How the chapter opens in the printed journal:',
    ...chapter.opening,
    '',
    chapter.quote ? `Its quotation: "${chapter.quote.text}" — ${chapter.quote.author}` : '',
    '',
    'The weekly digest members receive for this chapter:',
    digestFor(n) || '(no digest written for this week)',
    '',
    mood,
    '',
    shape,
    intent.trim() ? `Chris also wants this message to: ${intent.trim()}` : '',
    '',
    'Reply with JSON only, no other text, in this shape:',
    '{"angle": "one short line telling Chris why you took this approach", "message": "the message itself"}',
  ]
    .filter(Boolean)
    .join('\n')

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: [CHRIS, RULES, RESTRAINT, GROUP_RULES, LANGUAGE, GROUP_EXAMPLES].join('\n\n'),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    return NextResponse.json(
      { error: `The model refused that (${response.status}).`, detail: detail.slice(0, 400) },
      { status: 502 },
    )
  }

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] }
  const text = (payload.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim()

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
      // Fall through and hand back whatever came out.
    }
  }

  return NextResponse.json({ message: plainDashes(text), angle: '' })
}

/** Em and en dashes never go out over Chris's name, however the draft returns. */
function plainDashes(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ' - ')
}
