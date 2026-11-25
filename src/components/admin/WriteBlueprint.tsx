'use client'

import { useState } from 'react'

import { isBlueprint, type Blueprint } from '@/content/blueprint'

/**
 * Writing a member's blueprint, after the welcome call.
 *
 * The order matters and it is the order Henri asked for: they answer the
 * baseline, they book, they speak to Chris, and then the blueprint arrives as
 * though he wrote it up afterwards. So the notes from the call are required
 * input, not optional: without them this is written from a questionnaire, and
 * a blueprint written from a questionnaire reads like one.
 *
 * Drafting and issuing are two separate presses. Nothing reaches the member
 * until Chris has read it, because the whole point is that it reads as
 * written by him, and a first draft nobody has read is not that. The JSON sits
 * in a box between the two so a wrong line can be fixed without a form with
 * twenty fields in it.
 */
export function WriteBlueprint({ memberId, tier }: { memberId: string; tier: string }) {
  const [notes, setNotes] = useState('')
  const [draft, setDraft] = useState('')
  const [state, setState] = useState<'idle' | 'drafting' | 'issuing' | 'issued'>('idle')
  const [problem, setProblem] = useState<string | null>(null)

  if (tier !== 'pro' && tier !== 'elite') return null

  async function send(body: Record<string, unknown>, next: 'drafting' | 'issuing') {
    setState(next)
    setProblem(null)
    try {
      const response = await fetch(`/api/admin/${memberId}/blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error ?? 'That did not work')
      if (payload.status === 'issued') {
        setState('issued')
        return
      }
      setDraft(JSON.stringify(payload.blueprint, null, 2))
      setState('idle')
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'That did not work')
      setState('idle')
    }
  }

  function issue() {
    let parsed: unknown
    try {
      parsed = JSON.parse(draft)
    } catch {
      setProblem('That is not valid JSON any more.')
      return
    }
    if (!isBlueprint(parsed)) {
      setProblem('That is missing a section. It needs territory, resistance, journey and integration.')
      return
    }
    void send({ save: parsed as Blueprint }, 'issuing')
  }

  return (
    <div className="mt-8 border-t border-line pt-6">
      <p className="label !mb-2">Write their blueprint</p>
      <p className="!mb-4 text-[0.9375rem] !text-ink-56">
        Your notes from the welcome call, in whatever shape you took them. What they said, what you
        noticed, what you agreed. This is drafted from those plus their baseline.
      </p>

      <textarea
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        rows={6}
        placeholder="Spoke about the team thing again. Keeps saying yes to work that is not his. Wants out of the reactive loop by March..."
        className="w-full resize-y border border-line bg-bg px-3.5 py-3 text-[0.9375rem] leading-relaxed outline-none focus:border-line-strong"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={state === 'drafting' || notes.trim().length < 40}
          onClick={() => void send({ notes }, 'drafting')}
          className="bg-ink px-5 py-2.5 text-[0.875rem] font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {state === 'drafting' ? 'Writing' : draft ? 'Draft again' : 'Draft it'}
        </button>
        {notes.trim().length > 0 && notes.trim().length < 40 && (
          <span className="text-[0.8125rem] text-ink-40">A line or two more.</span>
        )}
      </div>

      {problem && <p className="mt-3 text-[0.875rem] text-flame">{problem}</p>}

      {draft && state !== 'issued' && (
        <>
          <p className="label !mt-6 !mb-2">The draft</p>
          <p className="!mb-3 text-[0.875rem] !text-ink-56">
            Read it as they will. Change anything that is not how you would have put it, then issue
            it. Nothing has reached them yet.
          </p>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full resize-y border border-line bg-bg px-3.5 py-3 font-mono text-[0.75rem] leading-relaxed outline-none focus:border-line-strong"
          />
          <button
            type="button"
            disabled={state === 'issuing'}
            onClick={issue}
            className="mt-3 bg-ink px-5 py-2.5 text-[0.875rem] font-medium text-surface transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {state === 'issuing' ? 'Issuing' : 'Issue it to them'}
          </button>
        </>
      )}

      {state === 'issued' && (
        <p className="mt-4 text-[0.9375rem]">
          Issued. It is on their blueprint page now, dated today.
        </p>
      )}
    </div>
  )
}
