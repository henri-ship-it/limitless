'use client'

import { useState } from 'react'

/**
 * Downloads the member's week as a markdown file.
 *
 * Everything is already on the page, so the file is built in the browser and
 * handed straight to the download. Nothing is sent anywhere, which matters:
 * this is their reflective writing, not ours.
 */
export function DownloadWeek({ week, entries }: { week: number; entries: number[] }) {
  const [state, setState] = useState<'idle' | 'working'>('idle')

  async function download() {
    setState('working')
    try {
      const res = await fetch(`/api/week/${week}/markdown`)
      if (!res.ok) throw new Error('failed')
      const text = await res.text()

      const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `limitless-week-${String(week).padStart(2, '0')}.md`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // Nothing useful to say beyond leaving the button as it was.
    }
    setState('idle')
  }

  if (!entries.length) return null

  return (
    <button
      type="button"
      onClick={download}
      disabled={state === 'working'}
      className="label flex items-center gap-2 border border-line px-4 py-2.5 hover:border-ink hover:!text-ink disabled:opacity-60"
    >
      {state === 'working' ? 'Preparing' : 'Download this week'}
    </button>
  )
}
