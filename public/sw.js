/*
 * The service worker, kept as small as it can be.
 *
 * A service worker sits in front of every request a member makes, so a careless
 * one serves yesterday's app to someone who cannot clear it. This one caches
 * only what can never go stale: files under /_next/static, which carry a
 * content hash in their name and are replaced rather than updated, plus the
 * icons and fonts.
 *
 * Everything else goes to the network, every time. Pages are rendered on the
 * server for a signed-in member and are nobody else's business, so none of them
 * is ever written to a cache. Offline, a page request gets a plain apology
 * instead.
 *
 * The version is part of the cache name. Change it and the old cache goes.
 */
const VERSION = 'limitless-v1'
const OFFLINE = '/offline.html'

/** Only things whose contents cannot change under a given URL. */
function isImmutable(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll([OFFLINE]))
      // Take over straight away rather than waiting for every tab to close.
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  /*
   * A page. Always from the network, so nobody is ever shown a stale or
   * someone else's rendering of it. With no network, say so plainly.
   */
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)))
    return
  }

  if (!isImmutable(url)) return

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
