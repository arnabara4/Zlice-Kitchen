#!/bin/bash

echo "🔍 Checking PWA Setup..."
echo ""

# Check manifest
if [ -f "public/manifest.json" ]; then
    echo "✅ manifest.json exists"
else
    echo "❌ manifest.json missing"
fi

# Check service worker
if [ -f "public/sw.js" ]; then
    echo "✅ sw.js exists"
else
    echo "❌ sw.js missing"
fi

# Check offline page
if [ -f "public/offline.html" ]; then
    echo "✅ offline.html exists"
else
    echo "❌ offline.html missing"
fi

# Check icons
if [ -f "public/icon-192.png" ] && [ -f "public/icon-512.png" ]; then
    echo "✅ App icons exist"
else
    echo "❌ App icons missing"
fi

# Check PWA component
if [ -f "components/pwa-install-prompt.tsx" ]; then
    echo "✅ PWA install prompt component exists"
else
    echo "❌ PWA install prompt component missing"
fi

echo ""
echo "📱 PWA Installation Instructions:"
echo ""
echo "1. Open http://localhost:3000 in Chrome or Edge"
echo "2. Look for the install prompt in the bottom-right corner"
echo "3. Or click the install icon in the browser's address bar"
echo "4. The app will install and can be launched from your applications"
echo ""
echo "📝 Note: For production, ensure your app is served over HTTPS"
echo ""
echo "🔧 To test in Chrome DevTools:"
echo "   1. Press F12 to open DevTools"
echo "   2. Go to Application tab"
echo "   3. Check Service Workers (should show sw.js registered)"
echo "   4. Check Manifest (should show app details)"
echo "   5. Go to Lighthouse tab and run PWA audit"
echo ""
