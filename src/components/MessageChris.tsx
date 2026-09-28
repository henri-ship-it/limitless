import { CHRIS_WHATSAPP } from '@/content/assets'
import { whatsappMemberHref } from '@/lib/whatsapp'

/**
 * The button an Elite member uses to reach Chris.
 *
 * Elite has no community and no group chat, so where a Pro member is pointed at
 * the WhatsApp group this is the whole of the support line. That makes a dead
 * link worse here than almost anywhere else on the platform: a member with a
 * question taps it, nothing happens, and as far as they know they have no way
 * through at all.
 *
 * So it says what is true. Until the number is filled in, this is a line of
 * text pointing at the email address rather than a button that does nothing.
 */
export function MessageChris({ text }: { text?: string }) {
  if (!CHRIS_WHATSAPP) {
    return (
      <p className="!mb-0 text-[0.9375rem] !text-ink-56">
        The WhatsApp link is not set up yet. Email works in the meantime.
      </p>
    )
  }

  return (
    <a
      href={whatsappMemberHref({ phone: CHRIS_WHATSAPP, text })}
      target="_blank"
      rel="noreferrer"
      className="label !text-white inline-flex items-center gap-2 bg-ink px-4 py-3 !no-underline hover:bg-ink-72"
    >
      <WhatsAppIcon />
      Message Chris
    </a>
  )
}

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.19 3.7.58.26 1.04.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  )
}
