"use client";

import { useState, useEffect, memo, useMemo } from "react";
import Link from "next/link";
import { format, addBusinessDays } from "date-fns";
import { 
  Globe, 
  CalendarIcon, 
  ChevronRight, 
  Bike,
  ExternalLink,
  ArrowRight,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentOrdersTable } from "./recent-orders-table";
import { cn } from "@/lib/utils";

interface OnlineEarningsStats {
  totalEarned: number;
  totalPaid: number;
  totalDue: number;
  totalOrders: number;
}

// Helper to format currency in Indian format
const formatCurrency = (amount: number, showSymbol = true) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);
  return showSymbol ? `₹${formatted}` : formatted;
};

// Calculate next T+2 settlement date (skipping weekends)
const getNextSettlementDate = () => {
  const today = new Date();
  return addBusinessDays(today, 2);
};

// Animated number component
const AnimatedNumber = memo(({ value, prefix = "₹" }: { value: number; prefix?: string }) => {
  return <>{prefix}{formatCurrency(value, false)}</>;
});
AnimatedNumber.displayName = "AnimatedNumber";

// Donut Chart Component for Settlement Visualization
const SettlementDonut = memo(({ 
  settled, 
  pending, 
  size = 120 
}: { 
  settled: number; 
  pending: number; 
  size?: number;
}) => {
  const total = settled + pending;
  const settledPercent = total > 0 ? (settled / total) * 100 : 0;
  const pendingPercent = total > 0 ? (pending / total) * 100 : 0;
  
  // SVG calculations
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const settledOffset = circumference - (settledPercent / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
        />
        {/* Settled portion */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={settledOffset}
          strokeLinecap="round"
          className="text-slate-900 dark:text-white transition-all duration-700 ease-out"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-white">
          {settledPercent.toFixed(0)}%
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Settled
        </span>
      </div>
    </div>
  );
});
SettlementDonut.displayName = "SettlementDonut";

// Horizontal Bar Chart for breakdown
const SettlementBar = memo(({ settled, pending }: { settled: number; pending: number }) => {
  const total = settled + pending;
  const settledPercent = total > 0 ? (settled / total) * 100 : 0;
  
  return (
    <div className="w-full">
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-700 ease-out"
          style={{ width: `${settledPercent}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
        <span>{settledPercent.toFixed(0)}% settled</span>
        <span>{(100 - settledPercent).toFixed(0)}% pending</span>
      </div>
    </div>
  );
});
SettlementBar.displayName = "SettlementBar";

// Minimal Stat Item
const StatItem = memo(({ 
  label, 
  value, 
  sublabel,
  isHighlighted = false 
}: { 
  label: string; 
  value: number;
  sublabel?: string;
  isHighlighted?: boolean;
}) => {
  return (
    <div className={cn(
      "py-3 border-b border-slate-100 dark:border-slate-800 last:border-0",
      isHighlighted && "bg-slate-50/50 dark:bg-slate-800/30 -mx-4 px-4 rounded-lg border-0"
    )}>
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
          {sublabel && (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">{sublabel}</span>
          )}
        </div>
        <span className={cn(
          "text-lg font-semibold tabular-nums",
          isHighlighted 
            ? "text-slate-900 dark:text-white" 
            : "text-slate-700 dark:text-slate-300"
        )}>
          <AnimatedNumber value={value} />
        </span>
      </div>
    </div>
  );
});
StatItem.displayName = "StatItem";

// Loading Skeleton
function OnlineEarningsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[120px] w-[120px] rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

// Main Component
export function OnlineEarnings({ 
    initialStats, 
    initialDeliveryStats,
    initialOrders = [] 
}: { 
    initialStats?: OnlineEarningsStats, 
    initialDeliveryStats?: any,
    initialOrders?: any[]
}) {
  const [stats, setStats] = useState<OnlineEarningsStats>(initialStats || {
    totalEarned: 0,
    totalPaid: 0,
    totalDue: 0,
    totalOrders: 0,
  });
  
  const [orders, setOrders] = useState<any[]>(initialOrders || []);
  const [deliveryEarnings, setDeliveryEarnings] = useState<any>(initialDeliveryStats || null);
  const [hasDeliveryPartners, setHasDeliveryPartners] = useState(!!initialDeliveryStats);
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(!initialStats);

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  // Sync with prop updates
  useEffect(() => {
    if (initialStats && !startDate && !endDate) {
      setStats(initialStats);
    }
    if (initialOrders && !startDate && !endDate) {
      setOrders(initialOrders);
    }
    if (initialDeliveryStats) {
      setDeliveryEarnings(initialDeliveryStats);
      setHasDeliveryPartners(true);
    }
  }, [initialStats, initialDeliveryStats, initialOrders, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const earningsUrl = new URL("/api/canteen/online-earnings", window.location.origin);
      if (startDate) {
        earningsUrl.searchParams.set("startDate", startDate.toISOString());
      }
      if (endDate) {
        const d = new Date(endDate);
        d.setHours(23, 59, 59, 999);
        earningsUrl.searchParams.set("endDate", d.toISOString());
      }

      const earningsResponse = await fetch(earningsUrl.toString());
      if (earningsResponse.ok) {
        const data = await earningsResponse.json();
        setStats(data.stats);
        setOrders(data.orders || []);
      }

      if (!initialDeliveryStats && !deliveryEarnings) {
        const deliveryResponse = await fetch('/api/canteen/delivery-earnings');
        if (deliveryResponse.ok) {
          const deliveryResult = await deliveryResponse.json();
          if (deliveryResult.deliveryEarnings && deliveryResult.deliveryEarnings.length > 0) {
            setHasDeliveryPartners(true);
            const totalStats = deliveryResult.deliveryEarnings.reduce(
              (acc: any, de: any) => ({
                totalEarned: acc.totalEarned + de.stats.totalEarned,
                totalPaid: acc.totalPaid + de.stats.totalPaid,
                pendingPayment: acc.pendingPayment + de.stats.pendingPayment,
                totalDeliveries: acc.totalDeliveries + de.stats.totalDeliveries,
              }),
              { totalEarned: 0, totalPaid: 0, pendingPayment: 0, totalDeliveries: 0 }
            );
            setDeliveryEarnings(totalStats);
          } else {
            setHasDeliveryPartners(false);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Computed values
  const hasFilters = startDate || endDate;
  const nextSettlementDate = getNextSettlementDate();

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Minimal Header */}
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Online Earnings</CardTitle>
              <CardDescription className="text-xs">
                {hasFilters 
                  ? `${startDate ? format(startDate, "dd MMM") : 'Start'} → ${endDate ? format(endDate, "dd MMM") : 'Today'}`
                  : 'T+2 settlement cycle'
                }
              </CardDescription>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-600 dark:text-slate-400">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {startDate ? format(startDate, "dd MMM") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > getIndianDate()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-slate-300 dark:text-slate-600 text-xs">→</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-600 dark:text-slate-400">
                    {endDate ? format(endDate, "dd MMM") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date > getIndianDate()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {hasFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 text-slate-400" 
                  onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
                >
                  ×
                </Button>
              )}
            </div>
            
            <Link href="/canteen/earnings">
              <Button size="sm" variant="outline" className="h-8 text-xs">
                Details
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading && !stats.totalEarned ? (
          <OnlineEarningsSkeleton />
        ) : (
          <>
            {/* Main Content: Chart + Stats */}
            <div className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                {/* Donut Chart */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                  <SettlementDonut 
                    settled={stats.totalPaid} 
                    pending={stats.totalDue} 
                    size={140}
                  />
                </div>

                {/* Stats List */}
                <div className="flex-1 w-full">
                  <StatItem 
                    label="Total Earned" 
                    value={stats.totalEarned}
                    sublabel="gross"
                  />
                  <StatItem 
                    label="Settled" 
                    value={stats.totalPaid}
                    sublabel="received"
                  />
                  <StatItem 
                    label="Pending" 
                    value={stats.totalDue}
                    sublabel={stats.totalDue > 0 ? `next: ${format(nextSettlementDate, "dd MMM")}` : undefined}
                    isHighlighted={stats.totalDue > 0}
                  />
                </div>
              </div>

              {/* Settlement Bar - Mobile friendly alternative view */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <SettlementBar settled={stats.totalPaid} pending={stats.totalDue} />
              </div>

              {/* Orders Count */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total Orders</span>
                <span className="font-semibold text-slate-900 dark:text-white">{stats.totalOrders}</span>
              </div>
            </div>

            {/* Recent Orders Section */}
            {orders.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Recent Orders</h4>
                    <Link href="/canteen/earnings">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500">
                        View All
                        <ChevronRight className="ml-0.5 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <RecentOrdersTable orders={orders.slice(0, 5)} />
                </div>
              </div>
            )}

            {/* Delivery Partner Section - Minimal */}
            {!loading && hasDeliveryPartners && deliveryEarnings && (
              <div className="border-t border-dashed border-slate-200 dark:border-slate-700">
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Delivery Partners</span>
                    </div>
                    <Link href="/canteen/delivery-earnings">
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500">
                        Manage
                        <ChevronRight className="ml-0.5 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Minimal delivery stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(deliveryEarnings.totalEarned)}
                      </div>
                      <div className="text-xs text-slate-500">Earned</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(deliveryEarnings.totalPaid)}
                      </div>
                      <div className="text-xs text-slate-500">Paid</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(deliveryEarnings.pendingPayment)}
                      </div>
                      <div className="text-xs text-slate-500">Pending</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {deliveryEarnings.totalDeliveries}
                      </div>
                      <div className="text-xs text-slate-500">Deliveries</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
