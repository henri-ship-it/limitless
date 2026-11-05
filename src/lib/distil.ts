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

/**
 * A drop-in is read differently from a 1:1.
 *
 * The fixed headings of a 1:1 describe a person: what moves them, how to talk
 * to them, what they are working towards. Those stay true for months, which is
 * why they are the same headings every time.
 *
 * A drop-in is not about a person, it is about a week. One week is flow, the
 * next is something else, and forcing each into "what moves them" produces a
 * thin version of the same four paragraphs for everybody, week after week, in
 * which nothing is distinctive enough to be worth reading. So this returns its
 * own headings, written for the call that actually happened.
 */
export type DropInNotes = {
  /** One sentence on what the call was about, in the week's own terms. */
  headline?: string
  /** Headings written for this call, not chosen from a list. */
  sections?: { title: string; body: string }[]
}

/** Either kind of reading. Only a drop-in has sections. */
export type AnyNotes = ConversationNotes | DropInNotes

export function isDropIn(notes: AnyNotes | null | undefined): notes is DropInNotes {
  return Boolean(notes && 'sections' in notes && Array.isArray((notes as DropInNotes).sections))
}

const ENDPOINT = 'https://api.anthropic.com/v1/messages'

/**
 * The brief for a 1:1, where there are two voices and only one of them is the
 * member. `focus` names the person when there are more, which is the only thing
 * that changes: everything about what to look for and what to leave out is the
 * same whether they said it alone or in front of three other people.
 */
function instruction(focus?: string): string {
  if (!focus) return INSTRUCTION
  return [
    `This is a transcript of a Limitless group call. Chris Bodman, who runs the programme, is on it with several members. You are reading it for one of them only: ${focus}.`,
    '',
    `Everything you return is about ${focus}. Not about Chris, and not about any of the other members on the call. Work out who is speaking before you attribute anything. The other members are there for context, so you understand what ${focus} was responding to, and for nothing else.`,
    '',
    `A group call is not a 1:1 and should not be read as one. People say less, and they say it with an audience. Where ${focus} barely spoke, say so by leaving fields empty rather than by reading a lot into a little. Somebody who said three sentences has told you about one thing at most.`,
    '',
    INSTRUCTION.split('\n').slice(4).join('\n'),
    '',
    `Two more rules, because of the audience:`,
    `- Never attribute something another member said to ${focus}. If you are not certain which of them said a line, leave it out.`,
    `- The quotes field is for ${focus} alone, and the bar is higher here than in a 1:1: several voices means more chance of mishearing which is which. No quotes is the right answer most of the time.`,
  ].join('\n')
}

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
  /** Whose notes these are, when more than one member was on the call. */
  focus?: string,
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
      messages: [
        { role: 'user', content: `${instruction(focus)}\n\nTranscript:\n\n${transcript}` },
      ],
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

/**
 * What a member took from a drop-in, under headings that suit the call.
 *
 * `focus` is the member this is written for; everybody else on the call is
 * context. `week` and `chapter` say which part of the programme it belongs to,
 * which steers the reading towards the material rather than away from it: a
 * call during the flow chapter is mostly about flow, and saying so stops a
 * theme being invented that the room never discussed.
 */
export async function distilDropIn(
  transcript: string,
  key: string,
  model = 'claude-opus-5',
  focus?: string,
  week?: number,
  chapter?: string,
): Promise<DropInNotes | null> {
  const who = focus ?? 'the member'
  const about = chapter
    ? `That week of the programme was week ${week}, "${chapter}", so expect the call to lean on it.`
    : ''

  const brief = [
    `This is a transcript of a Limitless drop-in call. Chris Bodman, who runs the programme, is on it with several members. You are reading it for one of them: ${who}.`,
    about,
    '',
    'Summarise the call as it mattered to that member. Not a profile of them: a record of what was covered and where they came into it, so that in a month somebody can read this and remember the session.',
    '',
    'Return JSON only, in this shape:',
    '{',
    '  "headline": "One sentence on what this call was actually about, in the terms the room used.",',
    '  "sections": [{ "title": "A heading you write yourself", "body": "A short paragraph." }]',
    '}',
    '',
    'Rules:',
    '- Write the headings yourself, from this call. Two to four of them. They should be specific enough that somebody reading only the headings knows which week this was.',
    '- Never use the headings "What moves them", "How to talk to them", "What they are working towards", "Worth remembering" or "In their words". Those belong to a different kind of record and this is not it.',
    `- At least one section must be about ${who} specifically: what they asked, what they said, where they got stuck. If they barely spoke, say that plainly in one line rather than inventing a contribution.`,
    '- The rest can be about the call itself: what was taught, what the room worked through, anything Chris said that is worth keeping.',
    `- Only what is in the transcript. Work out who is speaking before you attribute anything, and never put another member's words in ${who}'s mouth.`,
    '- Plain sentences, written for Chris to read. No coaching language, no bullet-point personality profiling.',
    '- Never use an em dash or an en dash.',
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
      model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: `${brief}\n\nTranscript:\n\n${transcript}` }],
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
    const parsed = JSON.parse(reply.slice(start, end + 1)) as DropInNotes
    const sections = (parsed.sections ?? [])
      .map((section) => ({
        title: plain(String(section?.title ?? '')).trim(),
        body: plain(String(section?.body ?? '')).trim(),
      }))
      .filter((section) => section.title && section.body)

    /* Sections are the whole point; a reading without them is not one. */
    if (!sections.length) return null

    return {
      headline: parsed.headline ? plain(String(parsed.headline)).trim() : undefined,
      sections,
    }
  } catch {
    return null
  }
}
