'use client'

import { useState } from 'react'
import { whatsappHref } from '@/lib/whatsapp'

type Channel = 'whatsapp' | 'email'

/**
 * A first draft of a message to one member, written in Chris's voice.
 *
 * Deliberately never sends. The draft lands in an editable box and opens in
 * WhatsApp or your own mail client, so what goes out has been read by a person
 * first and arrives from Chris rather than from a system.
 */
export function DraftMessage({
  memberId,
  name,
  email,
  phone,
}: {
  memberId: string
  name: string
  email: string
  phone: string | null
}) {
  const [channel, setChannel] = useState<Channel>(phone ? 'whatsapp' : 'email')
  const [intent, setIntent] = useState('')
  const [draft, setDraft] = useState('')
  const [angle, setAngle] = useState('')
  const [problem, setProblem] = useState('')
  const [working, setWorking] = useState(false)
  const [copied, setCopied] = useState(false)

  async function write() {
    setWorking(true)
    setProblem('')
    setCopied(false)
    try {
      const response = await fetch(`/api/admin/${memberId}/draft`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel, intent }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setProblem(payload.error ?? 'That did not work.')
        return
      }
      setDraft(payload.message ?? '')
      setAngle(payload.angle ?? '')
    } catch {
      setProblem('Could not reach the server.')
    } finally {
      setWorking(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // An email draft carries its subject on the first line, which mailto wants
  // separately.
  const [subjectLine, ...rest] = draft.split('\n')
  const hasSubject = subjectLine?.toLowerCase().startsWith('subject:')
  const subject = hasSubject ? subjectLine.slice('subject:'.length).trim() : 'Limitless'
  const body = hasSubject ? rest.join('\n').trim() : draft

  const sendHref =
    channel === 'whatsapp' && phone
      ? whatsappHref({ phone, text: draft })
      : `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['whatsapp', 'email'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setChannel(option)}
            disabled={option === 'whatsapp' && !phone}
            aria-pressed={channel === option}
            className={`pill disabled:cursor-not-allowed disabled:opacity-40 ${
              channel === option
                ? '!border-accent !bg-accent-soft !text-ink'
                : 'hover:!border-line-strong hover:!text-ink'
            }`}
          >
            {option === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder={`What should this say to ${name}? Leave blank and it will decide.`}
          className="w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={write}
          disabled={working}
          className="label shrink-0 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
        >
          {working ? 'Writing…' : draft ? 'Try again' : 'Draft a message'}
        </button>
      </div>

      {problem ? <p className="mt-3 !mb-0 text-[0.875rem] text-ink">{problem}</p> : null}

      {draft ? (
        <div className="mt-5">
          {angle ? <p className="label !mb-2 !text-ink-56">{angle}</p> : null}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={Math.min(20, draft.split('\n').length + 2)}
            className="w-full resize-y border border-line bg-surface p-4 text-[0.9375rem] leading-relaxed outline-none focus:border-ink"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={sendHref}
              target="_blank"
              rel="noreferrer"
              className="label !no-underline border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
            >
              Open in {channel === 'whatsapp' ? 'WhatsApp' : 'your mail'}
            </a>
            <button
              type="button"
              onClick={copy}
              className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

        </div>
      ) : null}
    </div>
  )
}
