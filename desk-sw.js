// Only public app files are cached. API and authentication requests pass through.
const CACHE = "desk-static-v1";
const FILES = ["/desk.html", "/desk.webmanifest", "/assets/img/desk-icon-192.png", "/assets/img/desk-icon-512.png", "/assets/js/app-install.js?v=20261105"];
const allowed = new Set(FILES.map(p => new URL(p, self.location.origin).pathname));
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("desk-static-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if(e.request.method !== 'GET' || u.origin !== self.location.origin || !allowed.has(u.pathname)) return;
  e.respondWith(fetch(e.request).then(r => {
    if(r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy))); }
    return r;
  }).catch(async () => (await caches.match(e.request)) || (e.request.mode === 'navigate' ? await caches.match("/desk.html") : null) || Response.error()));
});
