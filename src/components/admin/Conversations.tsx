'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Conversation } from '@/lib/admin'
import { Grow } from '@/components/Grow'

/**
 * The 1:1s: what was said, and what Chris took from it.
 *
 * The distillation is what appears, because that is the part anybody reads
 * twice. The transcript is underneath it, folded away, for the times the
 * distillation is not enough or looks wrong.
 */
export function Conversations({
  memberId,
  name,
  conversations,
}: {
  memberId: string
  name: string
  conversations: Conversation[]
}) {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [happenedOn, setHappenedOn] = useState(new Date().toISOString().slice(0, 10))
  const [working, setWorking] = useState(false)
  const [problem, setProblem] = useState('')
  const [adding, setAdding] = useState(false)

  async function save() {
    setWorking(true)
    setProblem('')
    try {
      const response = await fetch(`/api/admin/${memberId}/conversation`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ transcript, happenedOn }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setProblem(payload.error ?? 'That did not work.')
        return
      }
      setTranscript('')
      setAdding(false)
      router.refresh()
    } catch {
      setProblem('Could not reach the server.')
    } finally {
      setWorking(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/admin/${memberId}/conversation?id=${id}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      {conversations.length === 0 && !adding ? (
        <p className="!mb-6 text-[0.9375rem] leading-relaxed !text-ink-56">
          Nothing from a call with {name} yet. Paste a transcript in and it will be read into the
          things that change how you write to them.
        </p>
      ) : null}

      {conversations.map((conversation) => (
        <article key={conversation.id} className="!mb-8 border-b border-line pb-8 last:border-0">
          <div className="!mb-4 flex flex-wrap items-center gap-2">
            <span className="pill !text-ink">{formatDay(conversation.happened_on)}</span>
            <button
              type="button"
              onClick={() => remove(conversation.id)}
              className="label !text-ink-40 ml-auto hover:!text-ink"
            >
              Remove
            </button>
          </div>

          {conversation.notes ? (
            <Notes notes={conversation.notes} />
          ) : (
            <p className="!mb-4 text-[0.9375rem] !text-ink-56">
              This one was saved but could not be read into notes. The transcript is below.
            </p>
          )}

          <details className="mt-5">
            <summary className="label cursor-pointer hover:!text-ink">The whole transcript</summary>
            <p className="mt-4 !mb-0 text-[0.875rem] leading-relaxed whitespace-pre-wrap !text-ink-56">
              {conversation.transcript}
            </p>
          </details>
        </article>
      ))}

      {adding ? (
        <div className="border border-line p-5">
          <label htmlFor="happened" className="label">
            When it happened
          </label>
          <input
            id="happened"
            type="date"
            value={happenedOn}
            onChange={(e) => setHappenedOn(e.target.value)}
            className="mt-2 mb-5 block border border-line bg-surface px-3 py-2 text-[0.9375rem] outline-none focus:border-ink"
          />

          <label htmlFor="transcript" className="label">
            The transcript
          </label>
          <Grow
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste the whole thing. It does not need tidying up first."
            className="mt-2 max-h-[24rem] w-full overflow-y-auto border border-line bg-surface p-4 text-[0.9375rem] leading-relaxed outline-none focus:border-ink"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={save}
              disabled={working || transcript.trim().length < 200}
              className="label !text-white bg-ink px-4 py-2.5 hover:bg-ink-72 disabled:opacity-40"
            >
              {working ? 'Reading it' : 'Read this in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false)
                setProblem('')
              }}
              className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
            >
              Cancel
            </button>
          </div>
          {problem ? <p className="mt-4 !mb-0 text-[0.875rem] text-ink">{problem}</p> : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
        >
          {conversations.length ? 'Add another call' : 'Add a call'}
        </button>
      )}
    </div>
  )
}

function Notes({ notes }: { notes: NonNullable<Conversation['notes']> }) {
  return (
    <div className="flex flex-col gap-5">
      {notes.motivation ? <Line label="What moves them" text={notes.motivation} /> : null}
      {notes.communication ? <Line label="How to talk to them" text={notes.communication} /> : null}
      {notes.goals?.length ? <Items label="What they are working towards" items={notes.goals} /> : null}
      {notes.life?.length ? <Items label="Worth remembering" items={notes.life} /> : null}
      {notes.quotes?.length ? (
        <div>
          <p className="label !mb-2 !text-ink-56">In their words</p>
          {notes.quotes.map((quote, i) => (
            <p key={i} className="!mb-2 border-l-2 border-line pl-4 text-[0.9375rem] leading-relaxed">
              {quote}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Line({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="label !mb-2 !text-ink-56">{label}</p>
      <p className="!mb-0 text-[0.9375rem] leading-relaxed">{text}</p>
    </div>
  )
}

function Items({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="label !mb-2 !text-ink-56">{label}</p>
      <ul className="!mb-0 flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[0.9375rem] leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
