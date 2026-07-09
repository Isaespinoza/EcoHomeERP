/* DreamRest ERP service worker
   Objetivo: hacer la app instalable (PWA) y darle un fallback offline del shell.
   Estrategia: network-first para la navegación (siempre trae la última versión
   cuando hay internet; si no hay, sirve el index cacheado). Los recursos de
   Firebase/Firestore/CDN son cross-origin y NO pasan por acá: quedan siempre online. */
const CACHE = 'dreamrest-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
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
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo manejamos mismo origen; Firebase/Firestore/CDN pasan directo a la red.
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Resto de assets propios: cache-first con relleno desde la red.
  e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
