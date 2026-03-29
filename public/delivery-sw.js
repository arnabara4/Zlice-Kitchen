/**
 * Delivery Service Worker
 * 
 * Handles push notifications, caching, and offline support for the delivery app.
 * Separate from canteen SW for strict role isolation.
 * 
 * PUSH NOTIFICATION SOUND SYSTEM:
 * - Extracts sound type from payload.data.sound
 * - Always shows notification via showNotification()
 * - Sends PLAY_NOTIFICATION_SOUND message to active window clients
 * - Sound playback happens in client (browser autoplay policy compliance)
 * 
 * BROWSER LIMITATIONS:
 * - Sound ONLY plays when PWA has an active window AND user has interacted
 * - iOS Safari/PWA: Sound not supported due to strict autoplay restrictions
 * - Background/closed app: No sound (no active window client)
 */

const CACHE_NAME = 'delivery-app-v2';
const OFFLINE_URL = '/delivery-offline.html';

const urlsToCache = [
  '/delivery-offline.html',
  '/delivery-icon-192.png',
  '/delivery-icon-512.png',
  '/delivery/login',
  '/delivery/orders',
  '/delivery/payments',
  '/notification.mp3' // Preload delivery notification sound
];

// ============================================================================
// SERVICE WORKER LIFECYCLE
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[Delivery SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[Delivery SW] Caching app shell');
        // Cache files individually so one failure doesn't break everything
        const cachePromises = urlsToCache.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            return cache.put(url, response);
          } catch (err) {
            console.warn(`[Delivery SW] Failed to cache ${url}:`, err);
            return null;
          }
        });
        await Promise.all(cachePromises);
      })
      .catch((err) => {
        console.error('[Delivery SW] Cache open error:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Delivery SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('delivery-')) {
            console.log('[Delivery SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============================================================================
// FETCH HANDLING (Caching Strategy)
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests within delivery scope
  if (!url.pathname.startsWith('/delivery')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip Next.js internal routes and API calls
  if (url.pathname.startsWith('/_next/') || 
      url.pathname.startsWith('/api/') ||
      url.pathname.includes('__nextjs') ||
      url.pathname.includes('webpack') ||
      url.pathname.includes('hot-update')) {
    return;
  }

  // Network-first strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        });
      })
  );
});

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Push notification payload schema:
 * 
 * {
 *   title: string;           // Notification title
 *   body: string;            // Notification body
 *   type: 'delivery';        // Role targeting
 *   orderNumber?: string;    // Order number
 *   data?: {
 *     sound?: 'delivery-order' | 'delivery-ready';
 *     url?: string;          // Navigation URL
 *   }
 * }
 */

self.addEventListener('push', (event) => {
  console.log('[Delivery SW] Push received!');
  
  // Default notification data
  let notificationData = {
    title: 'New Delivery Order',
    body: 'A new delivery order is available!',
    type: 'delivery',
    orderNumber: null,
    data: {
      sound: 'delivery-order',
      url: '/delivery/orders'
    }
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      console.log('[Delivery SW] Push payload:', payload);
      
      // ROLE ISOLATION: Only process delivery notifications
      if (payload.type && payload.type !== 'delivery') {
        console.log('[Delivery SW] Ignoring non-delivery notification:', payload.type);
        return;
      }
      
      // Merge payload with defaults
      notificationData = {
        ...notificationData,
        ...payload,
        data: {
          ...notificationData.data,
          ...(payload.data || {})
        }
      };
    }
  } catch (e) {
    console.error('[Delivery SW] Error parsing push data:', e);
    if (event.data) {
      notificationData.body = event.data.text();
    }
  }
  
  // Build notification options
  const options = {
    body: notificationData.body,
    icon: '/delivery-icon-192.png',
    badge: '/delivery-icon-192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: notificationData.orderNumber 
      ? `delivery-${notificationData.orderNumber}` 
      : 'new-delivery',
    requireInteraction: true,
    actions: [
      { action: 'view', title: '🚚 View Order' },
      { action: 'dismiss', title: '✖ Dismiss' }
    ],
    data: {
      dateOfArrival: Date.now(),
      orderNumber: notificationData.orderNumber,
      url: notificationData.data?.url || '/delivery/orders',
      sound: notificationData.data?.sound || 'delivery-order'
    }
  };

  // Execute notification display and sound playback
  event.waitUntil(
    Promise.all([
      // 1. ALWAYS show the notification explicitly
      self.registration.showNotification(notificationData.title, options),
      
      // 2. Send sound playback request to active window clients
      sendSoundToClients(notificationData.data?.sound || 'delivery-order')
    ])
  );
});

/**
 * Send sound playback message to all active window clients
 * 
 * @param soundType - Sound type key (e.g., 'delivery-order')
 */
async function sendSoundToClients(soundType) {
  try {
    const allClients = await clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });
    
    console.log('[Delivery SW] Sending sound message to', allClients.length, 'client(s)');
    
    if (allClients.length === 0) {
      console.log('[Delivery SW] No active clients - sound will not play');
      return;
    }
    
    // Send message to all active clients
    allClients.forEach((client) => {
      client.postMessage({
        type: 'PLAY_NOTIFICATION_SOUND',
        sound: soundType,
        soundUrl: getSoundUrl(soundType)
      });
    });
  } catch (error) {
    console.error('[Delivery SW] Error sending sound message:', error);
  }
}

/**
 * Map sound type to URL for delivery
 */
function getSoundUrl(soundType) {
  const soundMap = {
    'delivery-order': '/notification.mp3',
    'delivery-ready': '/notification.mp3',
    'default': '/notification.mp3'
  };
  return soundMap[soundType] || soundMap['default'];
}

// ============================================================================
// NOTIFICATION CLICK HANDLING
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[Delivery SW] Notification clicked');
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  // Handle dismiss action
  if (action === 'dismiss') {
    return;
  }
  
  const targetUrl = notificationData.url || '/delivery/orders';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Find existing delivery window and focus it
        for (const client of clientList) {
          if (client.url.includes('/delivery') && 'focus' in client) {
            return client.focus().then(() => {
              // Navigate if needed
              if (!client.url.includes(targetUrl)) {
                return client.navigate(targetUrl);
              }
            });
          }
        }
        // No window open - open new one
        return clients.openWindow(targetUrl);
      })
      .catch((error) => {
        console.error('[Delivery SW] Error handling notification click:', error);
      })
  );
});

// ============================================================================
// BACKGROUND SYNC
// ============================================================================

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-delivery-status') {
    event.waitUntil(syncDeliveryStatus());
  }
});

async function syncDeliveryStatus() {
  console.log('[Delivery SW] Syncing delivery status...');
  // Implementation would sync any delivery status updates made while offline
}
