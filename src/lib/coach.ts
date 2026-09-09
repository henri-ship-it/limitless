import { createClient } from '@/lib/supabase/server'
import { supabaseConfigured } from './env'
import { journalEntries } from '@/content/journal'
import { weeks } from '@/content/programme'

/**
 * The numbers behind the coach dashboard.
 *
 * All of it aggregated in TypeScript rather than in the database. The cohort is
 * a couple of dozen people over sixteen weeks, so every table here is small
 * enough to read whole, and a handful of grouped queries through PostgREST
 * would cost more in views and functions than the arithmetic is worth.
 *
 * What is deliberately not here is anything hour by hour. Time is stored a day
 * at a time on purpose, so nothing in this file can reconstruct when somebody
 * was at their desk, only whether the week got read.
 */

export type DayPoint = { day: string; minutes: number; people: number }
export type EntryPoint = { n: number; week: number; title: string; written: number }

/** London's today, which is the day the platform counts in. */
function today(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
}

function daysBack(count: number): string[] {
  const out: string[] = []
  const end = new Date(`${today()}T12:00:00Z`)
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(end.getTime() - i * 24 * 60 * 60 * 1000)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

export async function getCoachData(span = 28) {
  if (!supabaseConfigured) {
    return { days: [] as DayPoint[], entries: [] as EntryPoint[], members: 0, writers: 0 }
  }

  const supabase = await createClient()
  const from = daysBack(span)[0]

  const [{ data: time }, { data: active }, { data: journal }, { data: people }] = await Promise.all([
    supabase.from('member_time').select('day, seconds').gte('day', from),
    supabase.from('member_days').select('member_id, day').gte('day', from),
    supabase.from('member_journal').select('member_id, entry_number'),
    supabase.from('profiles').select('id, is_admin'),
  ])

  /*
   * Admins are excluded from every count. Chris and Henri are on the platform
   * far more than anybody they are measuring, and leaving them in makes a quiet
   * cohort look busy.
   */
  const staff = new Set((people ?? []).filter((p) => p.is_admin).map((p) => p.id))
  const members = (people ?? []).filter((p) => !staff.has(p.id)).length

  const minutes = new Map<string, number>()
  for (const row of time ?? []) {
    minutes.set(row.day, (minutes.get(row.day) ?? 0) + row.seconds)
  }

  const heads = new Map<string, Set<string>>()
  for (const row of active ?? []) {
    if (staff.has(row.member_id)) continue
    const set = heads.get(row.day) ?? new Set<string>()
    set.add(row.member_id)
    heads.set(row.day, set)
  }

  const days: DayPoint[] = daysBack(span).map((day) => ({
    day,
    minutes: Math.round((minutes.get(day) ?? 0) / 60),
    people: heads.get(day)?.size ?? 0,
  }))

  const written = new Map<number, number>()
  const writers = new Set<string>()
  for (const row of journal ?? []) {
    if (staff.has(row.member_id)) continue
    written.set(row.entry_number, (written.get(row.entry_number) ?? 0) + 1)
    writers.add(row.member_id)
  }

  const entries: EntryPoint[] = journalEntries
    .filter((e) => e.week <= weeks.length)
    .map((e) => ({
      n: e.n,
      week: e.week,
      title: e.title ?? `Entry ${e.n}`,
      written: written.get(e.n) ?? 0,
    }))

  return { days, entries, members, writers: writers.size }
}
