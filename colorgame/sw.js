const CACHE_NAME = 'color-pop-game-v1.1'; // Change version to update cache
const FILES_TO_CACHE = [
  './colorgame.html',
  './pop1.mp3',
  './pop2.mp3',
  './pop3.mp3',
  './fail.mp3',
  './yay.mp3',
  './icon-192x192.png', // Add your icon files
  './icon-512x512.png'  // Add your icon files
  // Add any other assets like CSS or specific JavaScript files if they were separate
];

// Install event: cache all critical assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting(); // Force the waiting service worker to become the active service worker.
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim()) // Take control of all open clients without a page reload.
  );
});

// Fetch event: serve assets from cache first, then network
self.addEventListener('fetch', event => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          }
        ).catch(error => {
          console.error('[ServiceWorker] Fetch failed; returning offline page instead.', error);
          // Optionally, return a generic offline page if an asset isn't cached and network fails
          // For this game, if an asset isn't cached, it probably means it's missing from FILES_TO_CACHE
        });
      })
  );
});