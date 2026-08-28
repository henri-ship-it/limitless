import { NextResponse } from 'next/server'
import { getMemberDetail, requireAdmin } from '@/lib/admin'
import { resolveEntry } from '@/lib/entry'
import { HUDDLE_QUESTIONS } from '@/content/entry-fields'
import { SCHEDULE_HOURS, type EntryData } from '@/content/journal-fields'
import { getWeek } from '@/content/programme'

/** Everything one member has written, as markdown. Admins only. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ member: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const { member: id } = await params
  const detail = await getMemberDetail(id)
  if (!detail) return NextResponse.json({ error: 'No such member' }, { status: 404 })

  const { profile, entries, weeksComplete, totalWeeks } = detail
  const name = profile.first_name ?? profile.email.split('@')[0]

  const lines: string[] = [
    `# ${name}`,
    '',
    `${profile.email} · ${profile.tier}`,
    `${weeksComplete.length} of ${totalWeeks} weeks marked complete · ${entries.length} entries written`,
    '',
  ]

  let week = 0
  for (const row of entries) {
    if (row.week !== week) {
      week = row.week
      const w = getWeek(week)
      lines.push('', `## Week ${week}${w ? `: ${w.title}` : ''}`, '')
    }

    const entry = resolveEntry(row.n)
    const data = row.data as EntryData
    lines.push(`### Entry ${row.n}: ${entry?.title ?? ''}`.trimEnd(), '')

    const intentions = (data.intentions ?? []).filter(Boolean)
    if (intentions.length) {
      lines.push('**Intentions**', '')
      intentions.forEach((t, i) => lines.push(`- ${data.intentionsDone?.[i] ? '[x]' : '[ ]'} ${t}`))
      lines.push('')
    }

    for (const block of data.blocks ?? []) {
      if (!block.label) continue
      const from = SCHEDULE_HOURS[block.start] ?? ''
      const to = SCHEDULE_HOURS[Math.min(block.end + 1, SCHEDULE_HOURS.length - 1)] ?? ''
      lines.push(`- Scheduled ${from} to ${to}: ${block.label}`)
    }

    const achievements = (data.achievements ?? []).filter(Boolean)
    if (achievements.length) lines.push('', '**Achievements**', '', ...achievements.map((a) => `- ${a}`), '')

    for (const [key, label] of [
      ['win', 'One win'],
      ['mind', 'On their mind'],
      ['grateful', 'Grateful for'],
    ] as const) {
      if (data[key]) lines.push(`**${label}**`, '', data[key] as string, '')
    }

    ;(data.huddle ?? []).forEach((answer, i) => {
      if (answer) lines.push(`**${HUDDLE_QUESTIONS[i] ?? 'Huddle'}**`, '', answer, '')
    })

    if (data.values?.length) lines.push('**Values chosen**', '', data.values.join(', '), '')

    for (const [key, value] of Object.entries(data.fields ?? {})) {
      if (!value) continue
      const index = Number(key)
      const field = Number.isInteger(index) ? entry?.fields[index] : undefined
      const label = field && field.kind !== 'note' && field.kind !== 'group' ? field.label : 'Answer'
      lines.push(`**${label}**`, '')
      lines.push(Array.isArray(value) ? value.filter(Boolean).map((v) => `- ${v}`).join('\n') : value)
      lines.push('')
    }
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="limitless-${slug}.md"`,
    },
  })
}
