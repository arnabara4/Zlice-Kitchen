'use client';

import { memo, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Clock, Layers, LayoutList } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';
import type { HourlySalesPoint, HourlySalesByCanteen, CanteenPerformance } from '@/types/analytics';

interface HourlySalesChartProps {
  data: HourlySalesPoint[];
  dataByCanteen?: HourlySalesByCanteen[];
  canteens?: CanteenPerformance[];
  loading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// Color palette for canteen lines
const CANTEEN_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 max-w-xs">
      <p className="font-semibold text-slate-900 dark:text-white mb-2">{label}</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {payload
          .filter((entry: any) => entry.value > 0)
          .sort((a: any, b: any) => b.value - a.value)
          .map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="border shadow-sm animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-6 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-4 w-60 bg-slate-200 dark:bg-slate-700 rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </CardContent>
    </Card>
  );
}

export const HourlySalesChart = memo(({ 
  data,
  dataByCanteen,
  canteens,
  loading 
}: HourlySalesChartProps) => {
  const [viewMode, setViewMode] = useState<'combined' | 'canteen'>('combined');

  // Calculate peak hour and total revenue - MUST be before any conditional return
  const stats = useMemo(() => {
    if (!data?.length) return { peakHour: { hour: 0, hourLabel: '00:00', revenue: 0, orders: 0 }, totalRevenue: 0, totalOrders: 0 };
    const peakHour = data.reduce((max, d) => 
      d.revenue > max.revenue ? d : max, 
      { hour: 0, hourLabel: '00:00', revenue: 0, orders: 0 }
    );
    const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
    return { peakHour, totalRevenue, totalOrders };
  }, [data]);

  // Get unique canteen IDs from dataByCanteen - MUST be before any conditional return
  const canteenIds = useMemo(() => {
    if (!dataByCanteen?.length) return [];
    const ids = new Set<string>();
    dataByCanteen.forEach(d => {
      Object.keys(d).forEach(key => {
        if (key !== 'hour' && key !== 'hourLabel') {
          ids.add(key);
        }
      });
    });
    return Array.from(ids);
  }, [dataByCanteen]);

  const hasCanteenData = canteenIds.length > 0 && dataByCanteen && dataByCanteen.length > 0;

  // Loading state AFTER all hooks
  if (loading) {
    return <ChartSkeleton />;
  }

  // Format Y-axis
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(0)}K`;
    }
    return `₹${value}`;
  };

  // Get canteen name by ID
  const getCanteenName = (id: string) => {
    return canteens?.find(c => c.id === id)?.name || id.substring(0, 8);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Hourly Sales Performance
            </CardTitle>
            <CardDescription className="mt-1">
              Sales distribution across 24 hours
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {stats.peakHour.revenue > 0 && (
              <Badge variant="outline" className="font-normal">
                Peak: {stats.peakHour.hourLabel} ({formatCurrency(stats.peakHour.revenue)})
              </Badge>
            )}
            {hasCanteenData && (
              <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Button
                  variant={viewMode === 'combined' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8"
                  onClick={() => setViewMode('combined')}
                >
                  <Layers className="w-4 h-4 mr-1" />
                  Combined
                </Button>
                <Button
                  variant={viewMode === 'canteen' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8"
                  onClick={() => setViewMode('canteen')}
                >
                  <LayoutList className="w-4 h-4 mr-1" />
                  By Canteen
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.every(d => d.revenue === 0) ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400">
              No sales data for the selected period
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {viewMode === 'combined' || !hasCanteenData ? (
              <LineChart
                data={data}
                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  className="dark:stroke-slate-700"
                />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={2}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                  iconType="circle"
                />
                <Line 
                  type="monotone"
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <LineChart
                data={dataByCanteen}
                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  className="dark:stroke-slate-700"
                />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  interval={2}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 10 }}
                  iconType="circle"
                />
                {canteenIds.map((canteenId, index) => (
                  <Line 
                    key={canteenId}
                    type="monotone"
                    dataKey={canteenId} 
                    name={getCanteenName(canteenId)} 
                    stroke={CANTEEN_COLORS[index % CANTEEN_COLORS.length]} 
                    strokeWidth={2}
                    dot={{ fill: CANTEEN_COLORS[index % CANTEEN_COLORS.length], r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
});

HourlySalesChart.displayName = 'HourlySalesChart';

export default HourlySalesChart;
