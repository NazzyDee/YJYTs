/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'your-journey-your-tools-v3';
// Add any other static assets that need to be cached for offline use.
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/assets/icon-72x72.png',
  '/assets/icon-96x96.png',
  '/assets/icon-128x128.png',
  '/assets/icon-144x144.png',
  '/assets/icon-152x152.png',
  '/assets/icon-192x192.png',
  '/assets/icon-384x384.png',
  '/assets/icon-512x512.png',
  // Precaching external dependencies for robust offline support
  'https://esm.sh/react@18.2.0',
  'https://esm.sh/react-dom@18.2.0/client',
  'https://esm.sh/@google/genai@1.15.0',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap'
];

// Install event: opens a cache and adds the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use a request with no-cors mode for external resources to be safe,
        // although esm.sh and googleapis should have CORS headers.
        const requests = urlsToCache.map(url => new Request(url, { mode: 'no-cors' }));
        return cache.addAll(requests);
      })
      .catch(err => {
        console.error('Failed to cache app shell', err);
      })
  );
});

// Fetch event: serves requests from the cache first (cache-first strategy).
// If a request is not in the cache, it's fetched from the network,
// cached, and then returned to the application.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from the cache.
        if (response) {
          return response;
        }

        // Not in cache - fetch from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response.
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // We don't cache opaque responses to avoid filling cache with errors
            if (networkResponse.type === 'opaque') {
              return networkResponse;
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // We don't want to cache calls to the Gemini API as they are dynamic.
                if (!event.request.url.includes('generativelanguage')) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        ).catch(error => {
            // This will be triggered if the network is unavailable.
            // You could return a custom offline page here if you had one.
            console.error('Fetching from network failed:', error);
            throw error;
        });
      })
  );
});

// Activate event: cleans up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Notification click event: focuses the app window or opens it.
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // If a window for the app is already open, focus it.
      for (const client of clientList) {
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
