# Push Notification Sound System

## Overview

Production-grade push notification sound system with role-based custom sounds, autoplay policy compliance, and graceful fallback handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PUSH NOTIFICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Backend                Service Worker              Client                 │
│   ─────────              ──────────────              ──────                 │
│                                                                             │
│   ┌─────────┐  push   ┌──────────────────┐  message  ┌─────────────────┐   │
│   │ web-push│ ──────► │ sw.ts / delivery │ ────────► │notification-    │   │
│   │ library │         │     -sw.js       │           │sound.ts         │   │
│   └─────────┘         └──────────────────┘           └─────────────────┘   │
│       │                      │                              │               │
│       │                      │ showNotification()           │ play()        │
│       │                      ▼                              ▼               │
│       │               ┌──────────────┐               ┌─────────────────┐   │
│       │               │ Browser      │               │ Audio API       │   │
│       │               │ Notification │               │ (if unlocked)   │   │
│       │               └──────────────┘               └─────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `lib/notification-sound.ts` | Client-side sound player with auto-unlock |
| `app/sw.ts` | Canteen service worker (compiled to `public/sw.js`) |
| `public/delivery-sw.js` | Delivery service worker |
| `public/sounds/README.md` | Sound file documentation |

## Push Payload Schema

```typescript
interface PushPayload {
  // Required
  title: string;                      // Notification title
  body: string;                       // Notification body
  type: 'canteen' | 'delivery';       // Role targeting

  // Optional
  orderNumber?: string;               // For notification tag
  url?: string;                       // Navigation on click
  data?: {
    sound?: string;                   // Sound type key
    // 'canteen-order' | 'delivery-order' | 'default'
  };
}
```

### Example Payloads

**Canteen Notification:**
```javascript
{
  title: "New Order #K76D",
  body: "Dine-in order placed",
  type: "canteen",
  orderNumber: "K76D",
  url: "/orders/take",
  data: {
    sound: "canteen-order"
  }
}
```

**Delivery Notification:**
```javascript
{
  title: "New Delivery Available",
  body: "Order #ABC123 ready for pickup",
  type: "delivery",
  orderNumber: "ABC123",
  url: "/delivery/orders",
  data: {
    sound: "delivery-order"
  }
}
```

## Sound Types

| Sound Type | File | Role |
|------------|------|------|
| `canteen-order` | `/dragon-studio-notification-sound-effect-372475.mp3` | Canteen |
| `new-order` | `/dragon-studio-notification-sound-effect-372475.mp3` | Canteen |
| `delivery-order` | `/notification.mp3` | Delivery |
| `delivery-ready` | `/notification.mp3` | Delivery |
| `default` | Role-specific default | Both |

## Browser Limitations

> ⚠️ **CRITICAL**: Sound only plays under specific conditions

| Scenario | Notification | Sound | Reason |
|----------|-------------|-------|--------|
| PWA open + user interacted | ✅ | ✅ | Full functionality |
| PWA open, no interaction | ✅ | ❌ | Autoplay policy blocks audio |
| PWA minimized/background | ✅ | ❌ | No active window client |
| Browser/PWA closed | ✅ | ❌ | No clients to receive message |
| iOS Safari | ⚠️ Limited | ❌ | Strict autoplay restrictions |
| iOS Home Screen PWA | ✅ | ❌ | No Web Audio API support |
| Device on Silent/DND | ✅ | ❌ | System mutes all audio |

### Why These Limitations Exist

1. **Autoplay Policy**: Browsers require user gesture before audio playback to prevent unwanted sounds
2. **Service Worker Scope**: SWs can't play audio directly - must delegate to active window clients
3. **iOS Restrictions**: Apple has strictest autoplay policies of all platforms

### Best Practices

1. **In-app sound unlock**: Audio is auto-unlocked on first click/touch/keydown
2. **Graceful degradation**: Notification always shows, sound fails silently
3. **User expectation setting**: Inform users sound requires app to be open

## Troubleshooting

### Sound not playing?

1. **Check console for logs:**
   - `[Sound] Audio unlocked successfully!` - User has interacted
   - `[Sound] Playback blocked by browser` - Need user interaction

2. **Verify service worker:**
   - DevTools → Application → Service Workers
   - Check "Update on reload" and click "Unregister" then refresh

3. **Check if PWA is active:**
   - Sound only plays when tab/window is open
   - Background tabs may work, closed browser won't

### Testing

```javascript
// In browser console, after clicking on page:
import { notificationSoundPlayer } from '/lib/notification-sound';
notificationSoundPlayer.test();
```

## Adding New Sounds

1. Add `.mp3` file to `/public/` or `/public/sounds/`

2. Update `lib/notification-sound.ts`:
```typescript
const SOUND_MAP = {
  // ... existing
  'new-sound-type': '/path/to/sound.mp3',
};
```

3. Update service worker if needed:
   - `app/sw.ts` → `getSoundUrl()` for canteen
   - `public/delivery-sw.js` → `getSoundUrl()` for delivery

4. Send from backend:
```javascript
data: { sound: 'new-sound-type' }
```
