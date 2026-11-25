'use client'

import { useState, useTransition } from 'react'

import { restartTour } from '@/app/actions'

/** Puts the walkthrough back, from the account page. */
export function RestartTour() {
  const [done, setDone] = useState(false)
  const [running, start] = useTransition()

  return (
    <button
      type="button"
      disabled={running || done}
      onClick={() =>
        start(async () => {
          await restartTour()
          setDone(true)
        })
      }
      className="border border-line px-5 py-3 text-[0.9375rem] transition-colors hover:border-line-strong disabled:opacity-60"
    >
      {done ? 'It will start next time you open the platform' : 'Show me round again'}
    </button>
  )
}
