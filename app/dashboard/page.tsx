"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useCanteen } from "@/lib/canteen-context";
import { Button } from "@/components/ui/button";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatCurrency } from "@/lib/financial-utils";
import { 
  BarChart3, 
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  IndianRupee,
  Users, 
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  LayoutDashboard, 
  Home
} from "lucide-react";

// Components
import { 
  KPICard, 
  GrowthIndicator
} from "@/components/dashboard/kpi-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopItemsCard, PeakHoursCard, OrderValueDistribution } from "@/components/dashboard/analytics-cards";
import { SettlementOverview } from "@/components/dashboard/settlement/settlement-overview";
import { SalesBreakdownCard } from "@/components/dashboard/sales-breakdown";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/dashboard/skeletons";

// Hooks
import { 
  useDashboardStats, 
  useDashboardChart, 
  useCacheInvalidator
} from "@/hooks/use-dashboard-fetch";

// Helper functions
const getIndianDate = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

// Helper to format date as YYYY-MM-DD in IST
const formatDateIST = (date: Date): string => {
  const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function Dashboard() {
  const { selectedCanteen, selectedCanteenId, loading: canteenLoading } = useCanteen();
  const canteenId = selectedCanteenId ?? undefined;

  // UI State
  const [chartView, setChartView] = useState<'day' | 'hour' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(getIndianDate());
  const [selectedMonth, setSelectedMonth] = useState<string>(getIndianDate().toISOString().slice(0, 7));

  // Fetch Data
  const { 
    data: statsData, 
    loading: statsLoading, 
    isStale: statsStale,
    refresh: refreshStats 
  } = useDashboardStats(canteenId);
  
  const { 
    data: chartData, 
    loading: chartLoading,
    refresh: refreshChart 
  } = useDashboardChart(
    canteenId,
    chartView,
    chartView === 'hour' ? formatDateIST(selectedDate) : undefined,
    chartView === 'day' ? selectedMonth : chartView === 'month' ? selectedMonth : undefined
  );

  // Memoized Stats
  const stats = useMemo(() => statsData?.stats || {
    todayRevenue: 0,
    yesterdayRevenue: 0,
    todayOrders: 0,
    yesterdayOrders: 0,
    totalStudents: 0,
    activeStudents: 0,
    todayKhataCollection: 0,
    yesterdayKhataCollection: 0,
    avgOrderValue: 0,
    previousAvgOrderValue: 0,
  }, [statsData]);

  const topItems = useMemo(() => statsData?.topItems || [], [statsData]);
  const hourlyData = useMemo(() => statsData?.hourlyData || [], [statsData]);
  const categoryData = useMemo(() => statsData?.categoryData || [], [statsData]);
  const revenueChartData = useMemo(() => chartData?.data || [], [chartData]);
  
  const wallet = useMemo(() => statsData?.wallet || {
    netBalance:    0,
    lifetimeGross: 0,
    lifetimeNet:   0,
    lifetimePaid:  0,
    aov:           0,
    totalCharges:  0,
  }, [statsData]);

  const salesBreakdown = useMemo(() => statsData?.salesBreakdown || {
    zlice: { count: 0, revenue: 0 },
    pos: { count: 0, revenue: 0 },
    channels: {
      dineIn: { count: 0, revenue: 0 },
      takeaway: { count: 0, revenue: 0 },
      delivery: { count: 0, revenue: 0 }
    }
  }, [statsData]);

  // Handlers
  const handleChartViewChange = useCallback((view: 'day' | 'hour' | 'month') => {
    setChartView(view);
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
  }, []);

  const { clearCanteenCache } = useCacheInvalidator();

  const handleRefresh = useCallback(() => {
    if (canteenId) {
      clearCanteenCache(canteenId);
    }
    refreshStats();
    refreshChart();
  }, [canteenId, refreshStats, refreshChart]);

  const isRefreshing = statsLoading && !statsData;

  // View States
  if (canteenLoading) return <DashboardSkeleton />;
  
  if (!selectedCanteen) {
    return (
      <div className="min-h-full bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <LayoutDashboard className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">Select a kitchen to view dashboard</p>
        </div>
      </div>
    );
  }

  if (statsLoading && !statsData) return <DashboardSkeleton />;

  return (
    <div className="min-h-full bg-slate-950 md:bg-white md:dark:bg-slate-950">
      {/* Mobile Fixed Header */}
      <div className="md:hidden sticky top-0 z-10 bg-slate-900 border-b border-slate-800">
        <div className="px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Dashboard</h1>
                <p className="text-[10px] text-slate-400">
                  {statsStale ? 'Updating...' : 'Analytics & insights'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              size="sm"
              variant="ghost"
              className="h-9 w-9 p-0 hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} text-slate-300`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 md:px-4 lg:px-8 py-2 md:py-4">
        {/* Desktop Header */}
        <div className="hidden md:block mb-4">
           <Breadcrumb className="mb-3">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-200">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-slate-900 dark:text-slate-200">
                  Dashboard
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {selectedCanteen.name}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Here's what's happening today.
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="hidden md:flex gap-2 border-slate-200 dark:border-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* 1. TOP: Settlement Overview Module */}
        <div className="mb-4">
          <SettlementOverview 
            stats={{
              totalRevenue: wallet.lifetimeGross,
              platformFees: wallet.totalCharges || 0,
              netPayable: wallet.lifetimeNet,
              alreadySettled: wallet.lifetimePaid,
              remainingPayable: wallet.netBalance,
            }}
            walletStats={wallet}
            isLoading={statsLoading}
          />
        </div>

        {/* 2. CORE METRICS: Single Horizontal Row */}
        <Card className="mb-6 bg-slate-900/50 border-white/5 shadow-xl overflow-hidden">
           <CardContent className="p-2 sm:p-4">
             <div className="flex items-center justify-between divide-x divide-white/5">
               
               {/* Lifetime Gross */}
               <div className="flex-1 px-1 sm:px-3 flex flex-col items-center text-center">
                 <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                   <Wallet className="w-3 h-3 text-amber-500" />
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tighter sm:tracking-widest">Gross</span>
                 </div>
                 <span className="text-base sm:text-lg font-bold text-white whitespace-nowrap">
                   {formatCurrency(wallet.lifetimeGross)}
                 </span>
               </div>

               {/* Today's Revenue */}
               <div className="flex-1 px-1 sm:px-3 flex flex-col items-center text-center">
                 <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                   <TrendingUp className="w-3 h-3 text-emerald-500" />
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tighter sm:tracking-widest">Today</span>
                 </div>
                 <div className="flex flex-col items-center">
                   <span className="text-xs sm:text-base font-bold text-emerald-400">
                     ₹{stats.todayRevenue.toLocaleString('en-IN')}
                   </span>
                   <div className="scale-75 sm:scale-100 mt-0.5">
                     <GrowthIndicator current={stats.todayRevenue} previous={stats.yesterdayRevenue} />
                   </div>
                 </div>
               </div>

               {/* Today's Orders */}
               <div className="flex-1 px-1 sm:px-3 flex flex-col items-center text-center">
                 <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                   <ShoppingBag className="w-3 h-3 text-blue-500" />
                   <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-tighter sm:tracking-widest">Orders</span>
                 </div>
                 <div className="flex flex-col items-center">
                   <span className="text-xs sm:text-base font-bold text-blue-400">
                     {stats.todayOrders}
                   </span>
                   <div className="scale-75 sm:scale-100 mt-0.5">
                     <GrowthIndicator current={stats.todayOrders} previous={stats.yesterdayOrders} />
                   </div>
                 </div>
               </div>

             </div>
           </CardContent>
        </Card>

        {/* 3. Main Content Grid (Charts, etc) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
           
           {/* Left Column: Settlement, Chart & Sales */}
           <div className="lg:col-span-2 space-y-4">

              {/* Revenue Chart */}
              <RevenueChart 
                data={revenueChartData}
                chartView={chartView}
                onChartViewChange={handleChartViewChange}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                selectedMonth={selectedMonth}
                onMonthChange={handleMonthChange}
                getIndianDate={getIndianDate}
              />

              {/* Sales Breakdown (full width below chart) */}
              <SalesBreakdownCard data={salesBreakdown} />
           </div>

           {/* Right Column: Top Items, Peak Hours, Order Distribution */}
           <div className="space-y-4">
              <TopItemsCard items={topItems} />
              <PeakHoursCard data={hourlyData} />
              <OrderValueDistribution data={categoryData} />
           </div>

        </div>

      </div>
    </div>
  );
}
