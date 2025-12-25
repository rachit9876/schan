const CACHE_NAME = 'schan-v1';
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

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('version.json')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
