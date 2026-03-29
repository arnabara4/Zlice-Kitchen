"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Globe,
  CalendarIcon,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  Clock,
  ShoppingCart,
  Bike,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentOrdersTable } from "./recent-orders-table";

interface OnlineEarningsStats {
  totalEarned: number;
  totalPaid: number;
  totalDue: number;
  totalOrders: number;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  return <>{value?.toLocaleString("en-IN")}</>;
};

function OnlineEarningsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
      {[...Array(4)].map((_, i) => (
        <Card
          key={i}
          className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900">
          <CardContent className="p-3 md:pt-3 md:pb-3">
            <div className="flex items-start justify-between mb-1.5 md:mb-1">
              <Skeleton className="h-7 w-7 rounded bg-slate-800 dark:bg-slate-800" />
            </div>
            <Skeleton className="h-3 w-16 mb-1 md:mb-0.5 bg-slate-800 dark:bg-slate-800" />
            <Skeleton className="h-6 w-24 bg-slate-800 dark:bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function OnlineEarnings({
  initialStats,
  initialDeliveryStats,
  initialOrders = [],
}: {
  initialStats?: OnlineEarningsStats;
  initialDeliveryStats?: any;
  initialOrders?: any[];
}) {
  const [stats, setStats] = useState<OnlineEarningsStats>(
    initialStats || {
      totalEarned: 0,
      totalPaid: 0,
      totalDue: 0,
      totalOrders: 0,
    },
  );

  const [orders, setOrders] = useState<any[]>(initialOrders || []); // New state for orders

  const [deliveryEarnings, setDeliveryEarnings] = useState<any>(
    initialDeliveryStats || null,
  );
  const [hasDeliveryPartners, setHasDeliveryPartners] =
    useState(!!initialDeliveryStats);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Only loading if we don't have initial data OR if we are fetching new data
  const [loading, setLoading] = useState(!initialStats);

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  };

  // Sync with prop updates (e.g. background refresh), but only if no filters are active
  useEffect(() => {
    if (initialStats && !startDate && !endDate) {
      setStats(initialStats);
    }
    if (initialOrders && !startDate && !endDate) {
      setOrders(initialOrders);
    }
    // Also sync delivery stats updates if available
    if (initialDeliveryStats) {
      setDeliveryEarnings(initialDeliveryStats);
      setHasDeliveryPartners(true);
    }
  }, [initialStats, initialDeliveryStats, initialOrders, startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Online Earnings
      const earningsUrl = new URL(
        "/api/canteen/online-earnings",
        window.location.origin,
      );
      if (startDate) {
        const d = new Date(startDate);
        earningsUrl.searchParams.set("startDate", d.toISOString());
      }
      if (endDate) {
        const d = new Date(endDate);
        // Set to end of day
        d.setHours(23, 59, 59, 999);
        earningsUrl.searchParams.set("endDate", d.toISOString());
      }

      const earningsResponse = await fetch(earningsUrl.toString());
      if (earningsResponse.ok) {
        const data = await earningsResponse.json();
        setStats(data.stats);
        setOrders(data.orders || []); // Set orders
      }

      // Only fetch delivery earnings if we don't have them yet
      if (!initialDeliveryStats && !deliveryEarnings) {
        const deliveryResponse = await fetch("/api/canteen/delivery-earnings", {
          credentials: "include",
        });
        if (deliveryResponse.ok) {
          const deliveryResult = await deliveryResponse.json();
          if (
            deliveryResult.deliveryEarnings &&
            deliveryResult.deliveryEarnings.length > 0
          ) {
            setHasDeliveryPartners(true);
            const totalStats = deliveryResult.deliveryEarnings.reduce(
              (acc: any, de: any) => ({
                totalEarned: acc.totalEarned + de.stats.totalEarned,
                totalPaid: acc.totalPaid + de.stats.totalPaid,
                pendingPayment: acc.pendingPayment + de.stats.pendingPayment,
                totalDeliveries: acc.totalDeliveries + de.stats.totalDeliveries,
              }),
              {
                totalEarned: 0,
                totalPaid: 0,
                pendingPayment: 0,
                totalDeliveries: 0,
              },
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
    // Fetch data on initial load to get orders (since initialStats doesn't have them usually)
    // Or if filters change
    fetchData();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Online Earnings Section */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Online Orders Earnings
            </h3>
            <p className="text-sm text-slate-500">
              Overview of your online order performance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-normal">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {startDate ? format(startDate, "dd MMM yyyy") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="end">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > getIndianDate()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-normal">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {endDate ? format(endDate, "dd MMM yyyy") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="end">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date > getIndianDate()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-2 text-slate-500"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}>
                Clear
              </Button>
            )}

            <Link href="/canteen/earnings">
              <Button
                size="sm"
                className="h-9 bg-slate-900 text-white hover:bg-slate-800">
                Full Details <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>

        {loading && !stats ? (
          <OnlineEarningsSkeleton />
        ) : (
          <div className="space-y-4">
            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Total Earned
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₹<AnimatedNumber value={stats.totalEarned} />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Total Paid
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ₹<AnimatedNumber value={stats.totalPaid} />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Total Due
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  ₹<AnimatedNumber value={stats.totalDue} />
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                  Orders
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  <AnimatedNumber value={stats.totalOrders} />
                </span>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent Orders
                </h4>
              </div>
              {/* Dynamically imported to avoid circular deps if any, but standard import is fine */}
              {/* Note: In a real app we might want to paginate this table if orders are many, key 'RecentOrdersTable' logic is simple display */}
              <RecentOrdersTable orders={orders} />
            </div>
          </div>
        )}
      </div>

      {/* Delivery Partner Earnings Section - Simplified */}
      {loading
        ? null
        : hasDeliveryPartners &&
          deliveryEarnings && (
            <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bike className="h-5 w-5 text-purple-500" />
                    Delivery Partner Earnings
                  </h3>
                </div>
                <Link href="/canteen/delivery-earnings">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs">
                    View All <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Total Earned
                  </span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    ₹<AnimatedNumber value={deliveryEarnings.totalEarned} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Total Paid
                  </span>
                  <span className="text-xl font-bold text-green-600">
                    ₹<AnimatedNumber value={deliveryEarnings.totalPaid} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Pending
                  </span>
                  <span className="text-xl font-bold text-orange-600">
                    ₹<AnimatedNumber value={deliveryEarnings.pendingPayment} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                    Deliveries
                  </span>
                  <span className="text-xl font-bold text-purple-600">
                    <AnimatedNumber value={deliveryEarnings.totalDeliveries} />
                  </span>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}
