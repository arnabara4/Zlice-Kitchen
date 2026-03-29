const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');

if (!fs.existsSync(SW_PATH)) {
  console.log('Service Worker not found at', SW_PATH);
  process.exit(0);
}

let content = fs.readFileSync(SW_PATH, 'utf8');

// 1. Remove chunks from precache manifest
// Pattern: {url:"/_next/static/chunks/...",revision:"..."}
const chunkRegex = /\{url:"\/_next\/static\/chunks\/[^"]+",revision:"[^"]+"\},?/g;
const manifestMatch = content.match(/precacheAndRoute\(\[(.*?)\]/);

if (manifestMatch) {
  let manifestContent = manifestMatch[1];
  const originalLength = manifestContent.length;
  
  // Remove chunks
  manifestContent = manifestContent.replace(chunkRegex, '');
  
  // Also remove buildManifest and ssgManifest if desired (user said "webpack build files")
  // {url:"/_next/static/.../_buildManifest.js",revision:"..."}
  const manifestFilesRegex = /\{url:"\/_next\/static\/[^"]+\/_(build|ssg)Manifest\.js",revision:"[^"]+"\},?/g;
  manifestContent = manifestContent.replace(manifestFilesRegex, '');

  // Fix trailing commas
  manifestContent = manifestContent.replace(/,\]/g, ']');
  manifestContent = manifestContent.replace(/,,/g, ',');

  content = content.replace(manifestMatch[1], manifestContent);
  console.log(`[Fix SW] Removed chunks from precache manifest.`);
}

// 2. Remove default runtime caching strategies that conflict with our NetworkFirst
// next-pwa adds registerRoute for js, css, images with StaleWhileRevalidate or CacheFirst
// We want to remove them so our custom strategies in sw.ts (which are appended usually, or we ensure they are unmatched) take over?
// Actually, next-pwa routes come FIRST. modifying sw.js to remove them is hard because they are compiled code.
// Typically they look like: e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate...
// We will replace them with comments or empty.

// Patterns to remove (carefully matched from observed output)
const patternsToRemove = [
  // JS defaults to StaleWhileRevalidate, we want NetworkFirst
  /e\.registerRoute\(\/\\\.\(\?:js\)\$\/i,new e\.StaleWhileRevalidate.*?\}\)\),/,
  // CSS defaults to StaleWhileRevalidate
  /e\.registerRoute\(\/\\\.\(\?:css\|less\)\$\/i,new e\.StaleWhileRevalidate.*?\}\)\),/,
  // Images default to StaleWhileRevalidate (we might want to keep this or change to CacheFirst, our sw.ts has CacheFirst)
  // Our sw.ts has CacheFirst for images. next-pwa has StaleWhileRevalidate for static-image-assets.
  /e\.registerRoute\(\/\\\.\(\?:jpg\|jpeg\|gif\|png\|svg\|ico\|webp\)\$\/i,new e\.StaleWhileRevalidate.*?\}\)\),/,
  // Next static js assets
  /e\.registerRoute\(\/\\\/_next\\\/static\.\+\\\.js\$\/i,new e\.CacheFirst.*?\}\)\),/,
];

patternsToRemove.forEach(pattern => {
  if (pattern.test(content)) {
    content = content.replace(pattern, '');
    console.log(`[Fix SW] Removed default route matching ${pattern}`);
  } else {
    console.log(`[Fix SW] Warning: Pattern not found: ${pattern}`);
  }
});

fs.writeFileSync(SW_PATH, content);
console.log('[Fix SW] Service Worker patched successfully.');
