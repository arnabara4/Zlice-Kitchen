'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertCircle, Package, Phone, MapPin, Clock, IndianRupee, CheckCircle, Truck, Box, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DeliveryHistorySkeleton } from '@/components/page-skeletons';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  menu_items: {
    id: string;
    name: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  delivery_fee: number;
  order_type: string;
  delivery_status: string | null;
  created_at: string;
  canteen_id: string;
  canteens: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
  order_items: OrderItem[];
}

interface DeliveryStats {
  totalEarned: number;
  totalPaid: number;
  pendingPayment: number;
  totalDeliveries: number;
}

export default function MyDeliveriesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const POLLING_INTERVAL = 30000; // 30 seconds

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  useEffect(() => {
    fetchOrders();

    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchOrders();
    }, POLLING_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);   
  }, []);

  // Refetch when date filters change
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      fetchOrders();
    }
  }, [startDate, endDate]);

  const fetchOrders = async () => {
    try {
      // Build API URL with date filters if provided
      const url = new URL('/api/orders/me/delivered', window.location.origin);
      
      if (startDate) {
        // Convert Indian date to UTC for API
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const istStartStr = `${year}-${month}-${day}T00:00:00.000+05:30`;
        const startDateUTC = new Date(istStartStr);
        url.searchParams.set('startDate', startDateUTC.toISOString());
      }
      
      if (endDate) {
        // Convert Indian date to UTC for API (end of day)
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const istEndStr = `${year}-${month}-${day}T23:59:59.999+05:30`;
        const endDateUTC = new Date(istEndStr);
        url.searchParams.set('endDate', endDateUTC.toISOString());
      }

      const response = await fetch(url.toString());
      
      if (response.status === 401) {
        router.push('/delivery/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cooking':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'completed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const getDeliveryStatusColor = (status: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'picked_up':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'in_transit':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400';
    }
  };

  const getPaymentColor = (status: string) => {
    return status === 'paid'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeliveryStatusIcon = (status: string | null) => {
    if (!status) return <Package className="w-4 h-4" />;
    
    switch (status) {
      case 'assigned':
        return <CheckCircle className="w-4 h-4" />;
      case 'picked_up':
        return <Box className="w-4 h-4" />;
      case 'in_transit':
        return <Truck className="w-4 h-4" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <DeliveryHistorySkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 xl:pb-6">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header with Stats */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Deliveries</h1>
          <p className="text-slate-600 dark:text-slate-400">All completed delivery orders</p>
          
          {/* Stats Card */}
          {orders.length > 0 && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalDeliveries}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Deliveries</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{stats.totalEarned.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Earned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{stats.totalPaid.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Paid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ₹{stats.pendingPayment.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Pending Payment</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Date Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {/* Start Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {startDate ? format(startDate, "dd MMM yyyy") : "Start Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                }}
                disabled={(date) => date > getIndianDate()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs"
              >
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {endDate ? format(endDate, "dd MMM yyyy") : "End Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => {
                  setEndDate(date);
                }}
                disabled={(date) => {
                  if (date > getIndianDate()) return true;
                  if (startDate && date < startDate) return true;
                  return false;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters Button */}
          {(startDate || endDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-xs"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No deliveries yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Your completed deliveries will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                        {order.delivery_status && (
                          <Badge className={getDeliveryStatusColor(order.delivery_status)}>
                            {order.delivery_status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xl font-bold text-green-600 dark:text-green-400">
                        <IndianRupee className="w-4 h-4" />
                        {order.delivery_fee || 0}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Delivery Fee</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Canteen Info */}
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                      {order.canteens.name}
                    </h4>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3 h-3" />
                        <span>{order.canteens.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span className="line-clamp-1">{order.canteens.address || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div>
                    {/* Mobile View - Condensed */}
                    <div className="block lg:hidden">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsSheetOpen(true);
                        }}
                        className="w-full text-left p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">
                              {order.order_items[0]?.menu_items.name}
                              {order.order_items.length > 1 && (
                                <span className="text-blue-600 dark:text-blue-400 ml-2">
                                  +{order.order_items.length - 1} more
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>
                    </div>

                    {/* Desktop View - Full List */}
                    <div className="hidden lg:block">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white mb-2">
                        Items ({order.order_items.length})
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                                {item.menu_items.name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white ml-2">
                              ₹{item.price}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sheet for Order Items - Mobile Only */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] flex flex-col">
          {selectedOrder && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle>Order #{selectedOrder.order_number}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(selectedOrder.created_at)}
                    </SheetDescription>
                  </div>
                  {selectedOrder.delivery_status && (
                    <Badge className={getDeliveryStatusColor(selectedOrder.delivery_status)}>
                      {selectedOrder.delivery_status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* Canteen Info */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                    {selectedOrder.canteens.name}
                  </h4>
                  <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{selectedOrder.canteens.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedOrder.canteens.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
                    Order Items
                  </h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {item.menu_items.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold text-lg text-slate-900 dark:text-white">
                          ₹{item.price}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-slate-900 dark:text-white">Total Amount</span>
                  <span className="flex items-center text-green-600 dark:text-green-400">
                    <IndianRupee className="w-5 h-5 mr-1" />
                    {selectedOrder.total_amount}
                  </span>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
