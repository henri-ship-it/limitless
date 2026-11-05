'use client'

import { useState } from 'react'
import { TickIcon } from '../icons'
import { whatsappHref } from '@/lib/whatsapp'

/**
 * How to reach this member, sitting under their name rather than in a section
 * of its own.
 *
 * It used to be three full width buttons under a "Get in touch" heading, which
 * is a lot of furniture for an address and two links, and it pushed everything
 * worth reading below the fold. The address is the useful part, so it reads as
 * the address with the actions tucked beside it.
 */
export function MemberContact({
  email,
  phone,
  memberId,
}: {
  email: string
  phone: string | null
  memberId: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-stretch border border-line">
        <a
          href={`mailto:${email}?subject=Limitless`}
          className="!no-underline px-3 py-2 font-mono text-[0.8125rem] text-ink hover:bg-ink-3"
        >
          {email}
        </a>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy email address'}
          className="label border-l border-line px-3 hover:bg-ink-3 hover:!text-ink"
        >
          {copied ? <TickIcon /> : 'Copy'}
        </button>
      </span>

      {phone ? (
        <a
          href={whatsappHref({ phone })}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp"
          aria-label="Message on WhatsApp"
          className="inline-flex items-center justify-center border border-line p-2 !text-ink-56 hover:border-ink hover:!text-ink"
        >
          <WhatsAppIcon />
        </a>
      ) : null}

      {/*
       * Rarely wanted, so it is a small thing off to one side rather than a
       * button the size of the address next to it.
       */}
      <a
        href={`/api/admin/${memberId}/markdown`}
        className="label !no-underline border border-line px-3 py-2 !text-ink-56 hover:border-ink hover:!text-ink"
      >
        Export
      </a>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.17 1.73 2.64 4.19 3.7.58.26 1.04.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  )
}
