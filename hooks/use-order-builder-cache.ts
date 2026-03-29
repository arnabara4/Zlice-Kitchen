'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export interface Student {
  id: string;
  name: string;
  roll_number: string;
  phone: string;
}

// Cache keys for React Query
export const menuKeys = {
  all: ['menu'] as const,
  canteen: (canteenId: string | undefined) => [...menuKeys.all, canteenId] as const,
};

export const studentKeys = {
  all: ['students'] as const,
  canteen: (canteenId: string | undefined) => [...studentKeys.all, canteenId] as const,
};

const MENU_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STUDENTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to fetch and cache menu items using React Query
 */
export function useMenuItems(canteenId: string | undefined) {
  const { data: menuItems = [], isLoading, error, refetch } = useQuery({
    queryKey: menuKeys.canteen(canteenId),
    queryFn: async () => {
      if (!canteenId) return [];
      
      const resp = await fetch(`/api/menu?canteenId=${canteenId}`);
      if (!resp.ok) {
        throw new Error('Failed to fetch menu items');
      }
      
      const data = await resp.json();
      return data as MenuItem[];
    },
    enabled: !!canteenId,
    staleTime: MENU_CACHE_TTL,
    gcTime: MENU_CACHE_TTL * 2, // Keep in garbage collection longer than stale time
    refetchOnWindowFocus: false,
  });

  return { menuItems, loading: isLoading, error, refresh: refetch };
}

/**
 * Hook to fetch and cache students using React Query
 */
export function useStudents(canteenId: string | undefined) {
  const { data: students = [], isLoading, error, refetch } = useQuery({
    queryKey: studentKeys.canteen(canteenId),
    queryFn: async () => {
      if (!canteenId) return [];

      const resp = await fetch(`/api/khata?canteenId=${canteenId}`);
      if (!resp.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await resp.json();
      return data as Student[];
    },
    enabled: !!canteenId,
    staleTime: STUDENTS_CACHE_TTL,
    gcTime: STUDENTS_CACHE_TTL * 2,
    refetchOnWindowFocus: false,
  });

  return { students, loading: isLoading, error, refresh: refetch };
}

/**
 * Helper to invalidate queries manually if needed
 * Note: Components using useQuery will automatically get fresh data if invalidated
 */
export function useInvalidateCanteenCache() {
  const queryClient = useQueryClient();

  const clearCanteenCache = (canteenId: string) => {
    queryClient.invalidateQueries({ queryKey: menuKeys.canteen(canteenId) });
    queryClient.invalidateQueries({ queryKey: studentKeys.canteen(canteenId) });
  };

  const clearAllCache = () => {
    queryClient.invalidateQueries({ queryKey: menuKeys.all });
    queryClient.invalidateQueries({ queryKey: studentKeys.all });
  };

  return { clearCanteenCache, clearAllCache };
}


