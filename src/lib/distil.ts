/**
 * Reads a 1:1 transcript into the few things that change how you write to
 * somebody.
 *
 * Kept out of the route so the same reading can be run again over transcripts
 * already stored. That is the whole reason the transcript is kept: the
 * distillation is an opinion, and when the opinion improves the old ones
 * should be able to catch up without anybody pasting anything twice.
 */

export type ConversationNotes = {
  motivation?: string
  communication?: string
  goals?: string[]
  life?: string[]
  quotes?: string[]
}

const ENDPOINT = 'https://api.anthropic.com/v1/messages'

const INSTRUCTION = [
  'This is a transcript of a one to one coaching call between Chris Bodman, who runs the Limitless programme, and one of his members.',
  'Chris was in the room. Read it the way he would remember it: not to summarise the call, but to come away knowing how to write to this person.',
  '',
  'Everything you return is about the MEMBER, never about Chris. Chris does most of the talking in a call like this, and his questions and his coaching are not the member speaking. Work out who is talking before you attribute anything.',
  '',
  'Return JSON only, in this shape:',
  '{',
  '  "motivation": "One or two sentences on what actually moves this person. Not what they say they want, what visibly lights them up or gets them working. Be specific to them.",',
  '  "communication": "One or two sentences on how to talk to them. Long or short. Direct or warm. Do they want a challenge, a plan, or a nudge. How they responded when Chris pushed.",',
  '  "goals": ["What the member is working towards, in their own words where you can. Two to five."],',
  '  "life": ["Things about the member\'s life outside the programme that a person who listened would remember. Family, work, a trip, something they are training for. Two to five. Leave it empty if they did not say anything personal."],',
  '  "quotes": ["Up to three short lines the MEMBER said, word for word."]',
  '}',
  '',
  'Rules:',
  '- Only what is in the transcript. Never infer a diagnosis, a personality type, or a motive they did not show.',
  '- Quotes are the strictest field. Include a line only if you are certain the member said it and not Chris, and only if it reads cleanly. Transcripts mishear people, so a line that is garbled or does not quite parse must be left out rather than tidied up. Returning no quotes at all is a perfectly good answer.',
  '- Leave a field empty rather than filling it thinly. An empty list is honest; a vague one gets used and is wrong.',
  '- Do not pad to reach a number. Two real things beat five where three are filler.',
  '- Write it for Chris to read, in plain sentences. No jargon, no coaching language, no bullet-point personality profiling.',
  '- Never use an em dash or an en dash.',
].join('\n')

/** Em and en dashes never survive into anything that feeds a draft. */
function plain(text: string): string {
  return text.replace(/\s*[—–]\s*/g, ' - ')
}

function clean(notes: ConversationNotes): ConversationNotes {
  const list = (items?: string[]) =>
    (items ?? []).map((item) => plain(String(item)).trim()).filter(Boolean)

  return {
    motivation: notes.motivation ? plain(notes.motivation).trim() : undefined,
    communication: notes.communication ? plain(notes.communication).trim() : undefined,
    goals: list(notes.goals),
    life: list(notes.life),
    quotes: list(notes.quotes),
  }
}

/** Null when the model would not answer or answered with something unreadable. */
export async function distil(
  transcript: string,
  key: string,
  model = 'claude-opus-5',
): Promise<ConversationNotes | null> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: `${INSTRUCTION}\n\nTranscript:\n\n${transcript}` }],
    }),
  })

  if (!response.ok) return null

  const payload = (await response.json()) as { content?: { type: string; text?: string }[] }
  const reply = (payload.content ?? [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')

  const start = reply.indexOf('{')
  const end = reply.lastIndexOf('}')
  if (start === -1 || end <= start) return null

  try {
    return clean(JSON.parse(reply.slice(start, end + 1)) as ConversationNotes)
  } catch {
    return null
  }
}
