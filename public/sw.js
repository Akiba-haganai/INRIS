// Minimal service worker for installability + a basic offline fallback.
//
// Deliberately conservative: this app is data-driven and most of it is
// either public-but-live (guidance, which can change) or staff-only and
// sensitive (cases, case_analysis, audit_logs). A naive "cache
// everything" service worker risks serving stale guidance as if it were
// current, or — worse — caching an authenticated staff response that a
// later, logged-out visitor could conceivably be served from cache.
//
// So this worker only ever caches static, non-sensitive shell assets
// (icons, manifest, the offline fallback page itself) and never touches
// /api/* or /staff/* at all. Everything else always goes to the network;
// if the network fails on a page navigation, the offline fallback is
// shown instead of a browser error page.

const CACHE_NAME = 'inris-shell-v1'
const SHELL_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never intercept API calls or staff routes — always hit the network,
  // never read or write them into the cache.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/staff')) {
    return
  }

  // Page navigations: try the network first (so content is never stale
  // while online), fall back to the offline page only if the network
  // request fails outright.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Static shell assets only: cache-first, network fallback.
  if (SHELL_ASSETS.some((asset) => url.pathname === asset)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    )
  }
})
