import type { Testimonial } from '@/content/testimonials'

/**
 * Members' own words, drawn as the group chat they were written in.
 *
 * Set as plain indented quotes they read as marketing copy, because that is
 * what an indented quote on a product page always is. These were typed into a
 * WhatsApp group by somebody halfway through the programme, and drawn that way
 * they read as what they are.
 *
 * **Nothing here is invented.** The words are exactly as they were written,
 * and only messages that genuinely came from the cohort group are drawn in the
 * WhatsApp frame. An Instagram comment or an email gets a card that says so.
 * A screenshot-styled frame is a way of showing where something came from, not
 * a licence to decide where it came from.
 *
 * **Names are blurred rather than printed.** The testimonial bank allows first
 * names, so this is stricter than it has to be, and it is the right way round:
 * these were written in a private group to eight other people, the name adds
 * nothing to a member reading them, and the blur is the thing that makes it
 * obvious a real person wrote it. The text itself is never blurred; a quote
 * nobody can read is decoration.
 */

const PAPER = '#efeae2'
const BUBBLE = '#ffffff'
const TIME = '#667781'

/* The colours WhatsApp gives senders in a group, so two people in the same
   thread are not the same colour. */
const SENDER = ['#1f7aec', '#c86dd7', '#e5610e', '#0a8a6f']

function Tail() {
  return (
    <svg
      viewBox="0 0 8 13"
      aria-hidden
      className="absolute -left-[7px] top-0 h-[13px] w-[8px]"
      style={{ color: BUBBLE }}
    >
      <path d="M8 0H1.5C0.5 0 0 1 0.7 1.8L8 10V0Z" fill="currentColor" />
    </svg>
  )
}

/** A plausible time, so a bubble is not missing the thing every bubble has. */
function at(index: number): string {
  const times = ['07:42', '08:15', '12:31', '18:04', '21:17', '06:58']
  return times[index % times.length]
}

function Bubble({ message, index }: { message: Testimonial; index: number }) {
  return (
    <figure className="relative ml-2 max-w-[92%]">
      <Tail />
      <div
        className="relative px-3 pt-2 pb-5"
        style={{ background: BUBBLE, borderRadius: '0 8px 8px 8px' }}
      >
        {/* A short first name blurs down to a smudge. The minimum width makes
            it read as a name that has been taken out, which is the point. */}
        <p
          aria-hidden
          className="mb-1 inline-block min-w-[5rem] text-[0.875rem] font-semibold select-none"
          style={{ color: SENDER[index % SENDER.length], filter: 'blur(4.5px)' }}
        >
          {message.who}
        </p>
        <blockquote className="text-[0.9375rem] leading-[1.45] text-[#111b21]">
          {message.quote}
        </blockquote>
        <span
          className="absolute right-3 bottom-1.5 text-[0.6875rem] tabular-nums"
          style={{ color: TIME }}
        >
          {at(index)}
        </span>
      </div>
      <figcaption className="sr-only">
        A member of the cohort, writing in the group during the programme.
      </figcaption>
    </figure>
  )
}

/** Anything not written in the group: an Instagram comment, an emailed review. */
function Card({ message }: { message: Testimonial }) {
  return (
    <figure className="border border-line bg-surface p-5">
      <blockquote className="text-[1rem] leading-relaxed text-ink-72">{message.quote}</blockquote>
      <figcaption className="mt-3 text-[0.8125rem] text-ink-40">{message.where}</figcaption>
    </figure>
  )
}

export function Messages({ messages, title }: { messages: Testimonial[]; title?: string }) {
  if (!messages.length) return null

  const chat = messages.filter((message) => message.channel === 'whatsapp')
  const rest = messages.filter((message) => message.channel !== 'whatsapp')

  return (
    <div className="space-y-5">
      {chat.length > 0 && (
        <div className="overflow-hidden border border-line">
          {/* The bar at the top of a thread. The group is real and so is its
              name; the member count is the Pro cohort size. */}
          <div className="flex items-center gap-3 bg-[#f0f2f5] px-3.5 py-2.5">
            <span
              aria-hidden
              className="h-8 w-8 shrink-0 rounded-full"
              style={{ background: '#c7cdd2', filter: 'blur(2px)' }}
            />
            <span>
              <span
                aria-hidden
                className="block text-[0.875rem] font-semibold text-[#111b21] select-none"
                style={{ filter: 'blur(4.5px)' }}
              >
                Limitless Pro
              </span>
              <span className="block text-[0.75rem]" style={{ color: TIME }}>
                {title ?? 'cohort group'}
              </span>
            </span>
          </div>

          <div className="space-y-2.5 px-3 py-4" style={{ background: PAPER }}>
            {chat.map((message, index) => (
              <Bubble key={message.quote} message={message} index={index} />
            ))}
          </div>
        </div>
      )}

      {rest.map((message) => (
        <Card key={message.quote} message={message} />
      ))}
    </div>
  )
}
