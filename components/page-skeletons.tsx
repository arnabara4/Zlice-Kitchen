"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Reusable shimmer class for consistency with Dashboard
const shimmerClass = "animate-pulse bg-slate-200 dark:bg-slate-800/50";

export const MenuSkeleton = memo(() => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-slate-900 border-slate-800 md:bg-white md:dark:bg-slate-900 md:border-slate-200 md:dark:border-slate-800 overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
));

MenuSkeleton.displayName = "MenuSkeleton";

export const OrdersManageSkeleton = memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="bg-amber-50/30 border-amber-200 dark:bg-slate-900 dark:border-slate-800">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-300">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-10 w-10 rounded-md" />
            <Skeleton className="h-10 w-16 rounded-md" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
));

OrdersManageSkeleton.displayName = "OrdersManageSkeleton";

export const StatsGridSkeleton = memo(() => (
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="dark:bg-[#1e293b] dark:border-slate-800/50">
        <CardContent className="pt-4 pb-4 flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg opacity-20" />
        </CardContent>
      </Card>
    ))}
  </div>
));

StatsGridSkeleton.displayName = "StatsGridSkeleton";

export const TransactionsSkeleton = memo(() => (
  <div className="space-y-6">
    <StatsGridSkeleton />
    <Card className="dark:bg-transparent dark:border-slate-800/50 border-0">
      <CardContent className="p-0 space-y-4">
        <div className="flex gap-4 p-4 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[180px]" />
        </div>
        <div className="space-y-1 p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));

TransactionsSkeleton.displayName = "TransactionsSkeleton";

export const KhataSkeleton = memo(() => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="dark:bg-[#1e293b] dark:border-slate-800/50">
          <CardContent className="pt-3 pb-3">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
    <div className="flex flex-col lg:flex-row gap-2">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-[180px]" />
      <Skeleton className="h-9 w-[140px]" />
    </div>
    <Card className="dark:bg-transparent dark:border-slate-800/50 border-0">
      <CardContent className="p-0">
        <div className="space-y-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
));

KhataSkeleton.displayName = "KhataSkeleton";
export function DeliveryOrdersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <div className="grid w-full grid-cols-2 gap-2 mb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
            
            <div className="space-y-3 mb-4">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>

            <Skeleton className="h-10 w-full rounded-md" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DeliveryHistorySkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-7 w-16 ml-auto" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-lg mb-4" />
            <Skeleton className="h-10 w-full rounded-md" />
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DeliveryPaymentsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
