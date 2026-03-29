'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  CalendarIcon,
  ChevronDown,
  HelpCircle,
  Loader2,
  Package,
  RefreshCw,
  Smartphone,
  Store,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Utils
import { formatCurrency } from '@/lib/financial-utils';

// Types
import type { OrderSettlementRow, CanteenSettlementRow } from '@/types/analytics';

// Column tooltips
const COLUMN_TOOLTIPS = {
  totalAmount: { label: 'Total Amount', formula: 'total_amount' },
  gatewayAmount: { label: 'Gateway (Zlice)', formula: '1.9% × total (Zlice only)' },
  foodValue: { label: 'Food Value', formula: 'kitchen - GST - pkg' },
  deliveryAmount: { label: 'Delivery', formula: 'delivery_partner_amount' },
  packagingAmount: { label: 'Packaging', formula: 'packaging_amount' },
  gstAmount: { label: 'GST', formula: 'gst_amount_canteen' },
  extraCharges: { label: 'Charges', formula: 'SUM(charges)' },
  settlementAmount: { label: 'Settlement', formula: 'canteen_amount' },
  profit: { label: 'Profit', formula: '(0.98 × total) - kitchen - delivery' },
};

const PREDEFINED_REASONS = [
  "Refund",
  "Delivery Rider Cost",
  "Penalty",
  "Adjustment",
  "Setup Fee",
  "Other"
];

