/* ============================================================
   Service Worker — Sharing Fair (PWA)
   - Précache : page hors-ligne + icônes de l'app
   - Navigations : réseau d'abord, repli hors-ligne (jamais de
     HTML mis en cache : les pages sont authentifiées/dynamiques)
   - Assets statiques & polices : cache d'abord
   ============================================================ */

const VERSION = 'v1';
const CACHE = `sharing-fair-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE = [
  OFFLINE_URL,
  '/logo.svg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

/* CDN des polices autorisés au cache (requêtes cross-origin). */
const CACHEABLE_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com', 'rsms.me']);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isCacheableAsset(url) {
  if (url.origin === self.location.origin) {
    return (
      url.pathname.startsWith('/_astro/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname === '/logo.svg' ||
      url.pathname === '/favicon.svg' ||
      url.pathname === '/manifest.webmanifest'
    );
  }
  return CACHEABLE_HOSTS.has(url.hostname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* --- Navigations : réseau d'abord, repli hors-ligne --- */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        return offline || Response.error();
      })
    );
    return;
  }

  /* --- Assets statiques & polices : cache d'abord --- */
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok || response.type === 'opaque') {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
          }
          return response;
        });
      })
    );
  }
});
