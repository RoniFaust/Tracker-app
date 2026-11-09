// Offline support: serve the app shell from cache, refresh it in the background.
const CACHE = 'tracker-v2';
const SHELL = ['./tracker.html', './tracker-manifest.json', './tracker-icon-192.png', './tracker-icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // fonts etc. go straight to the network
  // network first for the page itself (so updates arrive), cache as fallback offline
  e.respondWith(
    // no-cache: always ask the server whether there is a newer version (skips the browser's 10-minute cache)
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./tracker.html')))
  );
});
