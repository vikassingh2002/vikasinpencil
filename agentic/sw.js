/* Agentic-only worker. Never handles Desk or caches authentication/API responses. */
const CACHE = 'agentic-static-public12';
const SHELL = ['/agentic/','/agentic/manifest.webmanifest','/agentic/icon-192.png','/agentic/icon-512.png','/agentic/icon-maskable.png','/assets/css/cat.css?v=20261029-public12','/content/ai-articles.js?v=20261029-public12','/assets/js/agentic-store.js?v=20261029-public12','/assets/js/agentic-art.js?v=20261029-public12','/assets/js/agentic-charts.js?v=20261029-public12','/assets/js/agentic.js?v=20261029-public12','/assets/js/agentic-install.js?v=20261029-public12','/assets/fonts/newsreader.ttf','/assets/fonts/newsreader-italic.ttf','/assets/fonts/roboto-condensed.ttf'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('agentic-static-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const eligible = url.pathname.startsWith('/assets/') || url.pathname === '/content/ai-articles.js' || url.pathname.startsWith('/agentic/');
  if (!eligible) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') await cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') return (await cache.match('/agentic/')) || Response.error();
      return Response.error();
    }
  })());
});
