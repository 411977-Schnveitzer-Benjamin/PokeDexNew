/* Service worker de la Pokédex: funciona offline y cachea imágenes/fuentes en uso. */
const VERSION = 'pokedex-v4';
const SHELL = [
  './', 'index.html', 'styles.css', 'features.css', 'core.js', 'home.js', 'detail.js', 'tools.js', 'main.js',
  'pokemon-data.js', 'forms-data.js', 'moves-data.js', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);

  // Archivos propios: red primero (siempre actualizado), caché si no hay conexión
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  // Imágenes y fuentes externas: caché primero
  if (['image', 'font', 'style'].includes(req.destination)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => hit))
    );
  }
});
