'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  ShoppingBag,
  Search,
  User,
  Phone,
  Calendar as CalendarIcon,
  Package,
  IndianRupee,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  quantity: number;
  canteen_price: number;
  menu_items?: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  is_gst_enabled: boolean;
  canteen_amount: number;
  users: {
    name: string;
    phone: string;
    roll_number: string;
  } | null;
  order_items: OrderItem[];
  itemsTotal: number;
  packagingFee: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
}

interface Stats {
  totalEarned: number;
  totalPaid: number;
  totalDue: number;
  totalOrders: number;
  isGstEnabled: boolean;
}

export default function OnlineEarningsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  // Refetch when date filters change
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      fetchEarnings();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = orders.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.users?.name?.toLowerCase().includes(query) ||
          order.users?.phone?.includes(query) ||
          order.users?.roll_number?.toLowerCase().includes(query)
      );
      setFilteredOrders(filtered);
    }
  }, [searchQuery, orders]);

  const fetchEarnings = async () => {
    try {
      // Build API URL with date filters if provided
      const url = new URL('/api/canteen/online-earnings', window.location.origin);

      if (startDate) {
        // Convert Indian date to UTC for API
        // Create date string in IST and convert to UTC
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

      if (!response.ok) {
        throw new Error('Failed to fetch earnings');
      }

      const data = await response.json();
      setOrders(data.orders);
      setFilteredOrders(data.orders);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch earnings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount?.toFixed(2)}`;
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

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Online Earnings
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track earnings from online orders
            {stats?.isGstEnabled && (
              <Badge variant="outline" className="ml-2">
                GST Enabled (5%)
              </Badge>
            )}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Earned</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(stats.totalEarned)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Paid</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Due</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(stats.totalDue)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Orders</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by order number, name, phone, or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchQuery ? 'No orders found' : 'No online orders yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Online orders will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleOrderClick(order)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">#{order.order_number}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(order.created_at)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(order.canteen_amount)}
                      </div>
                      {order.is_gst_enabled && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          (incl. GST)
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 ml-2" />
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    {order.users && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                          Customer Details
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                            <span className="text-slate-900 dark:text-white">
                              {order.users.name} ({order.users.roll_number})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                            <span className="text-slate-900 dark:text-white">
                              {order.users.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                        Price Breakdown
                      </h4>
                      <div className="space-y-1 text-xs">
                        {/* Individual Items */}
                        {order.order_items.map((item, index) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              {item.menu_items?.name || 'Item'} (×{item.quantity})
                            </span>
                            <span className="text-slate-900 dark:text-white font-medium">
                              {formatCurrency(item.canteen_price * item.quantity)}
                            </span>
                          </div>
                        ))}

                        {/* Packaging Fee */}
                        {order.packagingFee > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-400">
                              <Package className="w-3 h-3 inline mr-1" />
                              Packaging
                            </span>
                            <span className="text-slate-900 dark:text-white font-medium">
                              {formatCurrency(order.packagingFee)}
                            </span>
                          </div>
                        )}

                        {/* GST Section */}
                        {order.is_gst_enabled && order.gstAmount > 0 && (
                          <>
                            <div className="flex items-center justify-between border-t pt-1 mt-1">
                              <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                              <span className="text-slate-900 dark:text-white">
                                {formatCurrency(order.subtotal)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-400">
                                GST (5%)
                              </span>
                              <span className="text-slate-900 dark:text-white font-medium">
                                {formatCurrency(order.gstAmount)}
                              </span>
                            </div>
                          </>
                        )}

                        {/* Total */}
                        <div className="flex items-center justify-between border-t pt-1 mt-1 font-semibold">
                          <span className="text-slate-900 dark:text-white">Total</span>
                          <span className="text-green-600 dark:text-green-400">
                            {formatCurrency(order.canteen_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                      Items Ordered
                    </h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                              {item.menu_items?.name || 'Item'}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Qty: {item.quantity} × {formatCurrency(item.menu_items?.price || item.canteen_price / item.quantity)}
                            </p>
                          </div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white ml-2">
                            {formatCurrency(item.canteen_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-2xl">Order #{selectedOrder.order_number}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <CalendarIcon className="w-4 h-4" />
                      {formatDate(selectedOrder.created_at)}
                    </DialogDescription>
                  </div>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Customer Info */}
                {selectedOrder.users && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span className="font-medium">{selectedOrder.users.name}</span>
                          <Badge variant="outline">{selectedOrder.users.roll_number}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <span>{selectedOrder.users.phone}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900 dark:text-white">
                              {item.menu_items?.name || 'Item'}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Quantity: {item.quantity} × {formatCurrency(item.menu_items?.price || item.canteen_price / item.quantity)}
                            </p>
                          </div>
                          <p className="font-semibold text-lg text-slate-900 dark:text-white">
                            {formatCurrency(item.canteen_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Price Calculation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Price Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-600 dark:text-slate-400">
                          Items Total ({selectedOrder.order_items.length} items)
                        </span>
                        <span className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(selectedOrder.itemsTotal)}
                        </span>
                      </div>

                      {selectedOrder.packagingFee > 0 && (
                        <div className="flex items-center justify-between py-2">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Packaging Fee
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {formatCurrency(selectedOrder.packagingFee)}
                          </span>
                        </div>
                      )}

                      {selectedOrder.is_gst_enabled && selectedOrder.gstAmount > 0 && (
                        <>
                          <div className="flex items-center justify-between py-2 border-t">
                            <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                            <span className="text-slate-900 dark:text-white">
                              {formatCurrency(selectedOrder.subtotal)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-2">
                            <span className="text-slate-600 dark:text-slate-400">
                              GST (5%)
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {formatCurrency(selectedOrder.gstAmount)}
                            </span>
                          </div>
                        </>
                      )}

                      <div className="flex items-center justify-between py-3 border-t-2 border-slate-200 dark:border-slate-700">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                          Total Amount
                        </span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center">
                          <IndianRupee className="w-5 h-5 mr-1" />
                          {selectedOrder.canteen_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
