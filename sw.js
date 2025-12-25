const CACHE_NAME = 'schan-v4.1';
const ASSETS = [
  '/',
  '/index.html',
  '/player.html',
  '/style.css',
  '/script.js',
  '/player.js',
  '/json/shows.json',
  '/json/manifest.json',
  '/assets/image.webp',
  '/assets/courageTheCowardlyDog.webp',
  '/assets/doraemon.webp',
  '/assets/ninjaHattori.webp',
  '/assets/oggyAndTheCockroaches.webp',
  '/assets/pinkPanther.webp',
  '/assets/shinchan.webp',
  '/assets/tomAndJerry.webp'
];

async function purgeAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  const data = e.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (data.type === 'PURGE_CACHES') {
    e.waitUntil(purgeAllCaches().then(() => self.clients.claim()));
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('version.json')) {
    e.respondWith(fetch(e.request, { cache: 'no-store' }));
    return;
  }

  const isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document';

  if (isNavigation) {
    e.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const fresh = await fetch(e.request);
          if (fresh && fresh.ok) await cache.put(e.request, fresh.clone());
          return fresh;
        } catch {
          const cached = await cache.match(e.request);
          if (cached) return cached;
          return caches.match('/index.html');
        }
      })()
    );
    return;
  }

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(e.request);
      const fetchPromise = fetch(e.request)
        .then((fresh) => {
          if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
          return fresh;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })()
  );
});
