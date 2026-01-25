// Service Worker for Movies.to
// Provides offline support, caching strategies, and push notifications

const CACHE_VERSION = 'v1.1.0';
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

  // Handle push subscription status check
  if (event.data && event.data.type === 'CHECK_PUSH_SUBSCRIPTION') {
    self.registration.pushManager.getSubscription().then((subscription) => {
      event.ports[0].postMessage({
        type: 'PUSH_SUBSCRIPTION_STATUS',
        subscribed: !!subscription,
        subscription: subscription ? subscription.toJSON() : null,
      });
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  }

  if (event.tag === 'sync-ratings') {
    event.waitUntil(syncRatings());
  }
});

async function syncWatchlist() {
  console.log('[Service Worker] Syncing watchlist...');
  // Get pending watchlist operations from IndexedDB and sync
  try {
    const pendingOps = await getPendingOperations('watchlist');
    for (const op of pendingOps) {
      await fetch('/api/watchlist', {
        method: op.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op.data),
        credentials: 'include',
      });
      await removePendingOperation('watchlist', op.id);
    }
  } catch (error) {
    console.error('[Service Worker] Watchlist sync failed:', error);
  }
}

async function syncRatings() {
  console.log('[Service Worker] Syncing ratings...');
  // Similar implementation for ratings
}

// Helper functions for IndexedDB operations
function getPendingOperations(store) {
  // This would use IndexedDB to get pending operations
  return Promise.resolve([]);
}

function removePendingOperation(store, id) {
  // This would remove the operation from IndexedDB
  return Promise.resolve();
}

// =====================================================
// Push Notification Handlers
// =====================================================

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');

  let data = {
    title: 'Movies.to',
    body: 'New update available!',
    icon: '/logo.svg',
    badge: '/logo.svg',
    url: '/',
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo.svg',
    badge: data.badge || '/logo.svg',
    image: data.image,
    tag: data.tag || 'movies-to-notification',
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      url: data.url || data.data?.url || '/',
      type: data.type || data.data?.type || 'general',
      movieId: data.movieId || data.data?.movieId,
      listId: data.listId || data.data?.listId,
      timestamp: Date.now(),
    },
    actions: getNotificationActions(data.type || data.data?.type),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Get notification actions based on type
function getNotificationActions(type) {
  switch (type) {
    case 'new_release':
      return [
        { action: 'view', title: 'View Details', icon: '/logo.svg' },
        { action: 'watchlist', title: 'Add to Watchlist', icon: '/logo.svg' },
      ];
    case 'recommendation':
      return [
        { action: 'view', title: 'View Movie', icon: '/logo.svg' },
        { action: 'dismiss', title: 'Not Interested', icon: '/logo.svg' },
      ];
    case 'list_update':
      return [
        { action: 'view', title: 'View List', icon: '/logo.svg' },
      ];
    case 'social':
      return [
        { action: 'view', title: 'View Profile', icon: '/logo.svg' },
        { action: 'follow_back', title: 'Follow Back', icon: '/logo.svg' },
      ];
    default:
      return [
        { action: 'view', title: 'View', icon: '/logo.svg' },
        { action: 'dismiss', title: 'Dismiss', icon: '/logo.svg' },
      ];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);

  event.notification.close();

  const data = event.notification.data || {};
  let url = data.url || '/';

  // Handle specific actions
  switch (event.action) {
    case 'view':
      url = data.url || '/';
      break;
    case 'watchlist':
      if (data.movieId) {
        url = `/movie/${data.movieId}?action=watchlist`;
      }
      break;
    case 'follow_back':
      if (data.userId) {
        url = `/profile/${data.userId}?action=follow`;
      }
      break;
    case 'dismiss':
      // Just close, already done above
      return;
    default:
      // Default action is to open the URL
      break;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            url: url,
            data: data,
          });
          return;
        }
      }
      // If no window is open, open a new one
      return clients.openWindow(url);
    })
  );

  // Track notification interaction
  trackNotificationInteraction(data, event.action || 'click');
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed');
  const data = event.notification.data || {};
  trackNotificationInteraction(data, 'close');
});

// Track notification interactions for analytics
async function trackNotificationInteraction(data, action) {
  try {
    await fetch('/api/analytics/notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: data.type,
        action: action,
        movieId: data.movieId,
        listId: data.listId,
        timestamp: Date.now(),
      }),
      credentials: 'include',
    });
  } catch (error) {
    // Silently fail - analytics are not critical
    console.log('[Service Worker] Failed to track notification interaction');
  }
}

// =====================================================
// Push Subscription Management
// =====================================================

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Service Worker] Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(self.VAPID_PUBLIC_KEY || ''),
    })
    .then((subscription) => {
      // Send new subscription to server
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
        credentials: 'include',
      });
    })
    .catch((error) => {
      console.error('[Service Worker] Failed to resubscribe:', error);
    })
  );
});

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Periodic background sync for keeping content fresh
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'refresh-recommendations') {
    event.waitUntil(refreshRecommendationsCache());
  }

  if (event.tag === 'check-new-releases') {
    event.waitUntil(checkNewReleases());
  }
});

async function refreshRecommendationsCache() {
  console.log('[Service Worker] Refreshing recommendations cache');
  // Fetch fresh recommendations and cache them
}

async function checkNewReleases() {
  console.log('[Service Worker] Checking for new releases');
  // Check for new releases and potentially show notification
}
