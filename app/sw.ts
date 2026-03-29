import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare const self: any;

// ============================================================================
// WORKBOX CONFIGURATION
// ============================================================================

cleanupOutdatedCaches();

// This line is required by the InjectManifest plugin.
// It injects the list of assets to cache (the manifest).
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
self.clients.claim();

// ============================================================================
// PUSH ENDPOINT (Notification logic follows)
// ============================================================================

/**
 * Push notification payload schema:
 * 
 * ```typescript
 * interface PushPayload {
 *   title: string;           // Notification title
 *   body: string;            // Notification body
 *   type: 'canteen';         // Role targeting (filtered client-side)
 *   orderNumber?: string;    // Order number for tag
 *   url?: string;            // Navigation URL on click
 *   data?: {
 *     sound?: string;        // Sound type: 'canteen-order', 'new-order', etc.
 *     [key: string]: any;
 *   }
 * }
 * ```
 */

self.addEventListener('push', (event: any) => {
  console.log('[Kitchen SW] Push event received!');
  
  // Default notification data
  let notificationData: any = {
    title: 'New Order',
    body: 'A new order has been placed!',
    type: 'canteen',
    orderNumber: null,
    url: '/orders/take',
    data: {
      sound: 'canteen-order' // Default sound for canteen
    }
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      console.log('[Kitchen SW] Push payload:', payload);
      
      // ROLE ISOLATION: Only process canteen notifications
      // This SW should only receive canteen notifications, but we double-check
      if (payload.type && payload.type !== 'canteen') {
        console.log('[Kitchen SW] Ignoring non-kitchen notification:', payload.type);
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
    console.error('[Kitchen SW] Error parsing push data:', e);
    if (event.data) {
      notificationData.body = event.data.text();
    }
  }

  // Build notification options
  const options = {
    body: notificationData.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: notificationData.orderNumber 
      ? `order-${notificationData.orderNumber}` 
      : 'new-order',
    requireInteraction: true,
    data: {
      url: notificationData.url,
      orderNumber: notificationData.orderNumber,
      sound: notificationData.data?.sound || 'canteen-order'
    }
  };

  // Execute notification display and sound playback
  event.waitUntil(
    Promise.all([
      // 1. ALWAYS show the notification explicitly
      self.registration.showNotification(notificationData.title, options),
      
      // 2. Send sound playback request to active window clients
      sendSoundToClients(notificationData.data?.sound || 'canteen-order')
    ])
  );
});

/**
 * Send sound playback message to all active window clients
 * 
 * IMPORTANT: Sound only plays if:
 * - PWA has an active window (tab open)
 * - User has previously interacted with the page
 * 
 * @param soundType - Sound type key (e.g., 'canteen-order')
 */
async function sendSoundToClients(soundType: string) {
  try {
    const clients = await self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });
    
    console.log('[Kitchen SW] Sending sound message to', clients.length, 'client(s)');
    
    if (clients.length === 0) {
      console.log('[Kitchen SW] No active clients - sound will not play');
      return;
    }
    
    // Send message to all active clients
    clients.forEach((client: any) => {
      client.postMessage({
        type: 'PLAY_NOTIFICATION_SOUND',
        sound: soundType,
        // Also include direct URL for flexibility
        soundUrl: getSoundUrl(soundType)
      });
    });
  } catch (error) {
    console.error('[Kitchen SW] Error sending sound message:', error);
  }
}

/**
 * Map sound type to URL
 */
function getSoundUrl(soundType: string) {
  const soundMap: Record<string, string> = {
    'canteen-order': '/dragon-studio-notification-sound-effect-372475.mp3',
    'delivery-order': '/scifi-confirmation-tone-268759.mp3',
    'new-order': '/dragon-studio-notification-sound-effect-372475.mp3', // Fallback for legacy events
    'default': '/dragon-studio-notification-sound-effect-372475.mp3'
  };
  return soundMap[soundType] || soundMap['default'];
}

// ============================================================================
// NOTIFICATION CLICK HANDLING
// ============================================================================

self.addEventListener('notificationclick', (event: any) => {
  console.log('[Kitchen SW] Notification clicked');
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/orders/take';
  
  event.waitUntil(
    self.clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((clientList: any[]) => {
      // Find existing window and focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(() => {
            // Navigate to target URL if different
            if (!client.url.includes(targetUrl)) {
              return client.navigate(targetUrl);
            }
          });
        }
      }
      
      // No existing window - open new one
      return self.clients.openWindow(targetUrl);
    }).catch((error: any) => {
      console.error('[Kitchen SW] Error handling notification click:', error);
    })
  );
});
