'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createDwell } from '@/lib/dwell'

const FLUSH_EVERY_MS = 20_000

/**
 * Counts seconds actually spent reading a page.
 *
 * Only while the tab is visible, so a page left open behind another window
 * does not report hours. Sent in batches rather than continuously, and once
 * more when the page is hidden or closed, which is the only moment a real
 * reader is guaranteed to produce.
 */
export function TimeOnPage() {
  const pathname = usePathname()
  const params = useSearchParams()
  const noted = useRef(false)

  /*
   * Where they came in from. Kit knows who opened a digest and who clicked;
   * this is the other half, what happened once they landed. Append ?from=digest
   * to the links in a broadcast and it lands here.
   */
  const from = params.get('from') ?? params.get('utm_source')
  useEffect(() => {
    if (!from || noted.current) return
    noted.current = true
    /*
     * .then() is not decoration. A Supabase query builder is a lazy thenable:
     * it holds the request and only sends it when something awaits it. Written
     * as `void client.rpc(...)` it is built, discarded, and never sent - which
     * is why no arrival and no second of reading time was ever recorded.
     */
    createClient()
      .rpc('record_arrival', { source: from, page: pathname })
      .then(() => {}, () => {})
  }, [from, pathname])

  useEffect(() => {
    const supabase = createClient()
    const dwell = createDwell()
    const here = () => document.visibilityState === 'visible'

    const send = () => {
      const amount = dwell.flush(here())
      // See the note above: without .then() the request is never sent.
      if (amount) {
        supabase.rpc('add_time', { page: pathname, amount }).then(() => {}, () => {})
      }
    }

    const onVisibility = () => {
      if (here()) dwell.resume()
      else send()
    }

    if (here()) dwell.resume()
    const flushTimer = setInterval(send, FLUSH_EVERY_MS)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', send)

    return () => {
      clearInterval(flushTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', send)
      dwell.pause()
      send()
    }
  }, [pathname])

  return null
}
