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
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';
import type { RevenueTimeSeriesPoint, DateGranularity } from '@/types/analytics';

interface RevenueChartProps {
  data: RevenueTimeSeriesPoint[];
  granularity: DateGranularity;
  showZlicePos?: boolean;
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
      <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {entry.name}
              </span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
      {payload[0]?.payload?.orders && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          {payload[0].payload.orders} orders
        </p>
      )}
    </div>
  );
}

function ChartSkeleton() {
  // Use deterministic heights to avoid hydration mismatch (no Math.random())
  const barHeights = [65, 80, 55, 90, 45, 70, 60];
  
  return (
    <Card className="border shadow-sm animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-56 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
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

export const RevenueChart = memo(({ 
  data, 
  granularity, 
  showZlicePos = true,
  loading 
}: RevenueChartProps) => {
  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURN
  const totalRevenue = useMemo(() => 
    data?.reduce((sum, d) => sum + d.revenue, 0) || 0, 
    [data]
  );

  const totalZlice = useMemo(() => 
    data?.reduce((sum, d) => sum + d.zliceRevenue, 0) || 0, 
    [data]
  );

  const totalPos = useMemo(() => 
    data?.reduce((sum, d) => sum + d.posRevenue, 0) || 0, 
    [data]
  );

  const granularityLabel = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
  }[granularity];

  // Format Y-axis values in lakhs/crores for readability
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

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Revenue Overview
            </CardTitle>
            <CardDescription className="mt-1">
              {granularityLabel} revenue breakdown
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="font-normal">
              Total: {formatCurrency(totalRevenue)}
            </Badge>
            {showZlicePos && (
              <>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                >
                  Zlice: {formatCurrency(totalZlice)}
                </Badge>
                <Badge 
                  variant="secondary"
                  className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                >
                  PoS: {formatCurrency(totalPos)}
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">
              No data available for the selected period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                className="dark:stroke-slate-700"
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                className="text-slate-600 dark:text-slate-400"
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="text-slate-600 dark:text-slate-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: 10 }}
                iconType="square"
              />
              {showZlicePos ? (
                <>
                  <Bar 
                    dataKey="zliceRevenue" 
                    name="Zlice App" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    stackId="revenue"
                  />
                  <Bar 
                    dataKey="posRevenue" 
                    name="PoS" 
                    fill="#94a3b8" 
                    radius={[4, 4, 0, 0]}
                    stackId="revenue"
                  />
                </>
              ) : (
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#3b82f6" 
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});

RevenueChart.displayName = 'RevenueChart';

export default RevenueChart;
