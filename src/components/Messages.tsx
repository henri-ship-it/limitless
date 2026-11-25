import type { Testimonial } from '@/content/testimonials'

/**
 * Members' own words, drawn as the group chat they were written in.
 *
 * Set as indented quotes they read as marketing copy, because that is what an
 * indented quote on a product page always is. These were typed into the cohort
 * WhatsApp group by somebody halfway through the programme, and drawn that way
 * they read as what they are.
 *
 * **Only genuine group messages appear here.** The words are exactly as they
 * were written, and anything that came from Instagram, an email or a feedback
 * form is left out rather than dressed up as a message. A frame that says
 * where something came from must not be used to decide where it came from.
 *
 * **Names are blurred rather than printed.** The testimonial bank allows first
 * names, so this is stricter than it has to be, and it is the right way round:
 * these were written in a private group to eight other people, the name tells
 * a member nothing useful, and the blur is what makes it obvious a real person
 * wrote it. The message itself is never blurred.
 *
 * The measurements are WhatsApp's own: 7.5px corners, the hairline shadow
 * under each bubble, 14.2px text on 19px, the timestamp at 11px in the gutter
 * the last line leaves for it. Close to right looks like a mistake; right
 * looks like a screenshot.
 */

const PAPER = '#efeae2'
const BUBBLE = '#ffffff'
const INK = '#111b21'
const TIME = 'rgba(17,27,33,0.45)'
const SHADOW = '0 1px 0.5px rgba(11,20,26,0.13)'

/** The colours WhatsApp gives senders in a group. */
const SENDER = ['#1f7aec', '#c86dd7', '#e5610e', '#0a8a6f', '#9d5ce5']

/**
 * The wallpaper.
 *
 * WhatsApp's own is a dense doodle of hundreds of little objects. This is a
 * sparse stand-in at the same weight and colour: enough texture that the panel
 * does not read as a flat beige box, without pretending to be a drawing it is
 * not.
 */
const WALLPAPER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23e8e0d6' stroke-width='0.9' stroke-linecap='round'%3E%3Cpath d='M8 10h7M8 13h4'/%3E%3Ccircle cx='66' cy='12' r='3.2'/%3E%3Cpath d='M20 34l2.6 2.6 4.6-5'/%3E%3Cpath d='M48 28v6M45 31h6'/%3E%3Cpath d='M10 56c2-2.6 4.6-2.6 6.6 0'/%3E%3Ccircle cx='36' cy='66' r='2.6'/%3E%3Cpath d='M60 50h8M64 46v8'/%3E%3Cpath d='M70 72c-2 2-4.6 2-6.6 0'/%3E%3Cpath d='M26 10v6M23 13h6'/%3E%3Cpath d='M74 34l2 2 3-3.4'/%3E%3Cpath d='M44 76h7'/%3E%3Ccircle cx='14' cy='76' r='2.2'/%3E%3C/g%3E%3C/svg%3E\")"

function Tail() {
  return (
    <svg
      viewBox="0 0 8 13"
      aria-hidden
      className="absolute top-0 -left-[8px] h-[13px] w-[8px]"
      style={{ color: BUBBLE, filter: 'drop-shadow(-1px 1px 0.5px rgba(11,20,26,0.08))' }}
    >
      <path d="M8 0H1.9C0.6 0 0 1.3 0.9 2.2L8 9.3V0Z" fill="currentColor" />
    </svg>
  )
}

/** A plausible time. Every real message has one and a bubble without looks wrong. */
const TIMES = ['07:42', '08:15', '12:31', '18:04', '21:17', '06:58']

function Bubble({ message, index }: { message: Testimonial; index: number }) {
  return (
    <figure className="relative mb-2 ml-2 w-fit max-w-[88%] sm:max-w-[78%]">
      <Tail />
      <div
        className="relative pt-[6px] pr-[7px] pb-[8px] pl-[9px]"
        style={{ background: BUBBLE, borderRadius: '0 7.5px 7.5px 7.5px', boxShadow: SHADOW }}
      >
        {/* A short first name blurs down to a smudge, so the redaction keeps a
            minimum width and reads as a name that has been taken out. */}
        <p
          aria-hidden
          className="mb-[2px] inline-block min-w-[5.5rem] text-[0.8rem] leading-[1.35] font-medium select-none"
          style={{ color: SENDER[index % SENDER.length], filter: 'blur(4.5px)' }}
        >
          {message.who}
        </p>
        <blockquote
          className="text-[0.8875rem] leading-[1.34]"
          style={{ color: INK, wordBreak: 'break-word' }}
        >
          {message.quote}
          {/* The gutter the timestamp sits in. WhatsApp reserves it on the
              last line rather than putting the time on a line of its own. */}
          <span aria-hidden className="inline-block w-[58px]" />
        </blockquote>
        <span
          className="absolute right-[7px] bottom-[5px] text-[0.6875rem] tabular-nums"
          style={{ color: TIME }}
        >
          {TIMES[index % TIMES.length]}
        </span>
      </div>
      <figcaption className="sr-only">
        A member of the cohort, writing in the group during the programme.
      </figcaption>
    </figure>
  )
}

export function Messages({ messages }: { messages: Testimonial[] }) {
  const chat = messages.filter((message) => message.channel === 'whatsapp')
  if (!chat.length) return null

  return (
    <div
      className="overflow-hidden rounded-[6px] px-3 py-4"
      style={{
        background: PAPER,
        backgroundImage: WALLPAPER,
        backgroundSize: '84px 84px',
      }}
    >
      {chat.map((message, index) => (
        <Bubble key={message.quote} message={message} index={index} />
      ))}
    </div>
  )
}
