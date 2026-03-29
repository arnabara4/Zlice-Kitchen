"use client"

import React, { useEffect, useState, useMemo } from "react";
import { useCanteen } from "@/lib/canteen-context";
import { printReceipt as printReceiptPWA } from "@/lib/printer/pwa-printer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Search,
  Download,
  ArrowUpDown,
  TrendingUp,
  Receipt,
  Clock,
  ChefHat,
  Check,
  Filter,
  RefreshCw,
  DollarSign,
  Ban,
  Printer,
  X,
  Bike,
  ShoppingBag,
  Utensils,
  Package,
  CloudOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionsSkeleton } from "@/components/page-skeletons";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WithdrawalHistory } from "@/components/dashboard/settlement/withdrawal-history";

interface OrderTransaction {
  id: string;
  order_number: string;
  serial_number?: number;
  status: 'not_started' | 'cooking' | 'ready' | 'completed';
  payment_status?: 'paid' | 'pending';
  total_amount: number;
  canteen_amount: number;
  is_gst_enabled: boolean;
  packaging_fee?: number;
  delivery_fee?: number;
  order_type?: 'dine-in' | 'takeaway' | 'delivery';
  delivery_man_id?: string | null;
  delivery_status?: string | null;
  created_at: string;
  user_id?: string | null;
  users?: {
    id: string;
    phone: string;
    name?: string;
    roll_number?: string;
  } | null;
  user_addresses?: {
    address: string;
    phone?: string;
  } | null;
  delivery_man?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  order_items?: Array<{
    menu_item_id: string;
    quantity: number;
    price: number;
    canteen_price: number;
    menu_items?: { name: string };
  }>;
}

interface DateStats {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  averageOrderValue: number;
}

