"use client";

import { memo, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, Calendar as CalendarIcon, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface RevenueDataPoint {
  label: string;
  revenue: number;
  orders: number;
  dineIn?: number;
  takeaway?: number;
  delivery?: number;
  appRevenue?: number;
  posRevenue?: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  chartView: 'day' | 'hour' | 'month';
  onChartViewChange: (view: 'day' | 'hour' | 'month') => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  selectedMonth?: string;
  onMonthChange?: (month: string) => void;
  getIndianDate: () => Date;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-bold text-slate-200 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-400 capitalize">{entry.name}</span>
              </div>
              <span className="font-medium text-slate-200">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(entry.value)}
              </span>
            </div>
          ))}
          <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between gap-4">
             <span className="font-bold text-slate-300">Total</span>
             <span className="font-bold text-white">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}
             </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueChart = memo(({ 
  data, 
  chartView, 
  onChartViewChange, 
  selectedDate, 
  onDateChange, 
  selectedMonth, 
  onMonthChange,
  getIndianDate 
}: RevenueChartProps) => {
  
  const [viewMode, setViewMode] = useState<'type' | 'source'>('type');

  const hasData = useMemo(() => {
     return data.length > 0 && data.some(d => d.revenue > 0);
  }, [data]);

  return (
    <Card className="border border-slate-800 shadow-lg bg-slate-900 overflow-hidden relative">
      <CardHeader className="border-b border-slate-800 p-3 md:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                Revenue Analytics
              </CardTitle>
              <CardDescription className="text-slate-400 text-[10px] md:text-xs mt-1">
                {chartView === 'hour'
                  ? 'Kitchen day: 6 PM → 6 AM (IST)'
                  : viewMode === 'type' ? 'Breakdown by Order Type' : 'Breakdown by Revenue Source'}
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
             {/* Type vs Source Toggle */}
             <div className="flex bg-slate-800/50 p-0.5 md:p-1 rounded-lg border border-slate-800">
               <button
                 onClick={() => setViewMode('type')}
                 className={cn(
                   "px-2.5 py-1 text-[10px] md:text-xs font-medium rounded-md transition-all",
                   viewMode === 'type' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                 )}
               >
                 Order Type
               </button>
               <button
                 onClick={() => setViewMode('source')}
                 className={cn(
                   "px-2.5 py-1 text-[10px] md:text-xs font-medium rounded-md transition-all",
                   viewMode === 'source' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                 )}
               >
                 Source
               </button>
             </div>

             {/* Time View Controls */}
             <div className="flex bg-slate-800/50 p-0.5 md:p-1 rounded-lg border border-slate-800">
               {(['hour', 'day', 'month'] as const).map((view) => (
                 <button
                   key={view}
                   onClick={() => onChartViewChange(view)}
                   className={cn(
                     "px-2.5 py-1 text-[10px] md:text-xs font-medium rounded-md transition-all capitalize",
                     chartView === view 
                       ? "bg-slate-700 text-white shadow-sm" 
                       : "text-slate-400 hover:text-slate-200"
                   )}
                 >
                   {view}
                 </button>
               ))}
             </div>

             {/* Date Pickers */}
             {chartView === 'hour' && onDateChange && selectedDate && (
               <Popover>
                 <PopoverTrigger asChild>
                   <Button variant="outline" size="sm" className="h-7 md:h-8 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] md:text-xs px-2 md:px-3">
                     <CalendarIcon className="mr-1.5 h-3 w-3 md:h-3.5 md:w-3.5" />
                     {format(selectedDate, "dd MMM")}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
                   <Calendar
                     mode="single"
                     selected={selectedDate}
                     onSelect={(d) => d && onDateChange(d)}
                     disabled={(d) => d > getIndianDate()}
                     initialFocus
                     className="bg-slate-900 text-white"
                   />
                 </PopoverContent>
               </Popover>
             )}
             
             {(chartView === 'day' || chartView === 'month') && onMonthChange && selectedMonth && (
               <Popover>
                 <PopoverTrigger asChild>
                   <Button variant="outline" size="sm" className="h-7 md:h-8 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white text-[10px] md:text-xs px-2 md:px-3">
                     <CalendarIcon className="mr-1.5 h-3 w-3 md:h-3.5 md:w-3.5" />
                     {format(new Date(selectedMonth + '-01'), "MMM yyyy")}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-800" align="end">
                   <div className="p-3 grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const now = getIndianDate();
                        const d = new Date(now);
                        d.setMonth(d.getMonth() - (11 - i));
                        const mStr = format(d, 'MMM');
                        const mNum = (d.getMonth() + 1).toString().padStart(2, '0');
                        const yStr = d.getFullYear(); 
                        const val = `${yStr}-${mNum}`;
                        const isSelected = selectedMonth === val;
                        return (
                          <button
                            key={i}
                            onClick={() => onMonthChange(val)}
                            className={cn(
                              "text-xs p-2 rounded hover:bg-slate-800 text-slate-300",
                              isSelected && "bg-emerald-600 text-white hover:bg-emerald-700"
                            )}
                          >
                            {mStr}
                          </button>
                        )
                      })}
                   </div>
                 </PopoverContent>
               </Popover>
             )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 md:p-6 h-[280px] md:h-[350px]">
        {!hasData ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <Info className="h-8 w-8 opacity-50" />
              <p className="text-sm">No revenue data available for this period</p>
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 10 }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                iconSize={8}
              />
              {/* Order Type bars — always rendered, hidden when in source mode */}
              <Bar 
                dataKey="dineIn" 
                name="Dine-In" 
                stackId="type" 
                fill="#3b82f6"
                radius={[0, 0, 4, 4]}
                maxBarSize={50}
                hide={viewMode === 'source'}
              />
              <Bar 
                dataKey="takeaway" 
                name="Takeaway" 
                stackId="type" 
                fill="#f59e0b"
                maxBarSize={50}
                hide={viewMode === 'source'}
              />
              <Bar 
                dataKey="delivery" 
                name="Delivery" 
                stackId="type" 
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                hide={viewMode === 'source'}
              />
              {/* Source bars — always rendered, hidden when in type mode */}
              <Bar 
                dataKey="appRevenue" 
                name="Zlice App" 
                stackId="source" 
                fill="#6366f1"
                radius={[0, 0, 4, 4]}
                maxBarSize={50}
                hide={viewMode === 'type'}
              />
              <Bar 
                dataKey="posRevenue" 
                name="POS Direct" 
                stackId="source" 
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                hide={viewMode === 'type'}
              />
            </BarChart>

          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.chartView === nextProps.chartView &&
    prevProps.selectedDate?.getTime() === nextProps.selectedDate?.getTime() &&
    prevProps.selectedMonth === nextProps.selectedMonth &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

RevenueChart.displayName = "RevenueChart";
