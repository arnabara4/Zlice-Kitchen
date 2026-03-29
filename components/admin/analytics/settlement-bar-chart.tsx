'use client';

import { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';
import type { SettlementTimeSeriesPoint, DateGranularity } from '@/types/analytics';

interface SettlementBarChartProps {
  data: SettlementTimeSeriesPoint[];
  granularity: DateGranularity;
  loading?: boolean;
}

// REQUIRED: Stack segment configuration
// Order matters: bottom to top rendering (first = bottom, last = top)
const STACK_SEGMENTS = [
  { key: 'canteenPayment', name: 'Kitchen Payment', color: '#10b981' }, // emerald
  { key: 'deliveryAmount', name: 'Delivery Partner', color: '#3b82f6' }, // blue
  { key: 'gatewayAmount', name: 'Payment Gateway', color: '#f59e0b' },  // amber
  { key: 'profit', name: 'Platform Profit', color: '#8b5cf6' },         // violet
] as const;

// Single stackId for ALL bars - CRITICAL for stacking to work
const STACK_ID = 'settlement';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  // Calculate total for this bar
  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 min-w-[200px]">
      <p className="font-semibold text-slate-900 dark:text-white mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        {label}
      </p>
      <div className="space-y-2">
        {/* Reverse order for tooltip (top segment first) */}
        {[...payload].reverse().map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {entry.name}
              </span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(entry.value || 0)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
        <span className="text-sm text-slate-600 dark:text-slate-400">Total Revenue</span>
        <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(total)}</span>
      </div>
      {payload[0]?.payload?.orders > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {payload[0].payload.orders} orders
        </p>
      )}
    </div>
  );
}

function ChartSkeleton() {
  const barHeights = [65, 80, 55, 90, 45, 70, 60];
  
  return (
    <Card className="border shadow-sm animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-end justify-around p-4">
          {barHeights.map((height, i) => (
            <div 
              key={i} 
              className="bg-slate-200 dark:bg-slate-700 rounded-t w-8"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const SettlementBarChart = memo(({ 
  data, 
  granularity,
  loading 
}: SettlementBarChartProps) => {
  // ALL HOOKS BEFORE CONDITIONAL RETURN
  const totals = useMemo(() => {
    if (!data?.length) return { canteenPayment: 0, deliveryAmount: 0, gatewayAmount: 0, profit: 0, revenue: 0 };
    return data.reduce((acc, d) => ({
      canteenPayment: acc.canteenPayment + (d.canteenPayment || 0),
      deliveryAmount: acc.deliveryAmount + (d.deliveryAmount || 0),
      gatewayAmount: acc.gatewayAmount + (d.gatewayAmount || 0),
      profit: acc.profit + (d.profit || 0),
      revenue: acc.revenue + (d.revenue || 0),
    }), { canteenPayment: 0, deliveryAmount: 0, gatewayAmount: 0, profit: 0, revenue: 0 });
  }, [data]);

  // Ensure all data points have valid numbers (CRITICAL for visibility)
  const validatedData = useMemo(() => {
    if (!data?.length) return [];
    return data.map(d => ({
      date: d.date,
      orders: Number(d.orders) || 0,
      revenue: Number(d.revenue) || 0,
      canteenPayment: Number(d.canteenPayment) || 0,
      deliveryAmount: Number(d.deliveryAmount) || 0,
      gatewayAmount: Number(d.gatewayAmount) || 0,
      profit: Number(d.profit) || 0,
    }));
  }, [data]);

  const granularityLabel = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
  }[granularity];

  // Format Y-axis
  const formatYAxis = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  // Loading state AFTER all hooks
  if (loading) {
    return <ChartSkeleton />;
  }

  // DEBUG: Log data to console (remove in production)
  if (typeof window !== 'undefined' && validatedData.length > 0) {
    console.log('[SettlementBarChart] Data points:', validatedData.length);
    console.log('[SettlementBarChart] Sample data:', validatedData[0]);
    console.log('[SettlementBarChart] Totals:', totals);
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Settlement Breakdown
            </CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              {granularityLabel} financial distribution
              <Info className="w-3 h-3 text-slate-400" />
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="font-normal">
              Total: {formatCurrency(totals.revenue)}
            </Badge>
            <Badge 
              variant="secondary"
              className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
            >
              Profit: {formatCurrency(totals.profit)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {validatedData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">
              No settlement data for the selected period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={validatedData}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                className="dark:stroke-slate-700"
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 'dataMax']}
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: 10 }}
                iconType="square"
                // Reverse legend to match tooltip order (profit at top)
                payload={[...STACK_SEGMENTS].reverse().map(seg => ({
                  value: seg.name,
                  type: 'square',
                  color: seg.color,
                }))}
              />
              
              {/* CRITICAL: All bars must use the SAME stackId */}
              {STACK_SEGMENTS.map((segment) => (
                <Bar 
                  key={segment.key}
                  dataKey={segment.key}
                  name={segment.name}
                  fill={segment.color}
                  stackId={STACK_ID}
                  // Only apply radius to top segment
                  radius={segment.key === 'profit' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});

SettlementBarChart.displayName = 'SettlementBarChart';

export default SettlementBarChart;
