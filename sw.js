const CACHE_NAME = 'trucogol-v177';

// App shell + páginas SEO. El resto de JS/CSS se cachea en runtime.
// Las páginas SEO van acá para que offline se sirvan ELLAS: el fallback del
// handler de fetch devuelve index.html bajo CUALQUIER URL, o sea que sin
// precachearlas /como-jugar.html serviría el juego.
// OJO: nada de CSS ni de JS del juego acá — en producción el deploy los
// bundlea y BORRA los archivos sueltos, y un solo 404 hace fallar
// cache.addAll() → el SW no se instala nunca. (Al CSS ya le pasaba; el
// 9-ago se sumó el bundle de JS y hubo que sacar cartas/juego/juego_ui/ia
// por el mismo motivo.) Tampoco se pone app.bundle.js: no existe en el
// server de dev, que sirve los 49 sueltos, y rompería el SW ahí.
// Todo eso lo cachea el handler de fetch en la primera visita.
//
// ⚠️ 11-ago: acá estaba también '/landing.html' — 58 KB que se bajaba TODO
// jugador en su primera visita. Esa página promocionaba "torneos con
// apuestas" (por eso ya estaba fuera del sitemap a propósito) y no estaba
// linkeada desde ningún lado: nadie llegaba a ella jugando. Salió del
// precache primero y del SITIO después (se borró public/landing.html, que es
// lo único que hacía falta: el deploy copia public/* a la raíz). Está en el
// historial de git si alguna vez se la quiere de vuelta.
// Las otras dos páginas SEO se quedan: ésas SÍ están linkeadas desde el menú
// ("Guías del truco").
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
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
//  · Todo lo demás same-origin (HTML/JS/CSS) → network-first CON REVALIDACIÓN:
//    fetch va con cache:'no-cache' porque GitHub Pages sirve max-age=600 y un
//    fetch() normal usa el cache HTTP — resultado: hasta 10 minutos de código
//    viejo AUNQUE la estrategia sea "network"-first. Eso era lo que obligaba a
//    la doble/triple recarga después de cada deploy. Con no-cache el browser
//    revalida contra el ETag (304 = barato) y el código llega fresco siempre.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;

  if (_esImagen(url) || _esFuente(url)) {
    e.respondWith(
      caches.match(req).then(cached => cached || fetch(req).then(res => {
        // Google Fonts llega como respuesta OPACA (status 0, res.ok=false,
        // el <link> va sin crossorigin): sin esta rama las fuentes no se
        // cacheaban nunca y "fuentes offline" era mentira.
        if (res.ok || res.type === 'opaque') { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(req, clone)); }
        return res;
      }).catch(() => cached || Response.error()))
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
