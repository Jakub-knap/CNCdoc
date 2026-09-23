// CNCdok service worker — appka sa da otvorit aj offline
//
// DOLEZITE: pri kazdej vacsej zmene appky zvys cislo verzie nizsie (v2 -> v3 ...).
// Stara pamat sa tym automaticky vymaze a vsetci dostanu cerstve subory.
const CACHE = 'cncdok-v2';
const SHELL = [
  './app.html',
  './index.html',
  './subscription.js',
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

  // Nikdy necachuj Firebase/Firestore/Auth/Storage volania — riesi to Firebase sam
  if (req.method !== 'GET') return;
  if (url.includes('googleapis.com') || url.includes('identitytoolkit') ||
      url.includes('securetoken') || url.includes('firebaseio') ||
      url.includes('firebaseinstallations') || url.includes('firebasestorage')) {
    return;
  }

  const sameOrigin = new URL(url).origin === self.location.origin;

  // VLASTNE SUBORY APPKY (html, subscription.js, manifest...) -> network-first:
  // online = vzdy najnovsia verzia z Vercelu, offline = posledna ulozena kopia.
  // (Predtym boli .js subory cache-first, takze sa novsia verzia nikdy nestiahla.)
  if (req.mode === 'navigate' || sameOrigin) {
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() =>
        caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./app.html') : undefined))
      )
    );
    return;
  }

  // CUDZIE SUBORY (Firebase SDK z gstatic, fonty) -> cache-first.
  // Maju pevne cislo verzie v adrese, takze sa nemenia - cache je tu bezpecna a rychla.
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
