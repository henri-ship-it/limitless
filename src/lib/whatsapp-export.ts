/**
 * Reads a WhatsApp "Export chat" file into messages.
 *
 * The export is the only way group messages come off WhatsApp. Meta's Groups
 * API exists now, but it needs the number moved off the Business app onto the
 * Cloud API, an Official Business Account, and the group rebuilt through an
 * invite link, which loses everything already in it. So this is a file somebody
 * exports and hands over, and the job here is to read it without guessing.
 *
 * Three things make that harder than it looks. The header format differs
 * between iOS and Android. The date order differs by locale, and a wrong guess
 * silently moves every message by months. And a message can run over many
 * lines, where only the first carries a header, so anything without one belongs
 * to whatever came before it rather than being skipped.
 */

export type ChatMessage = {
  /** Exactly as WhatsApp wrote it, so it can be matched to a member by name. */
  sender: string
  text: string
  /** ISO date. The time is kept out: it is not reliable across exports. */
  sentOn: string
}

/*
 * iOS brackets the header and uses a colon after the name:
 *   [23/09/2026, 14:32:11] Charlie: text
 * Android uses a dash:
 *   23/09/2026, 14:32 - Charlie: text
 * Both may carry a narrow no-break space before am/pm, which is why \s is not
 * enough and   is matched explicitly.
 */
const IOS = /^‎?\[(\d{1,4})[/.-](\d{1,2})[/.-](\d{2,4}),\s[^\]]+\]\s([^:]+):\s?([\s\S]*)$/
const ANDROID =
  /^‎?(\d{1,4})[/.-](\d{1,2})[/.-](\d{2,4}),\s[\d:]+(?:[\s ][apAP]\.?[mM]\.?)?\s-\s([^:]+):\s?([\s\S]*)$/

/** A header line of either shape, which is how a new message is recognised. */
function header(line: string): { a: number; b: number; year: number; sender: string; text: string } | null {
  const m = IOS.exec(line) ?? ANDROID.exec(line)
  if (!m) return null
  const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3])
  return { a: Number(m[1]), b: Number(m[2]), year, sender: m[4].trim(), text: m[5] }
}

/*
 * Lines WhatsApp writes itself, which are not anybody speaking.
 *
 * Matched on the whole message rather than loosely, because a member who
 * actually types "you deleted this message" should not vanish from their own
 * record.
 */
const NOISE = [
  /^messages and calls are end-to-end encrypted/i,
  /^<media omitted>$/i,
  /^image omitted$/i,
  /^video omitted$/i,
  /^audio omitted$/i,
  /^sticker omitted$/i,
  /^gif omitted$/i,
  /^document omitted$/i,
  /^this message was deleted$/i,
  /^you deleted this message$/i,
  /^missed voice call$/i,
  /^missed video call$/i,
  /^null$/i,
]

function isNoise(text: string): boolean {
  const t = text.trim()
  if (!t) return true
  return NOISE.some((pattern) => pattern.test(t))
}

/**
 * Which way round the dates are.
 *
 * Decided across the whole file rather than per line. A component above twelve
 * can only be a day, so one such line settles it for every other; where no line
 * settles it, day first is the right default for a British group and is what
 * WhatsApp writes here.
 */
export function dateOrder(lines: string[]): 'dmy' | 'mdy' {
  for (const line of lines) {
    const h = header(line)
    if (!h) continue
    if (h.a > 12) return 'dmy'
    if (h.b > 12) return 'mdy'
  }
  return 'dmy'
}

const iso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

/** Every real message in the export, oldest first. */
export function parseChatExport(file: string): ChatMessage[] {
  const lines = file.split(/\r?\n/)
  const order = dateOrder(lines)
  const out: ChatMessage[] = []

  for (const line of lines) {
    const h = header(line)

    if (!h) {
      /*
       * A continuation of the message before it. Without this every message
       * with a line break in it loses all but its first line, which on a group
       * chat is most of the ones worth reading.
       */
      if (out.length && line.trim()) out[out.length - 1].text += `\n${line}`
      continue
    }

    const day = order === 'dmy' ? h.a : h.b
    const month = order === 'dmy' ? h.b : h.a
    out.push({ sender: h.sender, text: h.text, sentOn: iso(h.year, month, day) })
  }

  /*
   * Noise is dropped at the end rather than as it is read, so that a line
   * following "<Media omitted>" is still attached to the message it continues
   * rather than being orphaned by its removal.
   */
  return out
    .map((m) => ({ ...m, text: m.text.trim() }))
    .filter((m) => !isNoise(m.text) && m.sender.length > 0)
}
