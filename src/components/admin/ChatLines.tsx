'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChatLine } from '@/lib/admin'
import { Grow } from '@/components/Grow'

/**
 * What this member has said in the group chat.
 *
 * An import rather than a connection, and that is WhatsApp's doing. Meta's
 * Groups API needs the number moved off the Business app, an Official Business
 * Account, and the group rebuilt from an invite link, which loses everything
 * already in it. Export chat is the only way to read a group that exists.
 *
 * The export is the whole history every time, so this is safe to run every
 * week: everything is fingerprinted and the same message never lands twice.
 */
export function ChatLines({ name, lines }: { name: string; lines: ChatLine[] }) {
  const router = useRouter()
  const [file, setFile] = useState('')
  const [adding, setAdding] = useState(false)
  const [working, setWorking] = useState(false)
  const [problem, setProblem] = useState('')
  const [result, setResult] = useState('')

  async function send(text: string) {
    setWorking(true)
    setProblem('')
    setResult('')
    try {
      const response = await fetch('/api/admin/chat-import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: text }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setProblem([payload.error, payload.note].filter(Boolean).join(' '))
        return
      }
      const missed = payload.unmatched?.length
        ? ` Nobody matched: ${payload.unmatched.join(', ')}.`
        : ''
      setResult(
        `Read ${payload.read ?? 0}, stored ${payload.stored ?? 0} new across ${payload.members ?? 0} members.${missed}`,
      )
      setFile('')
      setAdding(false)
      router.refresh()
    } catch {
      setProblem('Could not reach the server.')
    } finally {
      setWorking(false)
    }
  }

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    await send(await chosen.text())
    event.target.value = ''
  }

  return (
    <div>
      <div className="!mb-4 flex flex-wrap items-center gap-3">
        <label className="label cursor-pointer border border-line px-4 py-2.5 hover:border-ink hover:!text-ink">
          <input type="file" accept=".txt" onChange={pick} className="hidden" disabled={working} />
          {working ? 'Reading…' : 'Import a chat export'}
        </label>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="label hover:!text-ink"
        >
          {adding ? 'Cancel' : 'Or paste it'}
        </button>
      </div>

      {adding ? (
        <div className="!mb-5">
          <Grow
            minRows={5}
            value={file}
            onChange={(e) => setFile(e.target.value)}
            placeholder="Paste the whole WhatsApp export here."
            className="w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={() => send(file)}
            disabled={working || !file.trim()}
            className="label mt-3 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-40"
          >
            {working ? 'Reading…' : 'Import'}
          </button>
        </div>
      ) : null}

      {problem ? <p className="!mb-4 text-[0.875rem] text-ink">{problem}</p> : null}
      {result ? <p className="!mb-4 text-[0.875rem] !text-ink-56">{result}</p> : null}

      {lines.length ? (
        <ul className="!list-none !pl-0 !mb-0">
          {lines.map((line) => (
            <li key={line.id} className="border-t border-line py-3">
              <p className="label !text-ink-40 !mb-1">{line.sent_on}</p>
              <p className="!mb-0 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink-72">
                {line.body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="!mb-0 text-[0.9375rem] !text-ink-56">
          Nothing from {name} in the group chat yet. On the group in WhatsApp, open the menu, choose
          Export chat, and pick without media. One import covers everybody in it.
        </p>
      )}
    </div>
  )
}
