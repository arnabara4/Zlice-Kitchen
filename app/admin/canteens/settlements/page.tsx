'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  AlertCircle,
  Wallet,
  TrendingUp,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

// Components
import { SettlementHeader } from '@/components/admin/settlements/settlement-header';
import { CanteenSettlementTable } from '@/components/admin/settlements/canteen-settlement-table';

// Utils
import { formatCurrency } from '@/lib/financial-utils';

// Types
import type { 
  SettlementsAPIResponse, 
  CanteenSettlementRow 
} from '@/types/analytics';

// Default empty state
const defaultTotals = {
  totalRevenue: 0,
  gatewayAmount: 0,
  foodValue: 0,
  deliveryAmount: 0,
  packagingAmount: 0,
  gstAmount: 0,
  totalCharges: 0,
  settlementAmount: 0,
  profit: 0,
  orderCount: 0,
};

export default function SettlementsPage() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Settlement data from API
  const [selectedDateFormatted, setSelectedDateFormatted] = useState('All Time');
  const [canteens, setCanteens] = useState<CanteenSettlementRow[]>([]);
  const [totals, setTotals] = useState(defaultTotals);

  // Modal state - REMOVED, using navigation now
  // const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  // const [selectedCanteenId, setSelectedCanteenId] = useState<string | null>(null);
  // const [selectedCanteenName, setSelectedCanteenName] = useState('');
  const router = useRouter();

  // Settle confirmation state
  const [settleDialogOpen, setSettleDialogOpen] = useState(false);
  const [settleCanteenId, setSettleCanteenId] = useState<string | null>(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settling, setSettling] = useState(false);

  // Date filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Fetch settlements on mount and when date range changes
  useEffect(() => {
    fetchSettlements(dateRange);
  }, [dateRange]);

  const fetchSettlements = useCallback(async (range?: DateRange) => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with optional date range parameters
      const url = new URL('/api/admin/settlements', window.location.origin);
      if (range?.from) {
        url.searchParams.set('from', range.from.toISOString());
        if (range.to) {
          url.searchParams.set('to', range.to.toISOString());
        }
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch settlements');
      }

      const data: SettlementsAPIResponse = await response.json();

      if (!data.success) {
        throw new Error('Invalid response');
      }

      // Use dates from API
      setSelectedDateFormatted(data.selectedDateFormatted);
      setCanteens(data.canteens);
      setTotals(data.totals);
      
      console.log('[Settlements Page] Selected:', data.selectedDate);

    } catch (err: any) {
      console.error('Error fetching settlements:', err);
      setError(err.message);
      toast.error('Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle view details - Navigate to slug page
  const handleViewDetails = (canteenId: string, _canteenName: string) => {
    // Build URL with date context
    const url = new URL(`/admin/canteens/settlements/${canteenId}`, window.location.origin);
    
    if (dateRange?.from) {
      url.searchParams.set('from', dateRange.from.toISOString());
      if (dateRange.to) {
        url.searchParams.set('to', dateRange.to.toISOString());
      }
    }
    
    router.push(url.pathname + url.search);
  };

  // Handle settle button click
  const handleSettleClick = (canteenId: string, amount: number) => {
    setSettleCanteenId(canteenId);
    setSettleAmount(amount);
    setSettleDialogOpen(true);
  };

  // Handle confirm settle
  const handleConfirmSettle = async () => {
    if (!settleCanteenId) return;
    
    try {
      setSettling(true);
      
      const response = await fetch(`/api/admin/settlements/${settleCanteenId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          expectedAmount: settleAmount,
          force: true 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Settlement failed');
      }
      
      toast.success(data.message || `Settlement recorded for ${formatCurrency(settleAmount)}`);
      
      // Update local state to mark as settled
      setCanteens(prev => prev.map(c => 
        c.canteenId === settleCanteenId 
          ? { ...c, status: 'settled' as const, settlementAmount: 0 } // Amount resets to 0 as it's paid
          : c
      ));

      // Refresh data to be safe
      setTimeout(() => fetchSettlements(dateRange), 500);
      
      setSettleDialogOpen(false);
    } catch (err: any) {
      console.error('Settlement error:', err);
      toast.error(err.message || 'Failed to process settlement');
    } finally {
      setSettling(false);
    }
  };

  // Find canteen name for settle dialog
  const settleCanteenName = canteens.find(c => c.canteenId === settleCanteenId)?.canteenName || '';

  // Show error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load Settlements</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={() => fetchSettlements(dateRange)}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Date Filter */}
        <SettlementHeader
          selectedDateFormatted={selectedDateFormatted}
          loading={loading}
          onRefresh={() => fetchSettlements(dateRange)}
          onDateRangeChange={(range) => setDateRange(range)}
          dateRange={dateRange}
          canteens={canteens.map(c => ({ id: c.canteenId, name: c.canteenName }))}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(totals.totalRevenue)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Total Payable
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(totals.settlementAmount)}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-200 dark:border-violet-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    Platform Profit
                  </p>
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {formatCurrency(totals.profit)}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Orders
                  </p>
                  <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {totals.orderCount}
                  </p>
                </div>
                <Package className="w-8 h-8 text-slate-600 dark:text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Settlement Table */}
        <CanteenSettlementTable
          canteens={canteens}
          totals={totals}
          loading={loading}
          onViewDetails={handleViewDetails}
          onSettle={handleSettleClick}
        />

        {/* View Details now navigates to /admin/canteens/settlements/[canteenId] */}

        {/* Settle Confirmation Dialog */}
        <AlertDialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Settlement</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to settle <strong>{formatCurrency(settleAmount)}</strong> for{' '}
                <strong>{settleCanteenName}</strong>.
                <br /><br />
                This action will:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Lock this settlement record</li>
                  <li>Mark the canteen as settled for this date</li>
                  <li>Generate a settlement reference ID</li>
                </ul>
                <br />
                <strong>This action cannot be undone.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={settling}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmSettle}
                disabled={settling}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {settling ? 'Processing...' : 'Confirm Settlement'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
