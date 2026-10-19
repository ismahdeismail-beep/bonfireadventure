/*
 * Bonfire Adventures service worker.
 *
 * Two jobs:
 *   1. Make the site *installable* — a registered service worker is one of the
 *      hard requirements browsers check before offering "Install app".
 *   2. Keep the shell usable on a flaky mobile connection (cached styles,
 *      script, logo and the pages the traveller already visited).
 *
 * Deliberately conservative: only GETs, same-origin, and never anything private.
 * Account, staff, booking and API responses are never cached, so a shared phone
 * cannot replay somebody else's signed-in page.
 */

const VERSION = 'bonfire-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const PAGE_CACHE = `${VERSION}-pages`;

const OFFLINE_FALLBACK = '/offline';

/* Never cached: private or state-changing surfaces. (/offline is public and
 * deliberately cached, so it can be reached while the network is down.) */
const PRIVATE_PREFIXES = ['/account', '/staff', '/bookings', '/api', '/healthz'];

/* Small, stable set. `addAll` is all-or-nothing, so each entry is settled
 * independently — one bad URL cannot abort the whole install. */
const SHELL = [
  '/',
  '/offers',
  '/how-booking-works',
  '/offline',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/img/logo.webp',
  '/img/icon-192.png',
  '/favicon.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(
      SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' }))),
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

function isPrivate(url) {
  return PRIVATE_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (isPrivate(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (['style', 'script', 'image', 'font', 'manifest'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Pages: always try the network so a deploy is visible immediately; fall back to
 * the cached copy (then the offline page) when the connection is gone.
 */
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    // Do not persist personalised HTML (a signed-in header, a CSRF token).
    if (fresh && fresh.ok && !fresh.headers.get('Set-Cookie')) {
      const cache = await caches.open(PAGE_CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    // Read across every cache: a page may live in the page cache, while the
    // offline fallback and the shared assets live in the shell cache.
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const fallback = await caches.match(OFFLINE_FALLBACK, { ignoreSearch: true });
    if (fallback) return fallback;

    return new Response('You are offline. Bonfire Adventures needs a connection for this page.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

/** Static assets: serve the cached copy instantly, refresh it in the background. */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request, { ignoreSearch: true });

  const network = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        const cache = await caches.open(SHELL_CACHE);
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}
