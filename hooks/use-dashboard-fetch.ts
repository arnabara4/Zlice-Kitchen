"use client";

import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback } from "react";

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (canteenId: string | undefined) =>
    [...dashboardKeys.all, "stats", canteenId] as const,
  chart: (
    canteenId: string | undefined,
    view: string,
    date?: string,
    month?: string,
  ) => [...dashboardKeys.all, "chart", canteenId, view, date, month] as const,
  onlineEarnings: (
    canteenId: string | undefined,
    startDate?: string,
    endDate?: string,
  ) =>
    [
      ...dashboardKeys.all,
      "earnings",
      "online",
      canteenId,
      startDate,
      endDate,
    ] as const,
  deliveryEarnings: (canteenId: string | undefined) =>
    [...dashboardKeys.all, "earnings", "delivery", canteenId] as const,
  settlementDetails: (canteenId: string | undefined, date: string) =>
    [...dashboardKeys.all, "settlement", canteenId, date] as const,
};

// Hook Options
const CACHE_TTL = 60 * 1000; // 1 minute stale time
const GC_TTL = 5 * 60 * 1000; // 5 minutes garbage collection

/**
 * Hook to fetch Dashboard Statistics
 */
export function useDashboardStats(canteenId: string | undefined) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.stats(canteenId),
    queryFn: async () => {
      if (!canteenId) return null;
      const res = await fetch("/api/canteen/dashboard-stats", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    enabled: !!canteenId,
    staleTime: CACHE_TTL,
    gcTime: GC_TTL,
    refetchOnWindowFocus: true,
  });

  return {
    data: data || null,
    loading: isLoading,
    error: error as Error | null,
    isStale: isFetching && !isLoading,
    refresh: refetch,
  };
}

/**
 * Hook to fetch Dashboard Revenue Chart
 */
export function useDashboardChart(
  canteenId: string | undefined,
  chartView: string,
  selectedDate?: string,
  selectedMonth?: string,
) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.chart(
      canteenId,
      chartView,
      selectedDate,
      selectedMonth,
    ),
    queryFn: async () => {
      if (!canteenId) return null;
      const params = new URLSearchParams({
        view: chartView,
        ...(chartView === "hour" && selectedDate && { date: selectedDate }),
        ...(chartView === "day" && selectedMonth && { month: selectedMonth }),
      });
      const res = await fetch(`/api/canteen/dashboard-chart?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    },
    enabled: !!canteenId,
    staleTime: CACHE_TTL,
    gcTime: GC_TTL,
  });

  return {
    data: data || null,
    loading: isLoading,
    refresh: refetch,
    error: error as Error | null,
    isStale: isFetching && !isLoading,
  };
}

/**
 * Hook to fetch Online Earnings
 */
export function useOnlineEarnings(
  canteenId: string | undefined,
  startDate?: Date,
  endDate?: Date,
) {
  const startDateStr = startDate?.toISOString();
  const endDateStr = endDate?.toISOString();

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.onlineEarnings(canteenId, startDateStr, endDateStr),
    queryFn: async () => {
      if (!canteenId) return null;
      let url = "/api/canteen/online-earnings";
      const params = new URLSearchParams();

      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, "0");
        const day = String(startDate.getDate()).padStart(2, "0");
        params.set(
          "startDate",
          new Date(`${year}-${month}-${day}T00:00:00.000+05:30`).toISOString(),
        );
      }

      if (endDate) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, "0");
        const day = String(endDate.getDate()).padStart(2, "0");
        params.set(
          "endDate",
          new Date(`${year}-${month}-${day}T23:59:59.999+05:30`).toISOString(),
        );
      }

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch online earnings");
      return res.json();
    },
    enabled: !!canteenId,
    staleTime: CACHE_TTL,
    gcTime: GC_TTL,
  });

  return {
    data: data || null,
    loading: isLoading,
    refresh: refetch,
    error: error as Error | null,
    isStale: isFetching && !isLoading,
  };
}

/**
 * Hook to fetch Delivery Partner Earnings
 */
export function useDeliveryEarnings(canteenId: string | undefined) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.deliveryEarnings(canteenId),
    queryFn: async () => {
      if (!canteenId) return null;
      const res = await fetch("/api/canteen/delivery-earnings", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch delivery earnings");
      return res.json();
    },
    enabled: !!canteenId,
    staleTime: CACHE_TTL,
    gcTime: GC_TTL,
  });

  return {
    data: data || null,
    loading: isLoading,
    refresh: refetch,
    error: error as Error | null,
    isStale: isFetching && !isLoading,
  };
}

/**
 * Hook to fetch Settlement Details for a specific date
 */
export function useSettlementDetails(
  canteenId: string | undefined,
  date: Date,
  options?: Omit<
    import("@tanstack/react-query").UseQueryOptions<any, any, any, any>,
    "queryKey" | "queryFn"
  >,
) {
  // Format date as YYYY-MM-DD using Local Time (not UTC) to avoid off-by-one errors
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.settlementDetails(canteenId, dateStr),
    queryFn: async () => {
      if (!canteenId) return null;
      const res = await fetch(
        `/api/canteen/settlement-details?date=${dateStr}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch settlement details");
      return res.json();
    },
    enabled: !!canteenId,
    staleTime: CACHE_TTL,
    gcTime: GC_TTL,
    ...options,
  });

  return {
    data: data || null,
    loading: isLoading,
    refresh: refetch,
    error: error as Error | null,
    isStale: isFetching && !isLoading,
  };
}

/**
 * Hook to handle Cache Invalidation
 */
export function useCacheInvalidator() {
  const queryClient = useQueryClient();

  const invalidateCanteenCache = useCallback(
    (canteenId: string) => {
      // Invalidate all queries related to this canteen
      // Note: We use 'invalidateQueries' to trigger a refetch if active,
      // or mark as stale if inactive.

      // We iterate over the key factories to invalidate specific subsets
      queryClient.invalidateQueries({
        queryKey: dashboardKeys.stats(canteenId),
      });
      // For charts/earnings, we invalidate broadly by matching the prefix + canteenId
      // React Query's exact: false (default) matches by prefix
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, "chart", canteenId],
      });
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, "earnings", "online", canteenId],
      });
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, "earnings", "delivery", canteenId],
      });
      queryClient.invalidateQueries({
        queryKey: [...dashboardKeys.all, "settlement", canteenId],
      });
    },
    [queryClient],
  );

  // Legacy support alias if needed, but best to use semantic names
  const clearCanteenCache = invalidateCanteenCache;

  return { invalidateCanteenCache, clearCanteenCache };
}

// Deprecated: No-op functions for backward compatibility with non-hook usage
// Warning: These will not work as expected because they cannot access QueryClient
export function clearDashboardCache() {
  console.warn(
    "clearDashboardCache is deprecated. Use useCacheInvalidator hook.",
  );
}

export function clearCanteenCache(canteenId: string) {
  console.warn(
    "clearCanteenCache is deprecated. Use useCacheInvalidator hook.",
  );
}
