'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker, which is what makes the platform installable.
 *
 * Waits for the page to settle rather than racing it: nothing here is needed to
 * read a chapter, and a member arriving on a phone should get the page first.
 *
 * Development is left alone. A worker held in a browser across rebuilds is a
 * confusing thing to debug, and the one useful thing it does - being installable
 * - is not something worth checking locally.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // An install that fails costs nothing: the site works exactly as before.
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register)

    return () => window.removeEventListener('load', register)
  }, [])

  return null
}
