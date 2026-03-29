'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function DynamicManifest() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Remove all existing manifest links
    const existingLinks = document.querySelectorAll('link[rel="manifest"]');
    existingLinks.forEach(link => link.remove());
    
    // Add the correct manifest based on the route
    const link = document.createElement('link');
    link.rel = 'manifest';
    
    if (pathname?.startsWith('/delivery')) {
      link.href = '/delivery-manifest.json';
      // Update theme color for delivery
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#0284c7');
      }
    } else {
      link.href = '/manifest.json';
      // Update theme color for canteen
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', '#dc2626');
      }
    }
    
    document.head.appendChild(link);
  }, [pathname]);
  
  return null;
}
