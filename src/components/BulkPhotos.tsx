'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraIcon } from './icons'

/**
 * Hands over a week of written pages at once.
 *
 * Photographing an entry one at a time is right when somebody is on that entry.
 * At the end of a week with seven spreads on the desk it is seven trips through
 * the same flow, and the thing most likely to happen instead is that the pages
 * stay on the desk.
 *
 * Sent one at a time rather than as a batch, on purpose. Fourteen images in one
 * request is a long silence and one failure loses all of it; one at a time
 * means the count climbs while they watch and a page that cannot be read costs
 * only itself.
 */

/** Enough for a week of spreads photographed twice over, and no more. */
const MAX_PHOTOS = 14

/** Long edge, in pixels. Plenty for handwriting, small enough to send. */
const LONGEST_EDGE = 2200

type Result =
  | { file: string; placed: true; entry: number; title: string; added: number; kept: number }
  | { file: string; placed: false; reason: string }

async function shrink(file: File): Promise<{ data: string; type: string } | null> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return null

  const scale = Math.min(1, LONGEST_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  const url = canvas.toDataURL('image/jpeg', 0.86)
  return { data: url.slice(url.indexOf(',') + 1), type: 'image/jpeg' }
}

export function BulkPhotos({ week }: { week: number }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [working, setWorking] = useState(false)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [problem, setProblem] = useState('')

  async function handle(files: FileList | null) {
    if (!files?.length) return

    const chosen = Array.from(files).slice(0, MAX_PHOTOS)
    setWorking(true)
    setProblem(files.length > MAX_PHOTOS ? `Taking the first ${MAX_PHOTOS}.` : '')
    setResults([])
    setDone(0)
    setTotal(chosen.length)

    const out: Result[] = []

    for (const file of chosen) {
      try {
        const shrunk = await shrink(file)
        if (!shrunk) {
          out.push({ file: file.name, placed: false, reason: 'That file could not be opened.' })
          setResults([...out])
          setDone(out.length)
          continue
        }

        const response = await fetch('/api/journal/bulk', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ week, image: shrunk.data, type: shrunk.type }),
        })
        const payload = await response.json()

        out.push(
          response.ok && payload.placed
            ? { file: file.name, placed: true, ...payload }
            : {
                file: file.name,
                placed: false,
                reason: payload.reason ?? payload.error ?? 'That did not work.',
              },
        )
      } catch {
        out.push({ file: file.name, placed: false, reason: 'Could not reach the server.' })
      }

      setResults([...out])
      setDone(out.length)
    }

    setWorking(false)
    if (input.current) input.current.value = ''
    // The entries themselves have changed, so anything showing them is stale.
    router.refresh()
  }

  const placed = results.filter((r) => r.placed).length

  return (
    <div>
      <p className="!mb-4 max-w-xl text-[0.9375rem] leading-relaxed text-ink-72">
        Writing on paper this week? Photograph the spreads and add them all at once. Each one is
        read and filed against the entry it belongs to. Anything you have already typed is left
        alone.
      </p>

      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handle(e.target.files)}
        className="hidden"
        id={`bulk-${week}`}
      />

      <label
        htmlFor={`bulk-${week}`}
        className={`label inline-flex cursor-pointer items-center gap-2 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink ${
          working ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        <CameraIcon />
        {working ? `Reading ${done} of ${total}` : 'Add this week’s pages'}
      </label>

      {problem ? <p className="mt-3 !mb-0 text-[0.875rem] text-ink">{problem}</p> : null}

      {results.length ? (
        <div className="mt-5">
          <p className="label !mb-3">
            {placed} of {results.length} filed
          </p>
          <ul className="!mb-0 !list-none !pl-0 flex flex-col">
            {results.map((result, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line py-2.5 text-[0.9375rem]"
              >
                {result.placed ? (
                  <>
                    <span className="pill !text-ink">Entry {result.entry}</span>
                    <span className="min-w-0 flex-1 truncate">{result.title}</span>
                    <span className="label !text-ink-40">
                      {result.added
                        ? `${result.added} filled in`
                        : 'nothing new, already written'}
                      {result.kept ? `, ${result.kept} left as you had it` : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="pill">Not filed</span>
                    <span className="min-w-0 flex-1 truncate !text-ink-56">{result.file}</span>
                    <span className="label !text-ink-40">{result.reason}</span>
                  </>
                )}
              </li>
            ))}
          </ul>

          {results.some((r) => !r.placed) ? (
            <p className="mt-4 !mb-0 text-[0.875rem] leading-relaxed !text-ink-56">
              A page that could not be placed is usually one where the printed number at the top is
              cut off. Open that entry and photograph it there, where it already knows which page it
              is.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
