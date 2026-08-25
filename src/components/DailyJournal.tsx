'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveJournalEntry } from '@/app/actions'
import { REVIEW_FIELDS, SCHEDULE_HOURS, type EntryData } from '@/content/journal-fields'
import { HUDDLE_QUESTIONS, type Field } from '@/content/entry-fields'
import { VALUES, customExercise } from '@/content/entry-extras'
import { EntryField } from './EntryField'
import { TickIcon } from './icons'

type Props = {
  entry: number
  /** A huddle closes the week, so it reflects instead of planning a day. */
  huddle: boolean
  intro: string[]
  fields: Field[]
  outro: string[]
  link: { label: string; url: string } | null
  awaitingLink: boolean
  initial: EntryData
  /** With no Supabase project the entry is kept on the device instead. */
  persist: 'db' | 'local'
}

const SAVE_DELAY = 800

export function DailyJournal({
  entry,
  huddle,
  intro,
  fields,
  outro,
  link,
  awaitingLink,
  initial,
  persist,
}: Props) {
  const storageKey = `limitless:entry:${entry}`
  const custom = customExercise(entry)
  const [data, setData] = useState<EntryData>(initial)
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaded = useRef(false)

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

  function updateList(key: 'intentions' | 'achievements', i: number, value: string) {
    const list = [...(data[key] ?? [])]
    list[i] = value
    update({ [key]: list } as Partial<EntryData>)
  }

  function setField(path: string, value: string | string[]) {
    update({ fields: { ...(data.fields ?? {}), [path]: value } })
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
          {huddle ? (
            <Panel label="Huddle" meta="The week behind">
              {HUDDLE_QUESTIONS.map((question, i) => (
                <FieldGroup key={i} label={question} plain>
                  <textarea
                    rows={3}
                    value={data.huddle?.[i] ?? ''}
                    onChange={(e) => {
                      const list = [...(data.huddle ?? [])]
                      list[i] = e.target.value
                      update({ huddle: list })
                    }}
                    className="w-full resize-y border border-line bg-surface px-3 py-2.5 text-[0.9375rem] leading-relaxed outline-none focus:border-ink"
                  />
                </FieldGroup>
              ))}
            </Panel>
          ) : (
            <Panel label="Preview" meta="The day ahead">
              <FieldGroup label="Intentions" meta="Tick them off as you go">
                {[0, 1, 2].map((i) => (
                  <Line
                    key={i}
                    index={i + 1}
                    value={data.intentions?.[i] ?? ''}
                    onChange={(v) => updateList('intentions', i, v)}
                    tick={{
                      checked: Boolean(data.intentionsDone?.[i]),
                      onToggle: () => {
                        const done = [...(data.intentionsDone ?? [])]
                        done[i] = !done[i]
                        update({ intentionsDone: done })
                      },
                    }}
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
          )}
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
                  /* Writing one down is the achievement. It ticks itself. */
                  tick={{ checked: Boolean(data.achievements?.[i]?.trim()), readOnly: true }}
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

      {fields.length || intro.length || custom ? (
        <div className="border-t border-line">
          <Panel label="The exercise">
            {intro.map((line, i) => (
              <p key={i} className="text-[0.9375rem] leading-relaxed text-ink-72">
                {line}
              </p>
            ))}

            {link ? (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="label !text-white inline-flex bg-ink px-4 py-3 no-underline hover:bg-ink-72"
              >
                {link.label} →
              </a>
            ) : awaitingLink ? (
              <p className="label border border-line bg-ink-3 px-4 py-3">Assessment link to follow</p>
            ) : null}

            {custom ? (
              <>
                {custom.guidance.map((line, i) => (
                  <p key={i} className="text-[0.9375rem] leading-relaxed text-ink-72">
                    {line}
                  </p>
                ))}
                <ValuePicker
                  selected={data.values ?? []}
                  onToggle={(value) => {
                    const current = new Set(data.values ?? [])
                    if (current.has(value)) current.delete(value)
                    else current.add(value)
                    update({ values: [...current] })
                  }}
                />
                {custom.fieldsIntro ? (
                  <p className="text-[0.9375rem] leading-relaxed text-ink-72">{custom.fieldsIntro}</p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  {custom.fields.map((field, i) => (
                    <FieldGroup key={i} label={field}>
                      <input
                        value={(data.fields?.[`custom.${i}`] as string) ?? ''}
                        onChange={(e) => setField(`custom.${i}`, e.target.value)}
                        className="w-full border border-line bg-surface px-3 py-2.5 text-[0.9375rem] outline-none focus:border-ink"
                      />
                    </FieldGroup>
                  ))}
                </div>
              </>
            ) : (
              fields.map((field, i) => (
                <EntryField
                  key={i}
                  field={field}
                  path={String(i)}
                  value={data.fields?.[String(i)]}
                  onChange={setField}
                />
              ))
            )}

            {outro.map((line, i) => (
              <p key={i} className="text-[0.8125rem] leading-relaxed text-ink-56">
                {line}
              </p>
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
  tick,
}: {
  index: number
  value: string
  onChange: (value: string) => void
  tick?: { checked: boolean; onToggle?: () => void; readOnly?: boolean }
}) {
  const box = tick ? (
    <span
      aria-hidden
      className={`flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-[3px] border ${
        tick.checked
          ? 'border-accent-ink bg-accent-ink text-white'
          : 'border-line-strong bg-surface text-transparent'
      }`}
    >
      <TickIcon />
    </span>
  ) : null

  return (
    <div className="flex items-center gap-3 border-b border-line">
      <span className="label w-4 shrink-0">{index}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent py-2 text-[0.9375rem] outline-none"
      />
      {tick && !tick.readOnly ? (
        <button
          type="button"
          onClick={tick.onToggle}
          aria-pressed={tick.checked}
          aria-label={`Mark intention ${index} done`}
          className="shrink-0 py-2"
        >
          {box}
        </button>
      ) : (
        box
      )}
    </div>
  )
}

function ValuePicker({
  selected,
  onToggle,
}: {
  selected: string[]
  onToggle: (value: string) => void
}) {
  const chosen = new Set(selected)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="label">Select as many as you like</p>
        <p className="label">{chosen.size} selected</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {VALUES.map((value) => {
          const on = chosen.has(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              aria-pressed={on}
              className={`pill !normal-case transition-colors ${
                on
                  ? '!border-accent-ink !bg-accent-soft !text-ink'
                  : 'hover:!border-line-strong hover:!text-ink'
              }`}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}
