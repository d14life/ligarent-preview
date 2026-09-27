// Bump this name if a local image changes without changing its filename.
const IMAGE_CACHE = 'ligarent-images-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('ligarent-images-') && name !== IMAGE_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/assets/') || !/\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(url.pathname)) return;

  event.respondWith((async () => {
    let cache;
    try {
      cache = await caches.open(IMAGE_CACHE);
      const saved = await cache.match(request);
      if (saved) return saved;
    } catch {}
    const response = await fetch(request);
    if (cache && response.ok && response.type === 'basic') event.waitUntil(cache.put(request,response.clone()).catch(() => {}));
    return response;
  })());
});
