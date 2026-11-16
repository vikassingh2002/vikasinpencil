// Book Club: caches only the app's own files so it opens quickly and offline.
// Database, sign-in and book-lookup requests always go to the network.
const CACHE = "bookclub-static-v1";
const FILES = ["/bookclub/", "/bookclub/style.css?v=1", "/bookclub/app.js?v=1", "/bookclub/manifest.webmanifest",
  "/bookclub/icon.svg", "/bookclub/icon-192.png", "/assets/js/desk-config.js?v=bookclub1"];
const shell = new Set(FILES.map(p => new URL(p, self.location.origin).pathname));
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys()
  .then(keys => Promise.all(keys.filter(k => k.startsWith("bookclub-static-") && k !== CACHE).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== self.location.origin) return;
  const cover = u.pathname.startsWith("/bookclub/covers/");
  if (!shell.has(u.pathname) && !cover) return;
  if (cover) { // covers never change: cache first
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy))); }
      return r;
    })));
    return;
  }
  e.respondWith(fetch(e.request).then(r => { // app files: network first, so updates show at once
    if (r.ok) { const copy = r.clone(); e.waitUntil(caches.open(CACHE).then(c => c.put(e.request, copy))); }
    return r;
  }).catch(async () => (await caches.match(e.request)) || (e.request.mode === "navigate" ? await caches.match("/bookclub/") : Response.error())));
});
