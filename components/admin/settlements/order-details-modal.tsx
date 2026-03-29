'use client';

import { useState, useEffect, memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Package, Smartphone, Store } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-utils';
import type { OrderSettlementRow, CanteenSettlementRow } from '@/types/analytics';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canteenId: string | null;
  canteenName: string;
  /** User's selected date - passed to API for T-2 resolution */
  selectedDate?: Date;
}

export const OrderDetailsModal = memo(({
  open,
  onOpenChange,
  canteenId,
  canteenName,
  selectedDate,
}: OrderDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderSettlementRow[]>([]);
  const [totals, setTotals] = useState<CanteenSettlementRow | null>(null);
  const [resolvedDateFormatted, setResolvedDateFormatted] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Re-fetch when modal opens, canteen changes, or date changes
  useEffect(() => {
    if (open && canteenId) {
      fetchOrderDetails();
    }
  }, [open, canteenId, selectedDate]);

  const fetchOrderDetails = async () => {
    if (!canteenId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Build URL with selected date for T-2 resolution
      const url = new URL(`/api/admin/settlements/${canteenId}/orders`, window.location.origin);
      if (selectedDate) {
        url.searchParams.set('date', selectedDate.toISOString());
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load data');
      }

      setOrders(data.orders || []);
      setTotals(data.totals || null);
      setResolvedDateFormatted(data.resolvedDateFormatted || '');
      
      console.log('[Order Details Modal] Resolved:', data.resolvedDateFormatted, 'Orders:', data.orders?.length);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatOrderId = (id: string) => {
    return id.slice(0, 8).toUpperCase();
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            {canteenName} - Order Details
          </DialogTitle>
          <DialogDescription>
            Showing data for: <strong>{resolvedDateFormatted || 'Loading...'}</strong> (T-2 Working Day)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Loading order details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-600">
              {error}
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-slate-950 z-10">
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Source</TableHead>
                  <TableHead className="text-right font-semibold">Total</TableHead>
                  <TableHead className="text-right font-semibold text-amber-600">Gateway</TableHead>
                  <TableHead className="text-right font-semibold">Food</TableHead>
                  <TableHead className="text-right font-semibold">Delivery</TableHead>
                  <TableHead className="text-right font-semibold">Pkg</TableHead>
                  <TableHead className="text-right font-semibold">GST</TableHead>
                  <TableHead className="text-right font-semibold text-emerald-600">Settlement</TableHead>
                  <TableHead className="text-right font-semibold text-blue-600">Profit</TableHead>
                  <TableHead className="font-semibold">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {orders.map((order) => (
                      <TableRow key={order.orderId} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                        <TableCell className="font-mono text-sm">
                          {formatOrderId(order.orderId)}
                        </TableCell>
                        <TableCell>
                          {order.orderSource === 'zlice' ? (
                            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                              <Smartphone className="w-3 h-3 mr-1" />
                              Zlice
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Package className="w-3 h-3 mr-1" />
                              PoS
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-amber-600">
                          {order.gatewayAmount > 0 ? formatCurrency(order.gatewayAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(order.foodValue)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {order.deliveryAmount > 0 ? formatCurrency(order.deliveryAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {order.packagingAmount > 0 ? formatCurrency(order.packagingAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {order.gstAmount > 0 ? formatCurrency(order.gstAmount) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600 font-semibold">
                          {formatCurrency(order.settlementAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          {order.profit > 0 ? formatCurrency(order.profit) : '-'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatTime(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Totals Row */}
                    {totals && (
                      <TableRow className="bg-slate-100 dark:bg-slate-800 font-semibold border-t-2">
                        <TableCell colSpan={2}>
                          <span className="text-slate-900 dark:text-white">TOTALS</span>
                          <Badge variant="outline" className="ml-2">
                            {orders.length} orders
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.totalRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-amber-600">
                          {formatCurrency(totals.gatewayAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.foodValue)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.deliveryAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.packagingAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.gstAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-emerald-600 text-lg">
                          {formatCurrency(totals.settlementAmount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600 text-lg">
                          {formatCurrency(totals.profit)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

OrderDetailsModal.displayName = 'OrderDetailsModal';

export default OrderDetailsModal;
