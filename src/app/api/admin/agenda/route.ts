import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { currentWeek } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'
import { resolveEntry } from '@/lib/entry'
import { entriesForWeek } from '@/content/journal'
import { exerciseAnswers } from '@/lib/entry-text'
import { CHRIS, LANGUAGE } from '@/content/voice'
import { leadStyle } from '@/content/know-thyself'
import type { EntryData } from '@/content/journal-fields'

/**
 * Builds the agenda for a call from what the cohort has actually written.
 *
 * Chris walks into the Wednesday drop-in having read what he has had time to
 * read, which some weeks is everything and some weeks is nothing. This reads
 * the week for him and comes back with what is worth raising: what several
 * people are circling, where the chapter has landed, and where it has not.
 *
 * Names throughout. This was built anonymous at first, on the reasoning that an
 * agenda carrying a name becomes a briefing on individuals. That was the wrong
 * call: it is a coach's own notes for his own cohort, read by nobody else, and
 * stripping the names only made him work out who was who from the description.
 * What he does with a name in the room is his judgement, not the platform's.
 *
 * Two halves. The agenda is for the room and is short, because half an hour of
 * anything is four things at most. The read is per person, in bullets, and is
 * where the detail goes: where they are, what the entries show, and how that
 * sits against the style they came out as.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const ENDPOINT = 'https://api.anthropic.com/v1/messages'

/** How many entries per member to read. One week's worth, plus the huddle. */
const PER_MEMBER = 8

