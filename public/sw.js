// Service Worker for Movies.to
// Provides offline support and caching strategies

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `movies-to-${CACHE_VERSION}`;

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/favicon.svg',
  '/movie-poster-fallback.svg',
  '/manifest.json',
];

// TMDB image URLs to cache (dynamic)
const IMAGE_CACHE_NAME = `movies-to-images-${CACHE_VERSION}`;
const API_CACHE_NAME = `movies-to-api-${CACHE_VERSION}`;

// Maximum age for cached items (in milliseconds)
const MAX_AGE = {
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 5 * 60 * 1000, // 5 minutes
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return (
                name.startsWith('movies-to-') &&
                name !== CACHE_NAME &&
                name !== IMAGE_CACHE_NAME &&
                name !== API_CACHE_NAME
              );
            })
            .map((name) => {
              console.log('[Service Worker] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle TMDB images
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE_NAME, MAX_AGE.images));
    return;
  }

  // Handle TMDB API calls
  if (url.hostname === 'api.themoviedb.org') {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME, MAX_AGE.api));
    return;
  }

  // Handle app routes (SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Handle static assets
  event.respondWith(cacheFirstStrategy(request, CACHE_NAME, MAX_AGE.static));
});

// Cache-first strategy: Check cache first, then network
async function cacheFirstStrategy(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedTime = new Date(cached.headers.get('sw-cached-time')).getTime();
    const now = Date.now();

    // Return cached response if not expired
    if (now - cachedTime < maxAge) {
      return cached;
    }
  }

  // Fetch from network
  try {
    const response = await fetch(request);

    if (response.ok) {
      // Clone response and add timestamp
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-cached-time', new Date().toISOString());

      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
    }

    return response;
  } catch (error) {
    // If network fails, return cached version even if expired
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirstStrategy(request, cacheName, maxAge) {
  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(cacheName);
      const headers = new Headers(response.headers);
      headers.append('sw-cached-time', new Date().toISOString());

      const modifiedResponse = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers,
      });

      cache.put(request, modifiedResponse);
    }

    return response;
  } catch (error) {
    // Network failed, try cache
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    throw error;
  }
}

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name.startsWith('movies-to-')) {
              return caches.delete(name);
            }
          })
        );
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  }
});

async function syncWatchlist() {
  // This would sync watchlist changes when back online
  console.log('[Service Worker] Syncing watchlist...');
  // Implementation would depend on your backend API
}

// Push notifications (for future implementation)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Movies.to';
  const options = {
    body: data.body || 'New update available!',
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
