/* Crystal Overdrive offline service worker.
 * Opt-in: it is only registered after the player enables Offline Play in Options.
 * The game files are downloaded into the 'crystal-overdrive-offline' cache by the page
 * (src/ui/offline/OfflineManager.ts); this worker just serves them cache-first. */
const CACHE = 'crystal-overdrive-offline';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        return await fetch(req);
      } catch (err) {
        // Offline and not cached: serve the app shell for page navigations
        if (req.mode === 'navigate') {
          const shell = await cache.match(new URL('./index.html', self.registration.scope).href);
          if (shell) return shell;
        }
        throw err;
      }
    })()
  );
});
