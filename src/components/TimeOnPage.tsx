'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  const seconds = useRef(0)
  const since = useRef<number | null>(null)
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
    void createClient().rpc('record_arrival', { source: from, page: pathname })
  }, [from, pathname])

  useEffect(() => {
    const supabase = createClient()
    let flushTimer: ReturnType<typeof setInterval>

    const bank = () => {
      if (since.current === null) return
      seconds.current += Math.round((Date.now() - since.current) / 1000)
      since.current = null
    }

    const send = () => {
      bank()
      const amount = seconds.current
      if (amount < 3) return
      seconds.current = 0
      void supabase.rpc('add_time', { page: pathname, amount })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        since.current = Date.now()
      } else {
        send()
      }
    }

    if (document.visibilityState === 'visible') since.current = Date.now()
    flushTimer = setInterval(send, FLUSH_EVERY_MS)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', send)

    return () => {
      clearInterval(flushTimer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', send)
      send()
    }
  }, [pathname])

  return null
}
