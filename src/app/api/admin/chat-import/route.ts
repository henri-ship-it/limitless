import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'
import { matchSpeaker } from '@/lib/speakers'
import { parseChatExport } from '@/lib/whatsapp-export'

/**
 * Takes a WhatsApp group export and files each message against its sender.
 *
 * This is an import rather than a connection, and that is a limit of WhatsApp
 * rather than a shortcut. Meta's Groups API exists, but it needs the number
 * moved off the Business app onto the Cloud API, an Official Business Account,
 * and the group rebuilt through an invite link, which loses everything already
 * in it. Exporting the chat is the only way to read a group that already
 * exists, and it hands over a text file.
 *
 * The whole history arrives every time, so the same file lands again next week
 * with more on the end. Everything is therefore fingerprinted and upserted, and
 * running the same import twice changes nothing.
 */

const MAX_FILE = 4_000_000

/** Stable across re-imports: the same message always hashes the same way. */
function fingerprint(sentOn: string, sender: string, body: string): string {
  return createHash('sha256').update(`${sentOn}|${sender}|${body}`).digest('hex').slice(0, 32)
}

type Body = { file?: string }

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 404 })
  }

  const { file = '' }: Body = await request.json().catch(() => ({}))
  if (!file.trim()) {
    return NextResponse.json({ error: 'Nothing to import.' }, { status: 400 })
  }
  if (file.length > MAX_FILE) {
    return NextResponse.json({ error: 'That export is too large.' }, { status: 413 })
  }

  const messages = parseChatExport(file)
  if (!messages.length) {
    return NextResponse.json(
      {
        error:
          'No messages found in that. It should be the .txt file from WhatsApp, Export chat, without media.',
      },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  /*
   * Admins are left out because Chris is in the group and is not a member of
   * it, and anybody who has turned personalised messages off is left out
   * because this is the kind of thing that switch is for.
   */
  const { data: people } = await supabase
    .from('profiles')
    .select('id, first_name, recording_name, is_admin, personalised_nudges')

  const members = (people ?? [])
    .filter((p) => !p.is_admin && p.personalised_nudges)
    .map((p) => ({ id: p.id, firstName: p.first_name, recordingName: p.recording_name }))

  /*
   * Senders are resolved once rather than per message. A busy group is
   * thousands of lines from the same handful of people, and matching each of
   * them separately would be the same answer several thousand times.
   */
  const senders = [...new Set(messages.map((m) => m.sender))]
  const owner = new Map<string, string>()
  const unmatched: string[] = []

  for (const sender of senders) {
    const member = matchSpeaker(sender, members)
    if (member) owner.set(sender, member.id)
    else unmatched.push(sender)
  }

  const rows = messages
    .filter((m) => owner.has(m.sender))
    .map((m) => ({
      member_id: owner.get(m.sender)!,
      sent_on: m.sentOn,
      sender: m.sender,
      body: m.text,
      source: 'whatsapp',
      fingerprint: fingerprint(m.sentOn, m.sender, m.text),
    }))

  if (!rows.length) {
    return NextResponse.json({
      ok: true,
      stored: 0,
      unmatched,
      note: 'Nobody in that export matched a member. Check their name on the chat against the one on their profile.',
    })
  }

  /*
   * In batches, because an export of a year old group is tens of thousands of
   * rows and one statement that size is refused rather than slow.
   */
  let stored = 0
  for (let i = 0; i < rows.length; i += 500) {
    const { error, count } = await supabase
      .from('member_messages')
      .upsert(rows.slice(i, i + 500), {
        onConflict: 'member_id,fingerprint',
        ignoreDuplicates: true,
        count: 'exact',
      })
    if (error) {
      return NextResponse.json({ error: error.message, stored }, { status: 500 })
    }
    stored += count ?? 0
  }

  return NextResponse.json({
    ok: true,
    read: messages.length,
    stored,
    members: owner.size,
    unmatched,
  })
}
