'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveJournalEntry } from '@/app/actions'
import { REVIEW_FIELDS, SCHEDULE_HOURS, type EntryData } from '@/content/journal-fields'
import { TickIcon } from './icons'

type Props = {
  entry: number
  prompts: string[]
  initial: EntryData
  /** With no Supabase project the entry is kept on the device instead. */
  persist: 'db' | 'local'
}

const SAVE_DELAY = 800

export function DailyJournal({ entry, prompts, initial, persist }: Props) {
  const storageKey = `limitless:entry:${entry}`
  const [data, setData] = useState<EntryData>(initial)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded = useRef(false)

  // On a device with no project behind it, pick up whatever was typed before.
  useEffect(() => {
    if (persist === 'local' && !loaded.current) {
      loaded.current = true
      try {
        const stored = window.localStorage.getItem(storageKey)
        if (stored) setData(JSON.parse(stored))
      } catch {
        // A corrupt or blocked store just means starting empty.
      }
    }
  }, [persist, storageKey])

  const save = useCallback(
    (next: EntryData) => {
      setState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        if (persist === 'local') {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(next))
          } catch {
            // Out of quota or blocked. Nothing useful to do here.
          }
        } else {
          await saveJournalEntry(entry, next)
        }
        setState('saved')
      }, SAVE_DELAY)
    },
    [entry, persist, storageKey],
  )

  function update(patch: Partial<EntryData>) {
    setData((current) => {
      const next = { ...current, ...patch }
      save(next)
      return next
    })
  }

  function updateList(key: 'intentions' | 'achievements' | 'prompts', i: number, value: string) {
    const list = [...(data[key] ?? [])]
    list[i] = value
    update({ [key]: list } as Partial<EntryData>)
  }

  return (
    <div className="space-y-px">
      <div className="flex items-center justify-between border-b border-line px-6 py-3 sm:px-10">
        <p className="label">Your entry</p>
        <p className="label flex items-center gap-1.5">
          {state === 'saving' ? (
            'Saving'
          ) : state === 'saved' ? (
            <>
              <TickIcon className="text-accent-ink" /> Saved
            </>
          ) : persist === 'local' ? (
            'Saved on this device'
          ) : (
            'Saves as you type'
          )}
        </p>
      </div>

      <div className="grid lg:grid-cols-2">
        <div className="border-b border-line lg:border-r">
          <Panel label="Preview" meta="The day ahead">
            <FieldGroup label="Intentions">
              {[0, 1, 2].map((i) => (
                <Line
                  key={i}
                  index={i + 1}
                  value={data.intentions?.[i] ?? ''}
                  onChange={(v) => updateList('intentions', i, v)}
                />
              ))}
            </FieldGroup>

            <FieldGroup label="Schedule" meta="5am to 10pm">
              <div className="border border-line">
                {SCHEDULE_HOURS.map((hour) => (
                  <div key={hour} className="flex items-center border-b border-line last:border-b-0">
                    <span className="label w-14 shrink-0 py-2 pl-3">{hour}</span>
                    <input
                      value={data.schedule?.[hour] ?? ''}
                      onChange={(e) =>
                        update({ schedule: { ...(data.schedule ?? {}), [hour]: e.target.value } })
                      }
                      className="w-full bg-transparent px-3 py-2 text-[0.875rem] outline-none focus:bg-ink-3"
                    />
                  </div>
                ))}
              </div>
            </FieldGroup>
          </Panel>
        </div>

        <div>
          <Panel label="Review" meta="The day behind">
            <FieldGroup label="Achievements">
              {[0, 1, 2].map((i) => (
                <Line
                  key={i}
                  index={i + 1}
                  value={data.achievements?.[i] ?? ''}
                  onChange={(v) => updateList('achievements', i, v)}
                />
              ))}
            </FieldGroup>

            {REVIEW_FIELDS.map((field) => (
              <FieldGroup key={field.key} label={field.label}>
                <textarea
                  rows={2}
                  value={(data[field.key] as string) ?? ''}
                  onChange={(e) => update({ [field.key]: e.target.value } as Partial<EntryData>)}
                  className="w-full resize-y border border-line bg-surface px-3 py-2 text-[0.9375rem] leading-relaxed outline-none focus:border-ink"
                />
              </FieldGroup>
            ))}
          </Panel>
        </div>
      </div>

      {prompts.length ? (
        <div className="border-t border-line">
          <Panel label="The exercise">
            {prompts.map((prompt, i) => (
              <FieldGroup key={prompt} label={prompt} plain>
                <textarea
                  rows={4}
                  value={data.prompts?.[i] ?? ''}
                  onChange={(e) => updateList('prompts', i, e.target.value)}
                  className="w-full resize-y border border-line bg-surface px-3 py-2.5 text-[0.9375rem] leading-relaxed outline-none focus:border-ink"
                />
              </FieldGroup>
            ))}
          </Panel>
        </div>
      ) : null}
    </div>
  )
}

function Panel({
  label,
  meta,
  children,
}: {
  label: string
  meta?: string
  children: React.ReactNode
}) {
  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-6 flex items-baseline justify-between">
        <p className="label">{label}</p>
        {meta ? <p className="label">{meta}</p> : null}
      </div>
      <div className="space-y-7">{children}</div>
    </div>
  )
}

function FieldGroup({
  label,
  meta,
  plain,
  children,
}: {
  label: string
  meta?: string
  plain?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <p className={plain ? 'text-[0.9375rem] leading-relaxed text-ink' : 'label'}>{label}</p>
        {meta ? <p className="label shrink-0">{meta}</p> : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Line({
  index,
  value,
  onChange,
}: {
  index: number
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center border-b border-line">
      <span className="label w-6 shrink-0">{index}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-2 text-[0.9375rem] outline-none"
      />
    </div>
  )
}
