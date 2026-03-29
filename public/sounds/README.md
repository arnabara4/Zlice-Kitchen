# Push Notification Sound System

Production-grade push notification sound system with role-based custom sounds.

## Sound Files

| Sound Type | File | User Role | Description |
|------------|------|-----------|-------------|
| `canteen-order` | `dragon-studio-notification-sound-effect-372475.mp3` | Canteen/Seller | New order alert |
| `delivery-order` | `notification.mp3` | Delivery/Buyer | Delivery available |

## Adding New Sounds

1. Add `.mp3` file to `/public/sounds/` or `/public/`
2. Update sound map in:
   - `lib/notification-sound.ts` → `SOUND_MAP`
   - `app/sw.ts` → `getSoundUrl()`
   - `public/delivery-sw.js` → `getSoundUrl()`

## Backend Payload

```javascript
// Canteen notification
{
  title: "New Order #K76D",
  body: "Dine-in order placed",
  type: "canteen",
  data: { sound: "canteen-order" }
}

// Delivery notification
{
  title: "New Delivery",
  body: "Order ready for pickup",
  type: "delivery", 
  data: { sound: "delivery-order" }
}
```

## Browser Limitations

| Scenario | Sound? | Why |
|----------|--------|-----|
| PWA open + user clicked | ✅ | Audio unlocked |
| PWA open, no click | ❌ | Autoplay blocked |
| PWA in background | ❌ | No active client |
| Browser closed | ❌ | No clients |
| iOS | ❌ | Strict restrictions |

**Sound only plays when PWA has an active window AND user has interacted with the page.**
