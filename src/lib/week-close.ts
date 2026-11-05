import { cache } from 'react'
import { weeks } from '@/content/programme'
import type { EntryData } from '@/content/journal-fields'
import { resolveEntry } from './entry'
import { exerciseAnswers } from './entry-text'
import { createClient } from '@/lib/supabase/server'
import { previewWeek, supabaseConfigured } from './env'

/**
 * What closing a week means, and whether somebody has.
 *
 * The week used to be closed by a tick, in two places that disagreed with each
 * other: a button at the foot of the page that nobody pressed, and a watcher
 * that set the same flag by itself once the digest had been read to the end.
 * The digest lands at the start of the week, so the second one fired on the
 * Sunday, before a single entry existed. A member who read every word and
 * wrote nothing read as finished, and one who wrote all seven entries and
 * never scrolled past the quote read as untouched.
 *
 * The journal already closes the week. Every seventh entry is the huddle: what
 * went well, what did not, what changes. Nobody needs to be asked to confirm
 * work they have just done, so the week is closed by writing that entry and by
 * nothing else.
 */

/** The seven entries belonging to a week, in order. */
export function entryNumbers(week: number): number[] {
  const first = weeks.find((w) => w.number === week)?.firstEntry
  if (!first) return []
  return Array.from({ length: 7 }, (_, i) => first + i)
}

/** The huddle. Writing this is what closes the week. */
export function closingEntry(week: number): number | null {
  const numbers = entryNumbers(week)
  return numbers.length ? numbers[numbers.length - 1] : null
}

/**
 * Whether an entry has been written.
 *
 * The exercise only, which is what `exerciseAnswers` already draws the line
 * around and is already tested. Opening an entry writes a row the moment the
 * autosave fires, and that row carries the day's schedule and the three
 * intentions whether or not anybody answered the question on the page. Counting
 * the row would make looking at an entry indistinguishable from doing it.
 */
export function isWritten(n: number, data: EntryData | null): boolean {
  if (!data) return false
  return exerciseAnswers(n, data).length > 0
}

/**
 * What a save of the huddle should do to the week's tick.
 *
 * A table of two booleans, pulled out of the action because it is the one part
 * of this worth arguing with and the rest is a database call. "Leave" is the
 * case that matters: the cohort already running had its weeks ticked by an
 * older rule that watched people read the digest, so those huddles are blank.
 * Treating a blank save as a retraction would quietly take a member's record
 * off them for typing a line into the schedule.
 */
export function weekTick(wasWritten: boolean, nowWritten: boolean): 'set' | 'clear' | 'leave' {
  if (nowWritten) return 'set'
  return wasWritten ? 'clear' : 'leave'
}

export type WeekEntry = {
  n: number
  /** Day of the week, 1 to 7. */
  day: number
  title: string
  huddle: boolean
  written: boolean
}

export type WeekClose = {
  week: number
  entries: WeekEntry[]
  /** How many of the seven have been written. */
  written: number
  /** Whether the huddle is done, which is the week being closed. */
  closed: boolean
}

/**
 * How far through a week's entries somebody is.
 *
 * One read for the week rather than one per entry. Without credentials every
 * entry reads as unwritten, which is what preview mode shows everywhere else.
 */
export const getWeekClose = cache(async (memberId: string, week: number): Promise<WeekClose> => {
  const numbers = entryNumbers(week)
  const saved = new Map<number, EntryData>()

  if (!supabaseConfigured) return previewClose(week, numbers)

  if (numbers.length) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('member_journal')
      .select('entry_number, data')
      .eq('member_id', memberId)
      .gte('entry_number', numbers[0])
      .lte('entry_number', numbers[numbers.length - 1])

    for (const row of data ?? []) {
      saved.set(row.entry_number as number, row.data as EntryData)
    }
  }

  const entries: WeekEntry[] = numbers.map((n, i) => {
    const entry = resolveEntry(n)
    return {
      n,
      day: i + 1,
      title: entry?.title ?? `Entry ${n}`,
      huddle: i === numbers.length - 1,
      written: isWritten(n, saved.get(n) ?? null),
    }
  })

  return {
    week,
    entries,
    written: entries.filter((e) => e.written).length,
    closed: entries[entries.length - 1]?.written ?? false,
  }
})

/**
 * A plausible week for preview mode, where nothing is saved.
 *
 * Every state at once, which is the point: with no credentials every entry
 * would otherwise read as blank, and the band at the top of the digest has two
 * faces that both need looking at. Weeks before last are closed, last week is
 * five of seven with the huddle still blank, and the week in hand has started.
 *
 * In the same spirit as the stub scores on the Know Thyself chapter, and gone
 * the moment there are credentials to read.
 */
function previewClose(week: number, numbers: number[]): WeekClose {
  const open = previewWeek ?? 1
  const written = (i: number) => {
    if (week < open - 1) return true
    if (week === open - 1) return i < 5
    if (week === open) return i < 2
    return false
  }

  const entries: WeekEntry[] = numbers.map((n, i) => ({
    n,
    day: i + 1,
    title: resolveEntry(n)?.title ?? `Entry ${n}`,
    huddle: i === numbers.length - 1,
    written: written(i),
  }))

  return {
    week,
    entries,
    written: entries.filter((e) => e.written).length,
    closed: entries[entries.length - 1]?.written ?? false,
  }
}
