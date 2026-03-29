import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-2.5 md:mb-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
          <CardContent className="p-3 md:pt-3 md:pb-3">
            <div className="flex items-start justify-between mb-1.5 md:mb-1">
              <Skeleton className="h-7 w-7 rounded bg-slate-800 dark:bg-slate-800" />
              <Skeleton className="h-4 w-12 rounded bg-slate-800 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-3 w-16 mb-1 md:mb-0.5 bg-slate-800 dark:bg-slate-800" />
            <Skeleton className="h-6 w-24 bg-slate-800 dark:bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function RevenueChartSkeleton() {
  return (
    <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 mb-3 md:mb-5">
      <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-3 flex flex-row items-center justify-between">
        <div className="space-y-1">
            <Skeleton className="h-4 w-32 bg-slate-800 dark:bg-slate-800" />
            <Skeleton className="h-3 w-48 bg-slate-800 dark:bg-slate-800" />
        </div>
        <div className="flex gap-2">
            <Skeleton className="h-8 w-20 bg-slate-800 dark:bg-slate-800" />
            <Skeleton className="h-8 w-20 bg-slate-800 dark:bg-slate-800" />
        </div>
      </CardHeader>
      <CardContent className="p-0 md:pt-4 md:pb-4">
        <div className="flex items-end gap-1.5 md:gap-2 h-[200px] md:h-[280px] px-2 md:px-2 overflow-hidden">
        {[...Array(12)].map((_, i) => (
             <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                <Skeleton className="w-full bg-slate-800 dark:bg-slate-800" style={{ height: `${Math.random() * 60 + 20}%`}} />
             </div>
        ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ListCardSkeleton() {
    return (
        <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
            <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-2">
                 <Skeleton className="h-4 w-1/3 bg-slate-800 dark:bg-slate-800" />
                 <Skeleton className="h-3 w-1/4 mt-1 bg-slate-800 dark:bg-slate-800" />
            </CardHeader>
            <CardContent className="p-3 md:pt-3 md:pb-3 space-y-3">
                 {[...Array(4)].map((_, i) => (
                     <div key={i} className="flex items-center gap-3">
                         <div className="flex-1 space-y-1">
                             <Skeleton className="h-4 w-full bg-slate-800 dark:bg-slate-800" />
                             <Skeleton className="h-2 w-2/3 bg-slate-800 dark:bg-slate-800" />
                         </div>
                         <Skeleton className="h-8 w-12 bg-slate-800 dark:bg-slate-800" />
                     </div>
                 ))}
            </CardContent>
        </Card>
    )
}

export function DashboardSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <StatsCardsSkeleton />
            
             {/* Online Earnings Skeleton Hook - handled in its own component roughly but we place a placeholder here */}
             <div className="space-y-2">
                 <Skeleton className="h-5 w-48 bg-slate-800 dark:bg-slate-800" />
                 <StatsCardsSkeleton />
             </div>

            <RevenueChartSkeleton />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                <ListCardSkeleton />
                <ListCardSkeleton />
            </div>

            <ListCardSkeleton />
        </div>
    )
}
