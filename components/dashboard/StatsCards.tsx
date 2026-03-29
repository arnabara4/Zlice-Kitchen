"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  ShoppingCart, 
  IndianRupee, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  todayKhataCollection: number;
  yesterdayKhataCollection: number;
  avgOrderValue: number;
  previousAvgOrderValue: number;
}

const calculateGrowth = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const GrowthIndicator = ({ current, previous }: { current: number; previous: number }) => {
  const growth = calculateGrowth(current, previous);
  const isPositive = growth >= 0;

  return (
    <div className={`flex items-center gap-0.5 text-xs font-medium ${
      isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
    }`}>
      {isPositive ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      <span>{Math.abs(growth).toFixed(1)}%</span>
    </div>
  );
};

const AnimatedNumber = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current += increment;
      if (step >= steps) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return <>{prefix}{displayValue.toLocaleString('en-IN')}{suffix}</>;
};

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-2.5 md:mb-4">
      {/* Today's Revenue */}
      <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 active:scale-[0.98] transition-transform md:active:scale-100">
        <CardContent className="p-3 md:pt-3 md:pb-3">
          <div className="flex items-start justify-between mb-1.5 md:mb-1">
            <div className="h-8 w-8 md:h-7 md:w-7 rounded bg-emerald-900/20 md:bg-emerald-100 md:dark:bg-emerald-900/20 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 md:h-3.5 md:w-3.5 text-emerald-400 md:text-emerald-600 md:dark:text-emerald-400" />
            </div>
            <GrowthIndicator current={stats.todayRevenue} previous={stats.yesterdayRevenue} />
          </div>
          <p className="text-xs md:text-xs font-medium text-slate-400 md:text-slate-500 md:dark:text-slate-400 mb-1 md:mb-0.5">
            Revenue
          </p>
          <h3 className="text-lg md:text-xl font-bold text-white md:text-slate-900 md:dark:text-white truncate">
            ₹<AnimatedNumber value={stats.todayRevenue} />
          </h3>
        </CardContent>
      </Card>

      {/* Today's Orders */}
      <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 active:scale-[0.98] transition-transform md:active:scale-100">
        <CardContent className="p-3 md:pt-3 md:pb-3">
          <div className="flex items-start justify-between mb-1.5 md:mb-1">
            <div className="h-8 w-8 md:h-7 md:w-7 rounded bg-red-900/20 md:bg-red-100 md:dark:bg-red-900/20 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 md:h-3.5 md:w-3.5 text-red-400 md:text-red-600 md:dark:text-red-400" />
            </div>
            <GrowthIndicator current={stats.todayOrders} previous={stats.yesterdayOrders} />
          </div>
          <p className="text-xs md:text-xs font-medium text-slate-400 md:text-slate-500 md:dark:text-slate-400 mb-1 md:mb-0.5">
            Orders
          </p>
          <h3 className="text-lg md:text-xl font-bold text-white md:text-slate-900 md:dark:text-white">
            <AnimatedNumber value={stats.todayOrders} />
          </h3>
        </CardContent>
      </Card>

      {/* Avg Order Value */}
      <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 active:scale-[0.98] transition-transform md:active:scale-100">
        <CardContent className="p-3 md:pt-3 md:pb-3">
          <div className="flex items-start justify-between mb-1.5 md:mb-1">
            <div className="h-8 w-8 md:h-7 md:w-7 rounded bg-rose-900/20 md:bg-rose-100 md:dark:bg-rose-900/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 md:h-3.5 md:w-3.5 text-rose-400 md:text-rose-600 md:dark:text-rose-400" />
            </div>
            <GrowthIndicator current={stats.avgOrderValue} previous={stats.previousAvgOrderValue} />
          </div>
          <p className="text-xs md:text-xs font-medium text-slate-400 md:text-slate-500 md:dark:text-slate-400 mb-1 md:mb-0.5">
            Avg Value
          </p>
          <h3 className="text-lg md:text-xl font-bold text-white md:text-slate-900 md:dark:text-white truncate">
            ₹<AnimatedNumber value={Math.round(stats.avgOrderValue)} />
          </h3>
        </CardContent>
      </Card>

      {/* Khata Collection */}
      <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 active:scale-[0.98] transition-transform md:active:scale-100">
        <CardContent className="p-3 md:pt-3 md:pb-3">
          <div className="flex items-start justify-between mb-1.5 md:mb-1">
            <div className="h-8 w-8 md:h-7 md:w-7 rounded bg-amber-900/20 md:bg-amber-100 md:dark:bg-amber-900/20 flex items-center justify-center">
              <Wallet className="h-4 w-4 md:h-3.5 md:w-3.5 text-amber-400 md:text-amber-600 md:dark:text-amber-400" />
            </div>
            <GrowthIndicator current={stats.todayKhataCollection} previous={stats.yesterdayKhataCollection} />
          </div>
          <p className="text-xs md:text-xs font-medium text-slate-400 md:text-slate-500 md:dark:text-slate-400 mb-1 md:mb-0.5">
            Khata Collection
          </p>
          <h3 className="text-lg md:text-xl font-bold text-white md:text-slate-900 md:dark:text-white truncate">
            ₹<AnimatedNumber value={stats.todayKhataCollection} />
          </h3>
        </CardContent>
      </Card>
    </div>
  );
}
