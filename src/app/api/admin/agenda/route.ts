import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { currentWeek } from '@/lib/cohort'
import { getWeek, weeks } from '@/content/programme'
import { resolveEntry } from '@/lib/entry'
import { entriesForWeek } from '@/content/journal'
import { exerciseAnswers } from '@/lib/entry-text'
import { CHRIS, LANGUAGE } from '@/content/voice'
import type { EntryData } from '@/content/journal-fields'

/**
 * Builds the agenda for a call from what the cohort has actually written.
 *
 * Chris walks into the Wednesday drop-in having read what he has had time to
 * read, which some weeks is everything and some weeks is nothing. This reads
 * the week for him and comes back with what is worth raising: what several
 * people are circling, where the chapter has landed, and where it has not.
 *
 * Written without names, and that is not squeamishness. An agenda is a list of
 * things to put to a room, and the moment one carries "Felix said" it stops
 * being an agenda and becomes a briefing on individuals to be read out to them.
 * Counts do the work instead: four people writing about the same difficulty is
 * a thing to raise, and nobody has to be identified for Chris to raise it.
 *
 * The private half of that job already exists on each member's own page, where
 * a message can be drafted to one person with everything known about them.
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
  const cohort = (people ?? []).filter(
    (p) => !p.is_admin && (audience === 'all' || p.tier === 'pro'),
  )
  const ids = cohort.map((p) => p.id)
  if (!ids.length) return NextResponse.json({ error: 'Nobody in that group yet.' }, { status: 400 })

  const { data: journal } = await supabase
    .from('member_journal')
    .select('member_id, entry_number, data')
    .in('member_id', ids)
    .order('entry_number', { ascending: false })

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
  for (const rows of byMember.values()) {
    if (!rows?.length) continue
    writing += 1
    for (const row of rows) {
      const answers = exerciseAnswers(row.entry_number, row.data as EntryData)
      if (!answers.length) continue
      const entry = resolveEntry(row.entry_number)
      lines.push(`Someone, entry ${row.entry_number}${entry?.title ? `, ${entry.title}` : ''}:`)
      for (const answer of answers) lines.push(`- ${answer.label}: ${answer.text}`)
      lines.push('')
    }
  }

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
      ? [
          'This is the monthly workshop: ninety minutes, live, taught as well as discussed.',
          'Give it four or five parts with a rough number of minutes against each, opening with what the month has actually thrown up rather than with a recap of the chapter.',
        ].join('\n')
      : [
          'This is the Wednesday drop-in: half an hour, informal, no teaching.',
          'Give it three or four things to raise, in the order to raise them, with a line on why each one is worth the room\'s time this week. Half an hour goes quickly, so anything that would take twenty minutes on its own does not belong here.',
        ].join('\n')

  const prompt = [
    `Week ${n} of ${weeks.length} is "${chapter.title}". This week's entries are ${thisWeek}.`,
    `${cohort.length} people in this group, ${writing} of whom have written something.`,
    '',
    'Here is what they have written, most recent first. Every entry is attributed to "Someone" on purpose: you do not know who wrote what and must not guess.',
    '',
    ...lines.slice(0, 400),
    '',
    shape,
    intent.trim() ? `Chris also wants to cover: ${intent.trim()}` : '',
    '',
    'Rules:',
    '- Work from what is actually written. If two people circled the same difficulty, say so and say how many. If something is only one person, it is not an agenda item for a group call.',
    '- Never name anybody, never quote a sentence, and never use a proper noun taken from an entry. Chris has to be able to read this aloud without anyone recognising themselves against their will.',
    '- Say plainly where the chapter has not landed. An agenda that reports everything going well is no use to anybody.',
    '- Never use an em dash or an en dash.',
    '',
    'Reply with JSON only, no other text:',
    '{"headline": "one line on where the group is this week", "items": [{"title": "short", "minutes": 8, "why": "one or two sentences", "ask": "the question Chris opens it with"}], "watch": ["anything worth noticing that is not an agenda item"]}',
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
      max_tokens: 2500,
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
  if (start === -1 || end <= start) {
    return NextResponse.json({ error: 'That came back unreadable. Try again.' }, { status: 502 })
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1))
    return NextResponse.json({ agenda: parsed, week: n, writing, of: cohort.length })
  } catch {
    return NextResponse.json({ error: 'That came back unreadable. Try again.' }, { status: 502 })
  }
}
