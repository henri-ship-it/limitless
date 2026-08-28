'use client'

import { useState, useTransition } from 'react'
import { wipeMyEntries } from '@/app/actions'

/**
 * Clears everything the member has written, so they can begin again.
 *
 * Asks twice, because there is no undo and the thing being deleted is weeks of
 * their own reflection. The printed journal is untouched either way.
 */
export function WipeEntries({ count }: { count: number }) {
  const [asking, setAsking] = useState(false)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  if (done) {
    return <p className="!mb-0 text-[0.9375rem] text-ink-56">Your entries have been deleted.</p>
  }

  if (!count) {
    return <p className="!mb-0 text-[0.9375rem] text-ink-56">You have not written anything yet.</p>
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
      >
        Delete my entries
      </button>
    )
  }

  return (
    <div className="border border-line p-4">
      <p className="!mb-3 text-[0.9375rem] leading-relaxed text-ink">
        This deletes all {count} of your entries, on every device, and cannot be undone. Your
        printed journal is not affected.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await wipeMyEntries()
              setDone(true)
            })
          }
          className="label !text-white bg-ink px-4 py-2.5 hover:bg-ink-72 disabled:opacity-60"
        >
          {pending ? 'Deleting' : 'Yes, delete everything'}
        </button>
        <button
          type="button"
          onClick={() => setAsking(false)}
          className="label border border-line px-4 py-2.5 hover:border-ink hover:!text-ink"
        >
          Keep them
        </button>
      </div>
    </div>
  )
}
