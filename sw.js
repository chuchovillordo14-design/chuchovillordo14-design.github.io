const CACHE_NAME = 'trucogol-v22';

// App shell + páginas SEO. El resto de JS/CSS se cachea en runtime.
// Las páginas SEO van acá para que offline se sirvan ELLAS (antes el fallback
// devolvía index.html bajo cualquier URL, sirviendo el juego en /landing.html).
// OJO: nada de CSS acá — en producción el deploy bundlea y BORRA style.css,
// y un solo 404 hace fallar cache.addAll() → el SW no se instala nunca.
// El CSS lo cachea el handler de fetch en la primera visita.
const ASSETS = [
  '/',
  '/index.html',
  '/cartas.js',
  '/juego.js',
  '/juego_ui.js',
  '/ia.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/landing.html',
  '/como-jugar.html',
  '/reglamento.html',
];

// install: precachear el app shell.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      c.addAll(ASSETS.filter(a => !a.startsWith('http')))
    )
  );
  self.skipWaiting();
});

// activate: borrar TODO cache que no sea la versión actual (limpia el JS podrido).
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Clasificación de requests para elegir estrategia.
function _esImagen(url) { return /\.(webp|png|jpe?g|svg|gif|ico)$/i.test(url); }
function _esFuente(url) { return url.includes('fonts.googleapis') || url.includes('fonts.gstatic') || /\.(woff2?|ttf)$/i.test(url); }

// fetch:
//  · Imágenes y fuentes → cache-first (pesadas y estables; velocidad + offline).
//  · Todo lo demás same-origin (HTML/JS/CSS) → network-first: código siempre
//    fresco cuando hay red, con fallback a cache si estás offline.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;

  if (_esImagen(url) || _esFuente(url)) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)); }
        return res;
      }).catch(() => cached))
    );
    return;
  }

  // network-first para el código y la navegación. Revalidamos siempre
  // (no-cache) para no quedar pegados al HTTP cache heurístico del navegador
  // cuando el server no manda Cache-Control (p.ej. python http.server).
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)); }
      return res;
    }).catch(() => caches.match(req).then(c => c || caches.match('/index.html')))
  );
});

// Notificaciones push
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
