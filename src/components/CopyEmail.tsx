'use client'

import { useState } from 'react'
import { TickIcon } from './icons'

export function CopyEmail({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className="inline-flex items-stretch border border-line">
      <a
        href={`mailto:${address}`}
        className="!no-underline px-3 py-2 font-mono text-[0.8125rem] text-ink hover:bg-ink-3"
      >
        {address}
      </a>
      <button
        type="button"
        onClick={copy}
        className="label border-l border-line px-3 hover:!text-ink hover:bg-ink-3"
      >
        {copied ? (
          <span className="flex items-center gap-1.5 !text-accent">
            <TickIcon /> Copied
          </span>
        ) : (
          'Copy'
        )}
      </button>
    </span>
  )
}
