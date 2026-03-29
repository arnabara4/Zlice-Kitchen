"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { CalendarIcon, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RevenueChartProps {
  orders: any[];
}

export function RevenueChart({ orders }: RevenueChartProps) {
  const [chartView, setChartView] = useState<'day' | 'hour' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Get Indian timezone date
  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  const revenueChartData = useMemo(() => {
    let data: any[] = [];
    
    if (chartView === 'hour') {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const selectedDayOrders = orders.filter(
        (o) => new Date(o.created_at) >= selectedDateObj && new Date(o.created_at) < nextDay
      );
      
      const hourlyRevenueMap = new Map<number, number>();
      const hourlyOrderMap = new Map<number, number>();
      for (let i = 0; i < 24; i++) {
        hourlyRevenueMap.set(i, 0);
        hourlyOrderMap.set(i, 0);
      }
      
      selectedDayOrders.forEach((order) => {
        const hour = new Date(order.created_at).getHours();
        hourlyRevenueMap.set(hour, (hourlyRevenueMap.get(hour) || 0) + Number(order.total_amount));
        hourlyOrderMap.set(hour, (hourlyOrderMap.get(hour) || 0) + 1);
      });
      
      data = Array.from(hourlyRevenueMap.entries())
        .map(([hour, revenue]) => ({
          label: `${hour.toString().padStart(2, '0')}:00`,
          revenue,
          orders: hourlyOrderMap.get(hour) || 0,
        }));
    } else if (chartView === 'day') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      const daysInMonth = lastDay.getDate();
      
      const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${day.toString().padStart(2, '0')} ${firstDay.toLocaleDateString("en-IN", { month: "short" })}`;
        dailyRevenueMap.set(dateStr, { revenue: 0, orders: 0 });
      }
      
      orders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        if (orderDate >= firstDay && orderDate <= lastDay) {
          const day = orderDate.getDate();
          const dateStr = `${day.toString().padStart(2, '0')} ${firstDay.toLocaleDateString("en-IN", { month: "short" })}`;
          const current = dailyRevenueMap.get(dateStr);
          if (current) {
            dailyRevenueMap.set(dateStr, {
              revenue: current.revenue + Number(order.total_amount),
              orders: current.orders + 1,
            });
          }
        }
      });
      
      data = Array.from(dailyRevenueMap.entries()).map(([label, d]) => ({
        label,
        revenue: d.revenue,
        orders: d.orders,
      }));
    } else {
      const today = getIndianDate();
      const monthlyRevenueMap = new Map<string, { revenue: number; orders: number }>();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
        monthlyRevenueMap.set(monthStr, { revenue: 0, orders: 0 });
      }
      
      orders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        
        if (orderDate >= sixMonthsAgo) {
          const monthStr = orderDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
          const current = monthlyRevenueMap.get(monthStr);
          if (current) {
            monthlyRevenueMap.set(monthStr, {
              revenue: current.revenue + Number(order.total_amount),
              orders: current.orders + 1,
            });
          }
        }
      });
      
      data = Array.from(monthlyRevenueMap.entries()).map(([label, d]) => ({
        label,
        revenue: d.revenue,
        orders: d.orders,
      }));
    }
    
    return data;
  }, [orders, chartView, selectedDate, selectedMonth]);

  // Auto-scroll effect
  useEffect(() => {
    if (revenueChartData.length > 0 && chartContainerRef.current) {
        const today = getIndianDate();
        let targetIndex = -1;
  
        if (chartView === 'day') {
          const todayDay = today.getDate();
          const todayMonth = today.toLocaleDateString('en-IN', { month: 'short' });
          const todayStr = `${todayDay.toString().padStart(2, '0')} ${todayMonth}`;
          targetIndex = revenueChartData.findIndex(item => item.label === todayStr);
        } else if (chartView === 'hour') {
            const currentHour = today.getHours();
            const hourStr = `${currentHour.toString().padStart(2, '0')}:00`;
            targetIndex = revenueChartData.findIndex(item => item.label === hourStr);
        } else if (chartView === 'month') {
            const currentMonth = today.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            targetIndex = revenueChartData.findIndex(item => item.label === currentMonth);
        }

        if (targetIndex !== -1) {
             const container = chartContainerRef.current;
             const itemWidth = 45; 
             const scrollPosition = Math.max(0, (targetIndex * itemWidth) - (container.clientWidth / 2) + (itemWidth / 2));
             setTimeout(() => {
                 container.scrollTo({
                     left: scrollPosition,
                     behavior: 'smooth'
                 });
             }, 100);
        }
    }
  }, [revenueChartData, chartView]);


  return (
    <Card className="border border-slate-800 md:border-slate-200 md:dark:border-slate-800 shadow-sm bg-slate-900 md:bg-white md:dark:bg-slate-900 mb-3 md:mb-5">
      <CardHeader className="border-b border-slate-800 md:border-slate-200 md:dark:border-slate-800 p-3 md:pb-3">
        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-sm font-semibold text-white md:text-slate-900 md:dark:text-white flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-red-500 md:text-red-600 md:dark:text-red-500" />
              Revenue
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            <Button
              variant={chartView === 'hour' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('hour')}
              className="h-7 text-[10px] px-2 flex-1"
            >
              Hour
            </Button>
            <Button
              variant={chartView === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('day')}
              className="h-7 text-[10px] px-2 flex-1"
            >
              Day
            </Button>
            <Button
              variant={chartView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartView('month')}
              className="h-7 text-[10px] px-2 flex-1"
            >
              Month
            </Button>
          </div>
          {(chartView === 'hour' || chartView === 'day') && (
            <div className="flex justify-center">
              {chartView === 'hour' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 w-full">
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {selectedDate ? format(selectedDate, "dd MMM yyyy") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => date > getIndianDate()} // Prevent future dates
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
              {chartView === 'day' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 w-full">
                      <CalendarIcon className="mr-1.5 h-3 w-3" />
                      {selectedMonth ? format(new Date(selectedMonth + '-01'), "MMM yyyy") : <span>Pick month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={new Date(selectedMonth + '-01')}
                      onSelect={(date) => {
                        if (date) setSelectedMonth(format(date, "yyyy-MM"));
                      }}
                      disabled={(date) => date > getIndianDate()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-500" />
              Revenue Collection
            </CardTitle>
            <CardDescription className="text-xs">
              {chartView === 'hour' ? 'Hourly breakdown for today' : 
               chartView === 'day' ? 'Daily breakdown for last 30 days' : 
               'Monthly breakdown for last 6 months'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {chartView === 'hour' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-7 text-xs px-2 justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {selectedDate ? format(selectedDate, "dd MMM yyyy") : <span>Pick date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > getIndianDate()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
             {chartView === 'day' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {selectedMonth ? format(new Date(selectedMonth + '-01'), "MMM yyyy") : <span>Pick month</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={new Date(selectedMonth + '-01')}
                      onSelect={(date) => {
                        if (date) setSelectedMonth(format(date, "yyyy-MM"));
                      }}
                      disabled={(date) => date > getIndianDate()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            <div className="flex gap-1">
              {['hour', 'day', 'month'].map((view) => (
                <Button
                  key={view}
                  variant={chartView === view ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView(view as any)}
                  className="h-7 text-xs px-2"
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:pt-4 md:pb-4">
        {revenueChartData.length === 0 || revenueChartData.every(d => d.revenue === 0) ? (
          <p className="text-center text-slate-500 dark:text-slate-400 text-xs py-8 md:py-12">
            No data available
          </p>
        ) : (
          <div className="overflow-x-auto md:overflow-x-scroll scrollbar-hide md:scrollbar-thin md:scrollbar-thumb-red-500 md:scrollbar-track-slate-200 md:dark:scrollbar-track-slate-800 md:hover:scrollbar-thumb-red-600" ref={chartContainerRef} style={{ scrollBehavior: 'smooth' }}>
            <div className="flex items-end gap-1.5 md:gap-2 h-[200px] md:h-[280px] px-2 md:px-2" style={{ minWidth: `${revenueChartData.length * (typeof window !== 'undefined' && window.innerWidth < 768 ? 35 : 45)}px` }}>
            <TooltipProvider>
            {revenueChartData.map((item, index) => {
              const maxRevenue = Math.max(...revenueChartData.map(d => d.revenue));
              const heightPx = maxRevenue > 0 ? Math.max((item.revenue / maxRevenue) * (typeof window !== 'undefined' && window.innerWidth < 768 ? 180 : 260), 8) : 8;
              
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center justify-end gap-1 min-w-[20px] group cursor-pointer h-full active:opacity-75 transition-opacity">
                      <div className="w-full relative" style={{ height: `${heightPx}px` }}>
                        <div className="w-full h-full bg-gradient-to-t from-red-600 via-rose-500 to-red-400 dark:from-red-700 dark:via-red-600 dark:to-red-500 rounded-sm md:hover:opacity-90 transition-opacity">
                          {heightPx > 60 && (
                            <div className="absolute top-1.5 md:top-2 left-0 right-0 flex flex-col items-center">
                              <span className="text-[10px] md:text-xs font-bold text-white">
                                ₹{item.revenue > 1000 ? (item.revenue / 1000).toFixed(1) + 'k' : item.revenue}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] md:text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-full text-center">
                        {item.label.length > 6 ? item.label.substring(0, 6) : item.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-bold">{item.label}</p>
                      <p className="font-semibold text-red-400">₹{item.revenue.toLocaleString('en-IN')}</p>
                      <p className="text-slate-400">{item.orders} orders</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            </TooltipProvider>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