function ColumnHeader({ tooltip }: { tooltip: { label: string; formula: string } }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="flex items-center gap-1 cursor-help">
          {tooltip.label}
          <HelpCircle className="w-3 h-3 text-slate-400" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-2">
          <p className="font-mono text-xs">{tooltip.formula}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function SettlementDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const canteenId = params.canteenId as string;

  // Date filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const dateParam = searchParams.get('date'); // Legacy fallback
    
    if (fromParam) {
      return {
        from: new Date(fromParam),
        to: toParam ? new Date(toParam) : undefined
      };
    }
    
    if (dateParam) {
      return { from: new Date(dateParam), to: undefined };
    }
    
    return undefined;
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canteenName, setCanteenName] = useState('');
  const [resolvedDateFormatted, setResolvedDateFormatted] = useState('');
  const [orders, setOrders] = useState<OrderSettlementRow[]>([]);
  const [totals, setTotals] = useState<CanteenSettlementRow | null>(null);

  // Modal State
  const [isEditingCharges, setIsEditingCharges] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderSettlementRow | null>(null);
  const [editChargesAmount, setEditChargesAmount] = useState<string>('');
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmittingCharges, setIsSubmittingCharges] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!canteenId) return;

    try {
      setLoading(true);
      setError(null);

      // Build URL with date params
      const url = new URL(`/api/admin/settlements/${canteenId}/orders`, window.location.origin);
      if (dateRange?.from) {
        url.searchParams.set('from', dateRange.from.toISOString());
        if (dateRange.to) {
          url.searchParams.set('to', dateRange.to.toISOString());
        }
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error('Failed to fetch settlement details');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Invalid response');
      }

      setCanteenName(data.canteenName);
      setResolvedDateFormatted(data.resolvedDateFormatted);
      setOrders(data.orders || []);
      setTotals(data.totals || null);

      console.log(`[Settlement Details] Canteen: ${data.canteenName}, Resolved: ${data.resolvedDateFormatted}, Orders: ${data.orders?.length}`);
    } catch (err: any) {
      console.error('Error fetching settlement details:', err);
      setError(err.message);
      toast.error('Failed to load settlement details');
    } finally {
      setLoading(false);
    }
  }, [canteenId, dateRange]);

  // Fetch on mount and when date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle date selection
  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    // Don't close on selection immediately for range
  };

  // Format helpers
  const formatOrderId = (id: string) => id.slice(0, 8).toUpperCase();
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const parts = formatter.formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    const hour = parts.find(p => p.type === 'hour')?.value || '';
    const minute = parts.find(p => p.type === 'minute')?.value || '';
    const period = (parts.find(p => p.type === 'dayPeriod')?.value || '').toUpperCase();
    
    return `${day} ${month} ${year}, ${hour}:${minute} ${period}`;
  };
  
  const formatDateDisplay = (range: DateRange | undefined) => {
    if (!range?.from) return 'Today';
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return format(range.from, 'dd MMM yyyy');
    }
    return `${format(range.from, 'dd MMM')} - ${format(range.to, 'dd MMM yyyy')}`;
  };

  // Handle individual order settlement
  const handleSettleOrder = async (orderId: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => 
        o.orderId === orderId 
          ? { ...o, isSettled: true } 
          : o
      ));
      
      toast.info('Settling order...');

      const response = await fetch(`/api/admin/settlements/${canteenId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderIds: [orderId],
          force: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Settlement failed');
      }
      
      toast.success('Order settled successfully', { id: 'settle-success' });
    } catch (err: any) {
      console.error('Order settlement error:', err);
      toast.error(err.message || 'Failed to settle order');
      // Revert optimistic update
      fetchData();
    }
  };

  // Handle settling all currently visible unsettled orders
  const handleSettleAll = async () => {
    // 1. Filter out already settled orders
    const unsettledOrders = orders.filter(o => !o.isSettled);
    if (unsettledOrders.length === 0) {
      toast.info('No pending orders to settle in the current view.');
      return;
    }

    const orderIds = unsettledOrders.map(o => o.orderId);

    try {
      // Optimistic update
      setOrders(prev => prev.map(o => ({ ...o, isSettled: true })));
      
      toast.info(`Settling ${orderIds.length} orders...`);

      const response = await fetch(`/api/admin/settlements/${canteenId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderIds,
          force: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Bulk settlement failed');
      }
      
      toast.success(`Successfully settled ${orderIds.length} orders!`);
    } catch (err: any) {
      console.error('Bulk order settlement error:', err);
      toast.error(err.message || 'Failed to settle orders');
      // Revert optimistic update
      fetchData();
    }
  };

  // Handle Edit Charges flow
  const handleOpenEditCharges = (order: OrderSettlementRow) => {
    setEditingOrder(order);
    setEditChargesAmount(order.charges ? order.charges.toString() : '0');
    
    // Check if current reason is predefined
    const currentReason = order.chargeReason || '';
    if (PREDEFINED_REASONS.includes(currentReason) && currentReason !== 'Other') {
      setSelectedReason(currentReason);
      setCustomReason('');
    } else if (currentReason) {
      setSelectedReason('Other');
      setCustomReason(currentReason);
    } else {
      setSelectedReason('');
      setCustomReason('');
    }
    
    setIsEditingCharges(true);
  };

  const handleCloseEditCharges = () => {
    setIsEditingCharges(false);
    setEditingOrder(null);
    setEditChargesAmount('');
    setSelectedReason('');
    setCustomReason('');
  };

  const handleSaveCharges = async () => {
    if (!editingOrder) return;

    try {
      const chargesVal = parseFloat(editChargesAmount) || 0;
      const finalReason = selectedReason === 'Other' ? customReason : selectedReason;

      if (chargesVal < 0) {
        toast.error('Charges cannot be negative');
        return;
      }

      if (!finalReason) {
        toast.error('Please select or enter a reason');
        return;
      }

      const response = await fetch(`/api/admin/settlements/${canteenId}/orders/${editingOrder.orderId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charges: chargesVal,
          charge_reason: finalReason.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update charges');
      }

      toast.success('Charges updated successfully');
      
      // Close modal and refresh data
      handleCloseEditCharges();
      fetchData();

    } catch (error: any) {
      console.error('Error updating charges:', error);
      toast.error(error.message || 'Failed to update charges');
    } finally {
      setIsSubmittingCharges(false);
    }
  };

  // Error state
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        {/* Header & Date Controls */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Link href="/admin/canteens/settlements">
              <Button variant="ghost" size="sm" className="w-fit -ml-2 text-slate-500">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Settlements
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {loading ? 'Loading...' : canteenName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                  ID: {canteenId.slice(0, 8)}...
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Showing data for: <span className="text-blue-600 dark:text-blue-400 font-bold">{resolvedDateFormatted || '...'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 min-w-[200px] justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDateDisplay(dateRange)}
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Settlement Due (Unpaid)</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {totals?.dueAmount !== undefined 
                    ? formatCurrency(totals.dueAmount)
                    : totals 
                      ? formatCurrency(Math.max(0, totals.settlementAmount - orders.filter(o => o.isSettled).reduce((sum, o) => sum + o.settlementAmount, 0))) 
                      : formatCurrency(orders.filter(o => !o.isSettled).reduce((sum, o) => sum + o.settlementAmount, 0))}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Total Settled (Paid)</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {totals?.paidAmount !== undefined
                    ? formatCurrency(totals.paidAmount)
                    : formatCurrency(orders.filter(o => o.isSettled).reduce((sum, o) => sum + o.settlementAmount, 0))}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Unsettled Orders</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {orders.filter(o => !o.isSettled).length} <span className="text-sm font-normal text-slate-500">/ {orders.length}</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Per-Order Breakdown</CardTitle>
              <CardDescription>
                All orders for this kitchen on the resolved settlement date. Totals must match the settlement summary.
              </CardDescription>
            </div>
            
            {/* Added Settle All Button */}
            {orders.length > 0 && orders.some(o => !o.isSettled) && (
              <Button 
                onClick={handleSettleAll}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Settle {orders.filter(o => !o.isSettled).length} Orders
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading orders...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                      <TableHead className="font-semibold text-xs px-2 whitespace-nowrap">Order ID</TableHead>
                      <TableHead className="font-semibold text-xs px-2 whitespace-nowrap">Source</TableHead>
                      <TableHead className="font-semibold text-xs px-2 text-center whitespace-nowrap">Coupon</TableHead>
                      <TableHead className="text-right font-semibold text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.totalAmount} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-amber-600 text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.gatewayAmount} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.foodValue} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.deliveryAmount} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.packagingAmount} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.gstAmount} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-red-600 text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.extraCharges} />
                      </TableHead>
                      <TableHead className="font-semibold px-2 min-w-[120px] text-xs">Reason</TableHead>
                      <TableHead className="text-right font-semibold text-emerald-600 text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.settlementAmount} />
                      </TableHead>
                      <TableHead className="text-right font-semibold text-blue-600 text-xs px-2 whitespace-nowrap">
                        <ColumnHeader tooltip={COLUMN_TOOLTIPS.profit} />
                      </TableHead>
                      <TableHead className="font-semibold text-xs px-2 whitespace-nowrap">Time</TableHead>
                      <TableHead className="font-semibold text-right text-xs px-2 whitespace-nowrap">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-12 text-slate-500">
                          No orders found for this date
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {orders.map((order) => (
                          <TableRow key={order.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                            <TableCell className="font-mono text-[11px] px-2 py-2 whitespace-nowrap">
                              {formatOrderId(order.orderId)}
                            </TableCell>
                            <TableCell className="px-2 py-2 whitespace-nowrap">
                              {order.orderSource === 'zlice' ? (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 text-[10px] px-1 py-0 h-5">
                                  <Smartphone className="w-[10px] h-[10px] mr-1" />
                                  Zlice
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                  <Package className="w-[10px] h-[10px] mr-1" />
                                  PoS
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center px-2 py-2 whitespace-nowrap">
                              {/* New Coupon Column */}
                              {order.couponCode ? (
                                <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 px-1 py-0 h-5">
                                  {order.couponCode}
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-2 whitespace-nowrap">
                              {formatCurrency(order.totalAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-amber-600 text-xs px-2 py-2 whitespace-nowrap">
                              {order.gatewayAmount > 0 ? formatCurrency(order.gatewayAmount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-2 whitespace-nowrap">
                              {formatCurrency(order.foodValue)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-2 whitespace-nowrap">
                              {order.deliveryAmount > 0 ? formatCurrency(order.deliveryAmount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-2 whitespace-nowrap">
                              {order.packagingAmount > 0 ? formatCurrency(order.packagingAmount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-2 whitespace-nowrap">
                              {order.gstAmount > 0 ? formatCurrency(order.gstAmount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600 text-xs px-2 py-2 whitespace-nowrap">
                              {order.charges && order.charges > 0 ? formatCurrency(order.charges) : '-'}
                            </TableCell>
                            <TableCell className="text-[11px] text-slate-600 dark:text-slate-400 px-2 py-2 max-w-[120px] truncate" title={order.chargeReason || ''}>
                              {order.chargeReason || '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono text-emerald-600 font-semibold text-xs px-2 py-2 whitespace-nowrap">
                              {formatCurrency(order.settlementAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-blue-600 text-xs px-2 py-2 whitespace-nowrap">
                              {order.profit > 0 ? formatCurrency(order.profit) : '-'}
                            </TableCell>
                            <TableCell className="text-[11px] text-slate-500 px-2 py-2 whitespace-nowrap">
                              {formatTime(order.createdAt)}
                            </TableCell>
                            <TableCell className="text-right text-nowrap px-2 py-2">
                              {!order.isSettled ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-6 text-[10px] px-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                    onClick={() => handleOpenEditCharges(order)}
                                  >
                                    Charges
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="h-6 text-[10px] px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                    onClick={() => handleSettleOrder(order.orderId)}
                                  >
                                    Settle
                                  </Button>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 text-[10px] px-1 py-0 h-5">
                                  Settled
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Totals Row */}
                        {totals && (
                          <TableRow className="bg-slate-100 dark:bg-slate-800 font-semibold border-t-2">
                            <TableCell colSpan={3} className="px-2 py-3">
                              <span className="text-slate-900 dark:text-white text-xs">TOTALS</span>
                              <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0 h-5">
                                {orders.length} orders
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.totalRevenue)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-amber-600 text-xs px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.gatewayAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.foodValue)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.deliveryAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.packagingAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.gstAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-red-600 text-xs px-2 py-3 whitespace-nowrap">
                              {totals.totalCharges && totals.totalCharges > 0 ? formatCurrency(totals.totalCharges) : '-'}
                            </TableCell>
                            <TableCell className="px-2 py-3" /> {/* Reason Column */}
                            <TableCell className="text-right font-mono text-emerald-600 text-sm px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.settlementAmount)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-blue-600 text-sm px-2 py-3 whitespace-nowrap">
                              {formatCurrency(totals.profit)}
                            </TableCell>
                            <TableCell className="px-2 py-3" />
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* Edit Charges Modal */}
      <Dialog open={isEditingCharges} onOpenChange={(open) => !open && handleCloseEditCharges()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Extra Charges</DialogTitle>
            <DialogDescription>
              Add or modify extra charges/deductions for Order {editingOrder?.orderId ? formatOrderId(editingOrder.orderId) : ''}.
              This amount will be deducted from the final settlement amount.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="charges-amount" className="font-semibold text-red-600">
                Deduction Amount (₹)
              </Label>
              <Input
                id="charges-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={editChargesAmount}
                onChange={(e) => setEditChargesAmount(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="charges-reason" className="font-semibold text-slate-700 dark:text-slate-300">
                Reason
              </Label>
              <Select onValueChange={setSelectedReason} value={selectedReason}>
                <SelectTrigger id="charges-reason" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedReason === 'Other' || !selectedReason) && (
              <div className="grid gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label htmlFor="custom-reason" className="font-semibold text-slate-700 dark:text-slate-300">
                  {selectedReason === 'Other' ? 'Specify Reason' : 'Custom Reason'}
                </Label>
                <Textarea
                  id="custom-reason"
                  placeholder="e.g. Penalty for missing items, Customer refund adjustment"
                  className="resize-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditCharges} disabled={isSubmittingCharges}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCharges} 
              disabled={isSubmittingCharges}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmittingCharges ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Charges'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