type Kind = 'dropin' | 'workshop'
type Body = { kind?: Kind; audience?: 'pro' | 'all'; week?: number; intent?: string }

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json({ error: 'No API key set.' }, { status: 503 })

  const {
    kind = 'dropin',
    audience = 'pro',
    week: asked,
    intent = '',
  }: Body = await request.json().catch(() => ({}))

  const n = Number.isInteger(asked) && asked! > 0 ? asked! : Math.max(1, currentWeek())
  const chapter = getWeek(n)
  if (!chapter) return NextResponse.json({ error: 'No such week' }, { status: 404 })

  const supabase = await createClient()

  const { data: people } = await supabase
    .from('profiles')
    .select('id, first_name, tier, is_admin, assessment')
  /*
   * Elite is never in a sixteen week call. Their entries are numbered against
   * a different journal running to three hundred and thirty six, so an agenda
   * that swept them in would be reading someone else's month against this
   * week's chapter and reporting the mismatch as a member falling behind.
   */
  const cohort = (people ?? []).filter((p) => {
    if (p.is_admin || p.tier === 'elite') return false
    return audience === 'all' || p.tier === 'pro'
  })
  const ids = cohort.map((p) => p.id)
  if (!ids.length) return NextResponse.json({ error: 'Nobody in that group yet.' }, { status: 400 })

  const { data: journal } = await supabase
    .from('member_journal')
    .select('member_id, entry_number, data, updated_at')
    .in('member_id', ids)
    .order('entry_number', { ascending: false })

  const named = new Map(cohort.map((p) => [p.id, p.first_name ?? 'Someone']))

  /*
   * Grouped by person, then flattened without them. The grouping is only so
   * that one prolific member does not fill the whole sample and get mistaken
   * for a pattern across the room.
   */
  const byMember = new Map<string, typeof journal>()
  for (const row of journal ?? []) {
    const list = byMember.get(row.member_id) ?? []
    if (list.length < PER_MEMBER) list.push(row)
    byMember.set(row.member_id, list)
  }

  const lines: string[] = []
  let writing = 0
  for (const [id, rows] of byMember.entries()) {
    if (!rows?.length) continue
    writing += 1

    const person = cohort.find((p) => p.id === id)
    const name = named.get(id) ?? 'Someone'
    const assessment = (person?.assessment ?? {}) as {
      scorecard?: { scores?: Record<string, number> }
    }
    const style = leadStyle(assessment.scorecard?.scores ?? {})

    lines.push(
      `### ${name}${style ? ` (leads with ${style.name}: ${style.reads})` : ''}`,
      `Has written entries ${rows.map((r) => r.entry_number).sort((a, b) => a - b).join(', ')}.`,
      '',
    )

    for (const row of rows) {
      const answers = exerciseAnswers(row.entry_number, row.data as EntryData)
      if (!answers.length) continue
      const entry = resolveEntry(row.entry_number)
      lines.push(`${name}, entry ${row.entry_number}${entry?.title ? `, ${entry.title}` : ''}:`)
      for (const answer of answers) lines.push(`- ${answer.label}: ${answer.text}`)
      lines.push('')
    }
  }

  const quiet = cohort
    .filter((p) => !byMember.get(p.id)?.length)
    .map((p) => p.first_name ?? 'someone')

  if (!lines.length) {
    return NextResponse.json(
      { error: 'Nobody in that group has written anything yet, so there is nothing to read.' },
      { status: 400 },
    )
  }

  const thisWeek = entriesForWeek(n)
    .map((e) => {
      const entry = resolveEntry(e.n)
      return `${e.n}${entry?.title ? ` ${entry.title}` : ''}`
    })
    .join(', ')

  const shape =
    kind === 'workshop'
      ? 'This is the monthly workshop: ninety minutes, live, taught as well as discussed. Four or five items.'
      : 'This is the Wednesday drop-in: half an hour, informal, no teaching. Three items, four at the very most.'

  const prompt = [
    `Week ${n} of ${weeks.length} is "${chapter.title}". This week's entries are ${thisWeek}.`,
    `${cohort.length} people in this group. ${writing} have written something.`,
    quiet.length ? `Nothing at all from: ${quiet.join(', ')}.` : '',
    '',
    'Here is what each of them has written, by person, newest entry first.',
    '',
    ...lines.slice(0, 500),
    '',
    shape,
    intent.trim() ? `Chris also wants to cover: ${intent.trim()}` : '',
    '',
    'Two things are wanted, and they are different jobs.',
    '',
    'THE AGENDA is for the room. Short. Each item is a title, a rough number of minutes, ONE sentence saying why it is worth the time and who it is for by name, and the question Chris opens it with. One sentence means one sentence. Do not restate the entries back; Chris has read them in the second half of this.',
    '',
    'THE READ is per person, and is where the detail goes. For each person who has written, give their name, the entry they are up to, and two to four short bullets. Bullets are notes to himself, not prose: what the writing actually shows, the pattern under it, and how that sits against the style they came out as. Name the mechanism where there is one worth naming, in plain words rather than jargon. Be specific and be willing to say something uncomfortable if it is what the entries show.',
    '',
    'Rules:',
    '- Use their names. These are Chris\'s own notes on his own cohort and nobody else reads them.',
    '- Work only from what is written. Never invent a motive, a diagnosis or an event.',
    '- Say plainly where the chapter has not landed, and who has not started.',
    '- No em dashes, no en dashes, no semicolons.',
    '',
    'Reply with JSON only, no other text:',
    '{"headline": "one line on where the group is", "items": [{"title": "short", "minutes": 8, "why": "one sentence, naming who", "ask": "the question Chris opens with"}], "read": [{"name": "their name", "at": "entry 12, or not started", "notes": ["short bullet", "short bullet"]}], "watch": ["at most three things that belong in a private message rather than the call"]}',
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
      max_tokens: 4000,
      system: [CHRIS, LANGUAGE].join('\n\n'),
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: `The model would not do that (${response.status}).` },
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
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1))
      return NextResponse.json({ agenda: parsed, week: n, writing, of: cohort.length })
    } catch {
      // Fall through, with the reply attached so the reason is visible.
    }
  }

  return NextResponse.json(
    {
      error: 'That came back unreadable. Try again.',
      detail: text.slice(0, 400),
    },
    { status: 502 },
  )
}
