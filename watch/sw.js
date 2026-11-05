// Only public app files are cached. API and authentication requests pass through.
const CACHE = "watch-static-v2";
const FILES = ["/watch/", "/watch/manifest.webmanifest", "/watch/css/style.css", "/watch/css/pencil.css", "/watch/js/app.js", "/watch/js/store.js", "/watch/js/rec.js", "/watch/js/data.js", "/watch/js/compass.js", "/watch/icon-192.png", "/watch/icon-512.png", "/assets/js/app-install.js?v=20261105"];
const allowed = new Set(FILES.map(p => new URL(p, self.location.origin).pathname));
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("watch-static-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== self.location.origin || !allowed.has(u.pathname)) return;
  e.respondWith(fetch(e.request).then(r => {
    if(r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy))); }
    return r;
  }).catch(async () => (await caches.match(e.request)) || (e.request.mode === 'navigate' ? await caches.match("/watch/") : null) || Response.error()));
});
