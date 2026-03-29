# Delivery Partner PWA

This is a separate Progressive Web App (PWA) for delivery partners, isolated from the main canteen management app.

## Features

- **Separate PWA Installation**: Can be installed independently as "Delivery Partner App"
- **Custom Service Worker**: Dedicated service worker with delivery-specific caching (`/delivery-sw.js`)
- **Push Notifications**: Configured for delivery order notifications
- **Offline Support**: Works offline with custom offline page
- **Scoped to /delivery/**: Service worker only handles delivery routes
- **Custom Branding**: Blue theme (#0ea5e9) with delivery truck icon

## Files Structure

```
public/
├── delivery-manifest.json         # PWA manifest for delivery app
├── delivery-sw.js                 # Service worker for delivery routes
├── delivery-offline.html          # Offline fallback page
├── delivery-icon-192.png          # 192x192 app icon
├── delivery-icon-512.png          # 512x512 app icon
└── create-delivery-icons.html     # Icon generator tool

app/delivery/
└── layout.tsx                     # Delivery-specific layout with PWA setup

components/
└── delivery-pwa-install-prompt.tsx # Install prompt component
```

## How It Works

### 1. Service Worker Scope
- Main app SW (`/sw.js`): Scope = `/`
- Delivery app SW (`/delivery-sw.js`): Scope = `/delivery/`
- Both can coexist without conflicts

### 2. Manifest Configuration
- **Main app**: `/manifest.json` - starts at `/login`
- **Delivery app**: `/delivery-manifest.json` - starts at `/delivery/login`

### 3. Installation
Users can install both apps separately:
- Main app installs as "Canteen App" with red theme
- Delivery app installs as "Delivery Partner App" with blue theme

## Setup Instructions

### 1. Generate Icons
Open `http://localhost:3000/create-delivery-icons.html` in your browser and download:
- `delivery-icon-192.png`
- `delivery-icon-512.png`

Save them in the `public/` folder.

### 2. Testing PWA

#### Chrome/Edge (Desktop)
1. Navigate to `/delivery/login`
2. Open DevTools → Application → Manifest
3. Check "Update on reload"
4. Click "Install" in address bar

#### Chrome (Android)
1. Navigate to `/delivery/login`
2. Tap the install prompt or menu → "Install app"
3. App installs as "Delivery Partner App"

#### Safari (iOS)
1. Navigate to `/delivery/login`
2. Tap Share button → "Add to Home Screen"
3. App installs with delivery icon and blue theme

### 3. Service Worker Registration

The service worker is registered in `app/delivery/layout.tsx`:
```typescript
navigator.serviceWorker.register('/delivery-sw.js', { 
  scope: '/delivery/' 
})
```

### 4. Push Notifications

Configure push notifications in `/delivery-sw.js`:
```javascript
self.addEventListener('push', (event) => {
  // Delivery-specific notification handling
  const options = {
    icon: '/delivery-icon-192.png',
    badge: '/delivery-icon-192.png',
    actions: [
      { action: 'view', title: '🚚 View Order' },
      { action: 'accept', title: '✅ Accept' }
    ]
  };
  self.registration.showNotification(data.title, options);
});
```

## Customization

### Change Theme Color
Edit `public/delivery-manifest.json`:
```json
{
  "theme_color": "#0284c7",
  "background_color": "#0ea5e9"
}
```

### Add App Shortcuts
Edit `public/delivery-manifest.json`:
```json
{
  "shortcuts": [
    {
      "name": "Active Deliveries",
      "url": "/delivery/my-deliveries",
      "icons": [{ "src": "/delivery-icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

### Update Cache Strategy
Edit `public/delivery-sw.js` to change caching behavior:
```javascript
const CACHE_NAME = 'delivery-app-v1';
const urlsToCache = [
  '/delivery/login',
  '/delivery/orders',
  // Add more routes
];
```

## Debugging

### Check Service Worker Status
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(registrations);
});
```

### Clear Service Worker Cache
```javascript
// In browser console
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

### Unregister Service Worker
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => {
    if (reg.scope.includes('/delivery/')) {
      reg.unregister();
    }
  });
});
```

## Production Deployment

### Vercel
No additional configuration needed. The PWA will work automatically.

### Other Platforms
Ensure these headers are set:
```
/delivery-manifest.json
  Content-Type: application/manifest+json

/delivery-sw.js
  Content-Type: application/javascript
  Service-Worker-Allowed: /delivery/
```

## Differences from Main App

| Feature | Main App | Delivery App |
|---------|----------|--------------|
| Manifest | `/manifest.json` | `/delivery-manifest.json` |
| Service Worker | `/sw.js` | `/delivery-sw.js` |
| Scope | `/` | `/delivery/` |
| Start URL | `/login` | `/delivery/login` |
| Theme Color | Red (#dc2626) | Blue (#0284c7) |
| Icon | Canteen logo | Delivery truck |
| App Name | Canteen App | Delivery Partner App |

## Troubleshooting

### PWA not installing?
1. Check HTTPS (required for PWA)
2. Verify manifest is accessible: `/delivery-manifest.json`
3. Check service worker registration in DevTools
4. Clear browser cache and try again

### Service worker conflicts?
- Scopes are different, they shouldn't conflict
- If issues persist, unregister all SWs and reload

### Icons not showing?
- Ensure icons exist in `public/` folder
- Check file names match manifest
- Icons must be PNG format
- Clear app data and reinstall

## Next Steps

1. **Generate Icons**: Use `/create-delivery-icons.html`
2. **Test Installation**: Try installing on multiple devices
3. **Configure Push**: Set up push notification backend
4. **Customize**: Update colors, icons, and shortcuts
5. **Monitor**: Track PWA installs in analytics
