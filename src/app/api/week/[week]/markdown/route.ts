import { NextResponse } from 'next/server'
import { getMember } from '@/lib/member'
import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from '@/lib/env'
import { getWeek, moduleForWeek } from '@/content/programme'
import { entriesForWeek } from '@/content/journal'
import { resolveEntry } from '@/lib/entry'
import { HUDDLE_QUESTIONS } from '@/content/entry-fields'
import { SCHEDULE_HOURS, type EntryData } from '@/content/journal-fields'
import { customExercise } from '@/content/entry-extras'
import { isUnlocked } from '@/lib/cohort'

/**
 * A member's week, as markdown they can keep.
 *
 * Only ever their own: the rows are read through their session, so row level
 * security means this cannot return anyone else's writing even if the week
 * number is changed by hand.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ week: string }> },
) {
  const { week: weekParam } = await params
  const weekNumber = Number(weekParam)
  const week = getWeek(weekNumber)
  if (!week) return NextResponse.json({ error: 'No such week' }, { status: 404 })

  const member = await getMember()
  if (!member) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!isUnlocked(weekNumber)) {
    return NextResponse.json({ error: 'That week has not opened yet' }, { status: 403 })
  }

  const entries = entriesForWeek(weekNumber)
  const saved = new Map<number, EntryData>()

  if (supabaseConfigured) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('member_journal')
      .select('entry_number, data')
      .in(
        'entry_number',
        entries.map((e) => e.n),
      )
    for (const row of data ?? []) saved.set(row.entry_number, row.data as EntryData)
  }

  const module = moduleForWeek(weekNumber)!
  const lines: string[] = [
    `# Week ${weekNumber}: ${week.title}`,
    '',
    `Module ${String(module.number).padStart(2, '0')}, ${module.name}${week.topic ? ` · ${week.topic}` : ''}`,
    '',
  ]

  for (const raw of entries) {
    const entry = resolveEntry(raw.n)!
    const data = saved.get(raw.n) ?? {}
    lines.push(`## ${entry.huddle ? 'Huddle' : `Day ${entry.day}`}: ${entry.title}`, '')

    if (entry.huddle) {
      HUDDLE_QUESTIONS.forEach((question, i) => {
        lines.push(`**${question}**`, '', data.huddle?.[i] || '_Not answered_', '')
      })
    } else {
      const intentions = (data.intentions ?? []).filter(Boolean)
      if (intentions.length) {
        lines.push('**Intentions**', '')
        intentions.forEach((text, i) => {
          lines.push(`- ${data.intentionsDone?.[i] ? '[x]' : '[ ]'} ${text}`)
        })
        lines.push('')
      }

      const blocks = data.blocks ?? []
      if (blocks.length) {
        lines.push('**Schedule**', '')
        for (const block of blocks) {
          const from = SCHEDULE_HOURS[block.start]
          const to = SCHEDULE_HOURS[Math.min(block.end + 1, SCHEDULE_HOURS.length - 1)]
          lines.push(`- ${from} to ${to}: ${block.label}`)
        }
        lines.push('')
      }

      const achievements = (data.achievements ?? []).filter(Boolean)
      if (achievements.length) {
        lines.push('**Achievements**', '', ...achievements.map((a) => `- ${a}`), '')
      }

      for (const [key, label] of [
        ['win', 'One win of your day'],
        ['mind', 'One thing on your mind'],
        ['grateful', 'One thing you are grateful for'],
      ] as const) {
        const value = data[key]
        if (value) lines.push(`**${label}**`, '', value, '')
      }
    }

    const custom = customExercise(raw.n)
    if (custom) {
      if (data.values?.length) {
        lines.push('**Values selected**', '', data.values.join(', '), '')
      }
      custom.fields.forEach((label, i) => {
        const value = data.fields?.[`custom.${i}`]
        if (value) lines.push(`**${label}**`, '', String(value), '')
      })
    } else {
      entry.fields.forEach((field, i) => {
        if (field.kind === 'note' || field.kind === 'group') return
        const value = data.fields?.[String(i)]
        if (!value || (Array.isArray(value) && !value.filter(Boolean).length)) return
        lines.push(`**${field.label}**`, '')
        lines.push(Array.isArray(value) ? value.filter(Boolean).map((v) => `- ${v}`).join('\n') : value)
        lines.push('')
      })
    }
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="limitless-week-${String(weekNumber).padStart(2, '0')}.md"`,
    },
  })
}
