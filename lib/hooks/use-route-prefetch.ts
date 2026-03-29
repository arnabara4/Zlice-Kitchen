'use client';

import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Route prefetching configuration
 */
interface PrefetchConfig {
  // Delay before prefetching starts (ms) - prevents accidental prefetches
  delay?: number;
  // Whether to also prefetch the route itself (Next.js does this for Link, but useful for buttons)
  prefetchRoute?: boolean;
}

const DEFAULT_CONFIG: PrefetchConfig = {
  delay: 50,
  prefetchRoute: true,
};

/**
 * Custom hook for intelligent route prefetching
 * 
 * Usage:
 * const { onMouseEnter, onFocus } = useRoutePrefetch('/dashboard', async () => {
 *   await prefetchDashboardData(canteenId);
 * });
 * 
 * <Link href="/dashboard" onMouseEnter={onMouseEnter} onFocus={onFocus}>Dashboard</Link>
 */
export function useRoutePrefetch(
  href: string,
  prefetchData?: () => Promise<void>,
  config: PrefetchConfig = {}
) {
  const router = useRouter();
  const { delay, prefetchRoute } = { ...DEFAULT_CONFIG, ...config };
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasPrefetchedRef = useRef(false);

  const prefetch = useCallback(async () => {
    if (hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;

    try {
      // Prefetch route and data in parallel
      const promises: Promise<void>[] = [];
      
      if (prefetchRoute) {
        router.prefetch(href);
      }
      
      if (prefetchData) {
        promises.push(prefetchData());
      }

      await Promise.all(promises);
    } catch (error) {
      // Silent fail - prefetching is optional optimization
      console.debug('Prefetch failed:', error);
    }
  }, [href, prefetchData, prefetchRoute, router]);

  const onMouseEnter = useCallback(() => {
    if (hasPrefetchedRef.current) return;
    
    // Small delay to prevent accidental prefetches
    timeoutRef.current = setTimeout(prefetch, delay);
  }, [prefetch, delay]);

  const onMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onFocus = useCallback(() => {
    // Immediate prefetch on focus (keyboard navigation)
    prefetch();
  }, [prefetch]);

  return {
    onMouseEnter,
    onMouseLeave,
    onFocus,
    prefetch,
  };
}

/**
 * Prefetch multiple routes at once (e.g., on page load)
 */
export function prefetchRoutes(router: ReturnType<typeof useRouter>, routes: string[]) {
  routes.forEach(route => {
    router.prefetch(route);
  });
}

/**
 * Simple data prefetcher that prevents duplicate calls
 */
const prefetchedData = new Set<string>();

export function createDataPrefetcher<T>(
  key: string,
  fetcher: () => Promise<T>
): () => Promise<T | undefined> {
  return async () => {
    if (prefetchedData.has(key)) {
      return undefined;
    }
    prefetchedData.add(key);
    
    try {
      return await fetcher();
    } catch (error) {
      // Allow retry on error
      prefetchedData.delete(key);
      throw error;
    }
  };
}

/**
 * Clear prefetch cache (useful when data might have changed)
 */
export function clearPrefetchCache(key?: string) {
  if (key) {
    prefetchedData.delete(key);
  } else {
    prefetchedData.clear();
  }
}
