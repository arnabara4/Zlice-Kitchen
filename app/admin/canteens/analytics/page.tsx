'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Store,
  RefreshCw,
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { KPICards } from '@/components/admin/analytics/kpi-cards';
import { SettlementBreakdownCard } from '@/components/admin/analytics/settlement-breakdown-card';
import { SettlementBarChart } from '@/components/admin/analytics/settlement-bar-chart';
import { HourlySalesChart } from '@/components/admin/analytics/hourly-sales-chart';
import { AnalyticsFiltersComponent } from '@/components/admin/analytics/analytics-filters';

// Utilities
import { formatCurrency } from '@/lib/financial-utils';

import type { 
  AnalyticsFilters,
  AnalyticsAPIResponse,
  CanteenOption,
  KPIStats,
  SettlementBreakdown,
  SettlementTimeSeriesPoint,
  HourlySalesPoint,
  HourlySalesByCanteen,
  CanteenPerformance
} from '@/types/analytics';

// Default filter state
const defaultFilters: AnalyticsFilters = {
  startDate: null,
  endDate: null,
  datePreset: '7d',
  orderSource: 'all',
  canteenIds: [],
  granularity: 'day',
};

// Default empty states
const defaultKPIStats: KPIStats = {
  totalRevenue: 0,
  totalProfit: 0,
  totalCanteens: 0,
  activeCanteens: 0,
  totalOrders: 0,
  zliceOrders: 0,
  posOrders: 0,
  averageOrderValue: 0,
};

const defaultSettlement: SettlementBreakdown = {
  totalRevenue: 0,
  zliceCommission: 0,
  netAfterGateway: 0,
  canteenSettlement: 0,
  deliveryPartnerAmount: 0,
  platformProfit: 0,
  gstTotal: 0,
  gstCanteen: 0,
  gstRetained: 0,
  zliceOrderCount: 0,
  posOrderCount: 0,
};

export default function CanteenAnalyticsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);
  const [canteens, setCanteens] = useState<CanteenOption[]>([]);
  
  // Analytics data
  const [kpiStats, setKpiStats] = useState<KPIStats>(defaultKPIStats);
  const [settlement, setSettlement] = useState<SettlementBreakdown>(defaultSettlement);
  const [settlementTimeSeries, setSettlementTimeSeries] = useState<SettlementTimeSeriesPoint[]>([]);
  const [hourlySales, setHourlySales] = useState<HourlySalesPoint[]>([]);
  const [hourlySalesByCanteen, setHourlySalesByCanteen] = useState<HourlySalesByCanteen[]>([]);
  const [canteenPerformance, setCanteenPerformance] = useState<CanteenPerformance[]>([]);

  // Fetch canteens on mount
  useEffect(() => {
    fetchCanteens();
  }, []);

  // Fetch analytics when filters change
  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchCanteens = async () => {
    try {
      const response = await fetch('/api/canteens');
      if (response.ok) {
        const data = await response.json();
        setCanteens((data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          isActive: true,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch canteens:', err);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams();
      params.set('datePreset', filters.datePreset);
      
      if (filters.startDate) {
        params.set('startDate', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        params.set('endDate', filters.endDate.toISOString());
      }
      
      params.set('orderSource', filters.orderSource);
      params.set('granularity', filters.granularity);
      
      if (filters.canteenIds.length > 0) {
        params.set('canteenIds', filters.canteenIds.join(','));
      } else {
        params.set('canteenIds', 'all');
      }

      const response = await fetch(`/api/admin/canteens/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data: AnalyticsAPIResponse = await response.json();

      if (!data.success) {
        throw new Error('Invalid response');
      }

      // Update state
      setKpiStats(data.kpiStats);
      setSettlement(data.settlementBreakdown);
      setSettlementTimeSeries(data.settlementTimeSeries || []);
      setHourlySales(data.hourlySales);
      setHourlySalesByCanteen(data.hourlySalesByCanteen);
      setCanteenPerformance(data.canteenPerformance);

    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.message || 'Failed to load analytics');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleRefresh = () => {
    fetchAnalytics();
    toast.success('Refreshing data...');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Canteen Analytics
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Platform-wide financial insights and performance metrics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <AnalyticsFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          canteens={canteens}
          loading={loading}
        />

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="font-medium text-red-700 dark:text-red-300">{error}</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Please try again or contact support if the issue persists.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        )}

        {/* KPI Cards */}
        <KPICards stats={kpiStats} loading={loading} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Settlement Breakdown */}
          <SettlementBreakdownCard 
            breakdown={settlement} 
            loading={loading} 
          />

          {/* Settlement Bar Chart */}
          <SettlementBarChart
            data={settlementTimeSeries}
            granularity={filters.granularity}
            loading={loading}
          />
        </div>

        {/* Hourly Sales Chart - Full Width */}
        <div className="mb-6">
          <HourlySalesChart
            data={hourlySales}
            dataByCanteen={hourlySalesByCanteen}
            canteens={canteenPerformance}
            loading={loading}
          />
        </div>

        {/* Canteen Performance Table */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Canteen Performance
                </CardTitle>
                <CardDescription>
                  Revenue and order breakdown by canteen
                </CardDescription>
              </div>
              <Badge variant="outline">
                {canteenPerformance.length} canteens
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                ))}
              </div>
            ) : canteenPerformance.length === 0 ? (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No canteen data available for the selected period
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Canteen
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Orders
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Revenue
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Profit
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Avg Order
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {canteenPerformance.map((canteen) => (
                      <tr 
                        key={canteen.id} 
                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <span className="font-medium text-slate-900 dark:text-white">
                                {canteen.name}
                              </span>
                              <p className="text-xs text-slate-500">
                                Zlice: {canteen.zliceOrderCount} | PoS: {canteen.posOrderCount}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-medium">
                          {canteen.orderCount}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(canteen.totalRevenue)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(canteen.totalProfit)}
                        </td>
                        <td className="py-4 px-4 text-right text-slate-600 dark:text-slate-400">
                          {formatCurrency(canteen.avgOrderValue)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge 
                            variant="secondary"
                            className={canteen.revenueShare > 30 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : canteen.revenueShare > 15 
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }
                          >
                            {canteen.revenueShare.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
