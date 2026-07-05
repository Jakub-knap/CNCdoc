// CNCdok service worker — appka sa da otvorit aj offline
const CACHE = 'cncdok-v1';
const SHELL = [
  './app.html',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = req.url;

  // Nikdy necachuj Firebase/Firestore/Auth volania — riesi to Firestore sam (offline persistence)
  if (req.method !== 'GET') return;
  if (url.includes('googleapis.com') || url.includes('identitytoolkit') ||
      url.includes('securetoken') || url.includes('firebaseio') || url.includes('firebaseinstallations')) {
    return; // nechaj prehliadac / Firestore
  }

  // HTML stranky -> network-first (online = cerstva verzia, offline = z cache)
  if (req.mode === 'navigate' || url.endsWith('.html')) {
    e.respondWith(
      fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./app.html')))
    );
    return;
  }

  // Ostatne (Firebase SDK z gstatic, fonty, ikony) -> cache-first + doplnenie do cache
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => { try { c.put(req, copy); } catch (_) {} }).catch(() => {});
        return resp;
      }).catch(() => cached);
    })
  );
});
