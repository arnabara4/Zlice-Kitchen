"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Shimmer animation CSS class
const shimmerClass = "animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 bg-[length:200%_100%]";

export const KPICardSkeleton = memo(() => (
  <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
    <CardContent className="p-3 md:pt-3 md:pb-3">
      <div className="flex items-start justify-between mb-1.5 md:mb-1">
        <div className={`h-8 w-8 md:h-7 md:w-7 rounded ${shimmerClass}`} />
        <div className={`h-4 w-12 rounded ${shimmerClass}`} />
      </div>
      <div className={`h-3 w-16 rounded ${shimmerClass} mb-2`} />
      <div className={`h-6 w-24 rounded ${shimmerClass}`} />
    </CardContent>
  </Card>
));

KPICardSkeleton.displayName = "KPICardSkeleton";

export const KPIGridSkeleton = memo(() => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-2.5 md:mb-4">
    <KPICardSkeleton />
    <KPICardSkeleton />
    <KPICardSkeleton />
    <KPICardSkeleton />
  </div>
));

KPIGridSkeleton.displayName = "KPIGridSkeleton";

export const EarningsGridSkeleton = memo(() => (
  <div className="mb-3 md:mb-4">
    <div className="flex items-center gap-2 mb-2">
      <div className={`h-4 w-4 rounded ${shimmerClass}`} />
      <div className={`h-4 w-40 rounded ${shimmerClass}`} />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
    </div>
  </div>
));

EarningsGridSkeleton.displayName = "EarningsGridSkeleton";

// Deterministic heights for chart skeleton bars to avoid hydration mismatch
const chartBarHeights = [65, 80, 55, 90, 70, 85, 60, 75, 95, 50, 72, 88];

export const ChartSkeleton = memo(() => (
  <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 mb-3 md:mb-5">
    <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-4 w-4 rounded ${shimmerClass}`} />
          <div className={`h-4 w-32 rounded ${shimmerClass}`} />
        </div>
        <div className="flex gap-1">
          <div className={`h-7 w-14 rounded ${shimmerClass}`} />
          <div className={`h-7 w-14 rounded ${shimmerClass}`} />
          <div className={`h-7 w-14 rounded ${shimmerClass}`} />
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-3 md:pt-4 md:pb-4">
      <div className="flex items-end gap-2 h-[200px] md:h-[280px]">
        {chartBarHeights.map((height, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div 
              className={`w-full rounded-sm ${shimmerClass}`} 
              style={{ height: `${height}%` }}
            />
            <div className={`h-3 w-6 rounded ${shimmerClass}`} />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

ChartSkeleton.displayName = "ChartSkeleton";

export const TopItemsSkeleton = memo(() => (
  <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
    <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
      <div className="flex items-center gap-2">
        <div className={`h-4 w-4 rounded ${shimmerClass}`} />
        <div className={`h-4 w-28 rounded ${shimmerClass}`} />
      </div>
      <div className={`h-3 w-20 rounded ${shimmerClass} mt-1`} />
    </CardHeader>
    <CardContent className="p-3 md:pt-3 md:pb-3">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-6 w-6 rounded ${shimmerClass}`} />
            <div className="flex-1">
              <div className={`h-3 w-24 rounded ${shimmerClass} mb-1`} />
              <div className={`h-1.5 w-full rounded ${shimmerClass}`} />
            </div>
            <div className="text-right">
              <div className={`h-3 w-12 rounded ${shimmerClass} mb-1`} />
              <div className={`h-2 w-6 rounded ${shimmerClass}`} />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

TopItemsSkeleton.displayName = "TopItemsSkeleton";

// Deterministic widths for peak hours skeleton bars
const peakHourWidths = [55, 70, 45, 60, 50, 65];

export const PeakHoursSkeleton = memo(() => (
  <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
    <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
      <div className="flex items-center gap-2">
        <div className={`h-4 w-4 rounded ${shimmerClass}`} />
        <div className={`h-4 w-32 rounded ${shimmerClass}`} />
      </div>
      <div className={`h-3 w-24 rounded ${shimmerClass} mt-1`} />
    </CardHeader>
    <CardContent className="p-3 md:pt-3 md:pb-3">
      <div className="space-y-2">
        {peakHourWidths.map((width, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`h-3 w-10 rounded ${shimmerClass}`} />
            <div className="flex-1">
              <div className={`h-5 rounded ${shimmerClass}`} style={{ width: `${width}%` }} />
            </div>
            <div className={`h-3 w-6 rounded ${shimmerClass}`} />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

PeakHoursSkeleton.displayName = "PeakHoursSkeleton";

// Deterministic widths for order distribution skeleton bars
const orderDistWidths = [45, 65, 35, 55];

export const OrderDistributionSkeleton = memo(() => (
  <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
    <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
      <div className="flex items-center gap-2">
        <div className={`h-4 w-4 rounded ${shimmerClass}`} />
        <div className={`h-4 w-36 rounded ${shimmerClass}`} />
      </div>
      <div className={`h-3 w-28 rounded ${shimmerClass} mt-1`} />
    </CardHeader>
    <CardContent className="p-3 md:pt-3 md:pb-3">
      <div className="space-y-4">
        {orderDistWidths.map((width, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className={`h-3 w-16 rounded ${shimmerClass}`} />
              <div className="flex items-center gap-2">
                <div className={`h-4 w-10 rounded ${shimmerClass}`} />
                <div className={`h-3 w-14 rounded ${shimmerClass}`} />
              </div>
            </div>
            <div className={`h-5 rounded ${shimmerClass}`} style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

OrderDistributionSkeleton.displayName = "OrderDistributionSkeleton";

// Full Dashboard Skeleton
export const DashboardSkeleton = memo(() => (
  <div className="min-h-full bg-slate-950 md:bg-white md:dark:bg-slate-950">
    {/* Mobile Header Skeleton */}
    <div className="md:hidden sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg ${shimmerClass}`} />
            <div>
              <div className={`h-4 w-24 rounded ${shimmerClass} mb-1`} />
              <div className={`h-2 w-20 rounded ${shimmerClass}`} />
            </div>
          </div>
          <div className={`h-9 w-9 rounded ${shimmerClass}`} />
        </div>
      </div>
    </div>

    <div className="max-w-[1600px] mx-auto px-3 md:px-4 lg:px-8 py-3 md:py-6">
      {/* Desktop Header Skeleton */}
      <div className="mb-4 md:mb-6 hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${shimmerClass}`} />
            <div>
              <div className={`h-6 w-32 rounded ${shimmerClass} mb-1`} />
              <div className={`h-3 w-28 rounded ${shimmerClass}`} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-4 w-36 rounded ${shimmerClass}`} />
            <div className={`h-8 w-24 rounded ${shimmerClass}`} />
          </div>
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <KPIGridSkeleton />

      {/* Online Earnings Skeleton */}
      <EarningsGridSkeleton />

      {/* Chart Skeleton */}
      <ChartSkeleton />

      {/* Analytics Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
        <TopItemsSkeleton />
        <PeakHoursSkeleton />
      </div>

      {/* Order Distribution Skeleton */}
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        <OrderDistributionSkeleton />
      </div>
    </div>
  </div>
));

DashboardSkeleton.displayName = "DashboardSkeleton";