export default function TransactionsPage() {
  const { selectedCanteen } = useCanteen();
  const [orders, setOrders] = useState<OrderTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Get Indian timezone date to fix date display issue
  const getIndianDate = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  };

  const [selectedDate, setSelectedDate] = useState<string>(getIndianDate());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'created_at' | 'total_amount' | 'order_number'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal state for viewing all items
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderTransaction | null>(null);

  async function fetchOrders(date: string) {
    if (!selectedCanteen) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch from Network
    try {
      const res = await fetch(`/api/transactions?canteenId=${selectedCanteen.id}&date=${date}`);
      
      if (!res.ok) {
        console.error("Error fetching orders:", res.statusText);
        if (orders.length === 0) setOrders([]);
        return;
      }

      const transformedData = await res.json();

      console.log("Transformed Data: ", transformedData);

      // Update State
      setOrders(transformedData as OrderTransaction[]);

    } catch (err) {
      console.error("Error fetching orders:", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function updatePaymentStatus(orderId: string, newPaymentStatus: 'paid' | 'pending') {
    try {
      const res = await fetch('/api/orders/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: newPaymentStatus })
      });

      if (!res.ok) throw new Error('Failed to update payment status');
      await fetchOrders(selectedDate);
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    }
  }

  async function generateReceipt(order: OrderTransaction) {
    const itemsToPrint = order.order_items || [];

    // Calculate items subtotal using customer price
    const itemsSubtotal = itemsToPrint.reduce((sum, it) => sum + (it.price * it.quantity), 0);

    // Get packaging fee
    const packagingFee = order.packaging_fee || 0;

    // Get delivery fee (only for delivery orders)
    const deliveryFee = (order.order_type === 'delivery' && order.delivery_fee) ? order.delivery_fee : 0;

    // Calculate GST as 5% of items subtotal
    const gstAmount = order.is_gst_enabled ? itemsSubtotal * 0.05 : 0;

    // Total = items + GST + packaging + delivery
    const totalForOrder = itemsSubtotal + gstAmount + packagingFee + deliveryFee;
    
    // Determine customer phone (delivery phone preferred, else profile phone)
    const customerPhone = order.users?.phone || undefined;
    
    // Determine customer address
    const customerAddress = order.user_addresses?.address || undefined;

    // Use PWA printer with Bluetooth fallback
    await printReceiptPWA({
      canteenName: selectedCanteen?.name,
      address: selectedCanteen?.address || undefined,
      phone: selectedCanteen?.phone || undefined,
      orderNumber: order.order_number,
      serialNumber: order.serial_number,
      createdAt: order.created_at,
      items: itemsToPrint.map((it: any) => ({
        name: it.menu_items?.name || 'Unknown',
        quantity: it.quantity,
        price: it.price
      })),
      subtotal: itemsSubtotal,
      gst: gstAmount > 0 ? gstAmount : undefined,
      packagingFee: packagingFee > 0 ? packagingFee : undefined,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      total: totalForOrder,
      customerName: order.users?.name || undefined,
      customerPhone: customerPhone,
      customerRoll: order.users?.roll_number || undefined,
      customerAddress: customerAddress,
      orderType: order.order_type,
      paymentMethod: order.payment_status,
      paymentStatus: order.payment_status
    });
  }

  useEffect(() => {
    fetchOrders(selectedDate);
    
    // Simple offline detection
    const updateOnlineStatus = () => {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            if (!navigator.onLine) {
                indicator.classList.remove('hidden');
            } else {
                indicator.classList.add('hidden');
            }
        }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Initial check

    return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [selectedDate, selectedCanteen]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let filtered = orders.filter((order) => {
      const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });

    const sorted = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any;

      if (sortField === 'created_at') {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortField === 'total_amount') {
        aVal = Number(a.total_amount);
        bVal = Number(b.total_amount);
      } else {
        aVal = a.order_number.toLowerCase();
        bVal = b.order_number.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return sorted;
  }, [orders, searchTerm, statusFilter, paymentFilter, sortField, sortDirection]);

  const stats: DateStats = useMemo(() => {
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.canteen_amount), 0),
      completedOrders: orders.filter(o => o.status === 'completed').length,
      averageOrderValue: orders.length > 0
        ? orders.reduce((sum, order) => sum + Number(order.canteen_amount), 0) / orders.length
        : 0,
    };
  }, [orders]);

  const exportToCSV = () => {
    const headers = ['Order Number', 'Status', 'Amount', 'Items', 'Time'];
    const rows = filteredAndSorted.map(order => [
      order.order_number,
      order.status,
      order.canteen_amount.toFixed(2),
      (order.order_items || []).map(item =>
        `${item.menu_items?.name || 'Unknown'} x${item.quantity}`
      ).join('; '),
      new Date(order.created_at).toLocaleString('en-IN')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${selectedDate}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-0 text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Waiting
          </Badge>
        );
      case 'cooking':
        return (
          <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-0 text-xs">
            <ChefHat className="h-3 w-3 mr-1" />
            Cooking
          </Badge>
        );
      case 'ready':
        return (
          <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Ready
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-0 text-xs">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus?: string) => {
    if (paymentStatus === 'paid') {
      return (
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-0 text-xs">
          <DollarSign className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    } else if (paymentStatus === 'pending') {
      return (
        <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-0 text-xs">
          <Ban className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
    return <Badge variant="secondary" className="text-xs">-</Badge>;
  };

  const isToday = selectedDate === getIndianDate();

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <TransactionsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#0a0f1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-red-600 dark:text-red-500 mb-2">
                  Order Transactions
                </h1>
                <div id="offline-indicator" className="hidden">
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400">
                        <CloudOff className="w-3 h-3 mr-1" />
                        Offline Mode
                    </Badge>
                </div>
              </div>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                View and analyze daily order history and revenue
              </p>
            </div>
            <Link href="/">
              <Button variant="outline" className="gap-2 dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/50">
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Date Selector & Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
            <div className="relative flex-1 max-w-xs">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 pl-10 dark:bg-[#1e293b] dark:border-slate-700/50 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedDate(getIndianDate())}
                variant={isToday ? "default" : "outline"}
                className={isToday ? "bg-red-600 hover:bg-red-700 text-white" : ""}
                size="sm"
              >
                Today
              </Button>
              <Button
                onClick={() => fetchOrders(selectedDate)}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="sm"
                disabled={filteredAndSorted.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="bg-[#1e1b2e] border border-white/5 h-10 p-1 mb-6">
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-colors px-6"
            >
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="withdrawals"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400 hover:text-slate-200 transition-colors px-6"
            >
              Withdrawals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-0">

        {/* Stats Overview */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-6">
          <Card className="border-l-4 border-l-red-500 dark:bg-[#1e293b] dark:border-slate-800/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Orders</p>
                  <h3 className="text-2xl font-bold mt-0.5 text-slate-900 dark:text-white">{stats.totalOrders}</h3>
                </div>
                <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 dark:bg-[#1e293b] dark:border-slate-800/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
                  <h3 className="text-2xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-500">
                    ₹{stats.totalRevenue.toFixed(2)}
                  </h3>
                </div>
                <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500 dark:bg-[#1e293b] dark:border-slate-800/50">
            <CardContent className="pt-4 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Completed</p>
                <h3 className="text-2xl font-bold mt-0.5 text-blue-600 dark:text-blue-500">{stats.completedOrders}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 dark:bg-[#1e293b] dark:border-slate-800/50">
            <CardContent className="pt-4 pb-4">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg. Order Value</p>
                <h3 className="text-2xl font-bold mt-0.5 text-purple-600 dark:text-purple-500">
                  ₹{stats.averageOrderValue.toFixed(2)}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order number..."
              className="pl-10 h-9 dark:bg-[#1e293b] dark:border-slate-700/50"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[180px] dark:bg-[#1e293b] dark:border-slate-700/50 dark:text-white">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-[#1e293b] dark:border-slate-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Waiting</SelectItem>
              <SelectItem value="cooking">Cooking</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="h-9 w-full sm:w-[180px] dark:bg-[#1e293b] dark:border-slate-700/50 dark:text-white">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by payment" />
              </div>
            </SelectTrigger>
            <SelectContent className="dark:bg-[#1e293b] dark:border-slate-700">
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card className="dark:bg-transparent dark:border-slate-800/50 border-0">
          <CardContent className="p-0">
            {filteredAndSorted.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1 text-slate-900 dark:text-white">No orders found</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {orders.length === 0
                    ? `No orders were placed on ${new Date(selectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : 'Try adjusting your search or filters'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('order_number')}
                          className="h-7 flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 -ml-3 text-xs font-semibold"
                        >
                          Order #
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </TableHead>
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Type</TableHead>
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Payment</TableHead>
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Items</TableHead>
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">Delivery</TableHead>
                      <TableHead className="h-9 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">Receipt</TableHead>
                      <TableHead className="h-9 text-right text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('total_amount')}
                          className="h-7 flex items-center gap-1 ml-auto hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold"
                        >
                          Amount
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </TableHead>
                      <TableHead className="h-9 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('created_at')}
                          className="h-7 flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 -ml-3 text-xs font-semibold"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          Time
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSorted.map((order) => (
                      <TableRow
                        key={order.id}
                        className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${order.user_id
                          ? 'bg-purple-50/50 dark:bg-purple-900/10 hover:bg-purple-100/50 dark:hover:bg-purple-900/20'
                          : ''
                          }`}
                      >
                        <TableCell className="py-3">
                          <div>
                            <span className="font-mono font-semibold text-sm text-slate-900 dark:text-white">
                              #{order.order_number}
                            </span>
                            {order.user_id && order.users && (
                              <div className="mt-0.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700">
                                  👤{order.users.name || order.users.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {order.order_type === 'delivery' ? (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
                              <Bike className="h-3 w-3 mr-1" />
                              Delivery
                            </Badge>
                          ) : order.order_type === 'takeaway' ? (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                              <ShoppingBag className="h-3 w-3 mr-1" />
                              Takeaway
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 text-xs">
                              <Utensils className="h-3 w-3 mr-1" />
                              Dine-in
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            onClick={() => updatePaymentStatus(order.id, order.payment_status === 'paid' ? 'pending' : 'paid')}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                          >
                            {getPaymentBadge(order.payment_status)}
                          </Button>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                            {(order.order_items || []).slice(0, 2).map((item, idx) => (
                              <div key={idx} className="truncate">
                                {item.menu_items?.name || 'Unknown'} ×{item.quantity}
                              </div>
                            ))}
                            {(order.order_items || []).length > 2 && (
                              <button
                                onClick={() => {
                                  setSelectedOrderItems(order);
                                  setItemsModalOpen(true);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                +{(order.order_items || []).length - 2} more
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {order.delivery_man ? (
                            <div className="text-xs">
                              <div className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">
                                <Bike className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                {order.delivery_man.name}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {order.delivery_man.phone}
                              </div>
                              {order.delivery_status && (
                                <Badge className="mt-1 text-[10px] px-1 py-0 h-4 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                  {order.delivery_status.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          ) : order.order_type === 'delivery' ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500 italic">Not assigned</span>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <Button
                            onClick={() => generateReceipt(order)}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <span className="font-semibold text-sm text-slate-900 dark:text-white">
                            ₹{Number(order.canteen_amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {new Date(order.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="border-t border-slate-300 dark:border-slate-600 hover:bg-transparent">
                      <TableCell colSpan={6} className="font-semibold text-sm text-slate-900 dark:text-white py-3">
                        Total <Badge variant="secondary" className="ml-2 text-xs">{filteredAndSorted.length} {filteredAndSorted.length === 1 ? 'order' : 'orders'}</Badge>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className="text-lg font-bold text-red-600 dark:text-red-500">
                          ₹{filteredAndSorted.reduce((sum, order) => sum + Number(order.canteen_amount), 0).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="withdrawals" className="mt-0">
        <WithdrawalHistory />
      </TabsContent>
    </Tabs>

        {/* Items Modal */}
        <Dialog open={itemsModalOpen} onOpenChange={setItemsModalOpen}>
          <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-xl text-red-600 dark:text-red-500">
                Order #{selectedOrderItems?.order_number} - All Items
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400">
                Complete list of items in this order
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedOrderItems && (
                <div className="space-y-2">
                  {(selectedOrderItems.order_items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900 dark:text-white">
                          {item.menu_items?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ₹{Number(item.price).toFixed(2)} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          ×{item.quantity}
                        </p>
                        <p className="text-xs font-bold text-red-600 dark:text-red-500">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="text-xl font-bold text-red-600 dark:text-red-500">
                      ₹{Number(selectedOrderItems.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setItemsModalOpen(false)}
                variant="outline"
                size="sm"
                className="dark:border-slate-700"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              {selectedOrderItems && (
                <Button
                  onClick={() => {
                    generateReceipt(selectedOrderItems);
                    setItemsModalOpen(false);
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Receipt
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
