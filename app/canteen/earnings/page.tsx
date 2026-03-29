'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  AlertCircle,
  TrendingUp,
  Clock,
  ShoppingBag,
  Search,
  User,
  Phone,
  Calendar as CalendarIcon,
  Package,
  IndianRupee,
  ChevronRight,
  Download,
  Filter,
  RefreshCw,
  Home,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  FileText,
  ArrowUpRight,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  SettlementStatusCard, 
  SettlementStatusBadge,
  SettlementProgress 
} from '@/components/dashboard/settlement-status';
import { cn } from '@/lib/utils';

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

// Status configurations
const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  'not_started': { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  'cooking': { label: 'Preparing', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: Package },
  'ready': { label: 'Ready', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle2 },
  'completed': { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
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

// Page Header with Breadcrumbs
function PageHeader({ stats }: { stats: Stats | null }) {
  const settlementPercentage = stats && stats.totalEarned > 0 
    ? (stats.totalPaid / stats.totalEarned) * 100 
    : 0;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" />
                Online Earnings
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Online Earnings
              </h1>
              {stats && <SettlementStatusBadge percentage={settlementPercentage} />}
              {stats?.isGstEnabled && (
                <Badge variant="outline" className="text-xs">GST 5%</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track and manage your online order earnings & settlements
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Statement
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Skeleton className="h-48 w-full rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

// Order Status Badge Component
function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig['not_started'];
  const Icon = config.icon;
  
  return (
    <Badge className={cn("font-medium", config.color)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Quick Stats Cards
function QuickStats({ stats }: { stats: Stats }) {
  const statItems = [
    { 
      label: 'Total Revenue', 
      value: stats.totalEarned, 
      icon: TrendingUp,
      color: 'text-slate-900 dark:text-white',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      iconColor: 'text-slate-600 dark:text-slate-400'
    },
    { 
      label: 'Settled', 
      value: stats.totalPaid, 
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    { 
      label: 'Pending', 
      value: stats.totalDue, 
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    { 
      label: 'Total Orders', 
      value: stats.totalOrders, 
      icon: ShoppingBag,
      color: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      isCurrency: false
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="border-slate-200 dark:border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg", stat.iconBg)}>
                  <Icon className={cn("h-4 w-4", stat.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                    {stat.label}
                  </p>
                  <p className={cn("text-lg font-bold truncate", stat.color)}>
                    {stat.isCurrency === false ? stat.value.toLocaleString('en-IN') : formatCurrency(stat.value)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Orders Table Component
function OrdersTable({ 
  orders, 
  onOrderClick 
}: { 
  orders: Order[]; 
  onOrderClick: (order: Order) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">No orders found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your filters or date range
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
            <TableHead className="font-semibold">Order</TableHead>
            <TableHead className="font-semibold">Customer</TableHead>
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold text-right">Amount</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow 
              key={order.id} 
              className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              onClick={() => onOrderClick(order)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      #{order.order_number}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {order.users ? (
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {order.users.name}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {order.users.roll_number}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {format(new Date(order.created_at), "dd MMM yyyy")}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {format(new Date(order.created_at), "hh:mm a")}
                </p>
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(order.canteen_amount)}
                </span>
                {order.is_gst_enabled && (
                  <p className="text-[10px] text-slate-400">incl. GST</p>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Eye className="h-4 w-4 text-slate-400" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Order Detail Dialog
function OrderDetailDialog({ 
  order, 
  isOpen, 
  onClose 
}: { 
  order: Order | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Order #{order.order_number}
                <OrderStatusBadge status={order.status} />
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {formatDate(order.created_at)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Customer Info */}
          {order.users && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{order.users.name}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span>{order.users.roll_number}</span>
                      <span>•</span>
                      <span>{order.users.phone}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.menu_items?.name || 'Item'}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.quantity} × {formatCurrency(item.menu_items?.price || item.canteen_price / item.quantity)}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(item.canteen_price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Price Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Price Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Items Total</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(order.itemsTotal)}</span>
                </div>
                {order.packagingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Packaging Fee</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(order.packagingFee)}</span>
                  </div>
                )}
                {order.is_gst_enabled && order.gstAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                      <span className="text-slate-900 dark:text-white">{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">GST (5%)</span>
                      <span className="text-slate-900 dark:text-white">{formatCurrency(order.gstAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-900 dark:text-white">Total Amount</span>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(order.canteen_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
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
  const [activeTab, setActiveTab] = useState('all');

  const getIndianDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoading(true);
      fetchEarnings();
    }
  }, [startDate, endDate]);

  useEffect(() => {
    let filtered = orders;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(query) ||
          order.users?.name?.toLowerCase().includes(query) ||
          order.users?.phone?.includes(query) ||
          order.users?.roll_number?.toLowerCase().includes(query)
      );
    }
    
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }
    
    setFilteredOrders(filtered);
  }, [searchQuery, orders, activeTab]);

  const fetchEarnings = async () => {
    try {
      const url = new URL('/api/canteen/online-earnings', window.location.origin);

      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        const istStartStr = `${year}-${month}-${day}T00:00:00.000+05:30`;
        const startDateUTC = new Date(istStartStr);
        url.searchParams.set('startDate', startDateUTC.toISOString());
      }

      if (endDate) {
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

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const hasFilters = startDate || endDate || searchQuery;

  // Calculate tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PageHeader stats={stats} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Settlement Status Card */}
        {stats && (
          <div className="mb-6">
            <SettlementStatusCard
              totalEarned={stats.totalEarned}
              totalPaid={stats.totalPaid}
              totalDue={stats.totalDue}
            />
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="mb-6">
            <QuickStats stats={stats} />
          </div>
        )}

        {/* Orders Section */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Orders</CardTitle>
                <CardDescription>
                  {filteredOrders.length} of {orders.length} orders
                  {hasFilters && ' (filtered)'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Date Filters */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <CalendarIcon className="mr-1.5 h-3 w-3" />
                        {startDate ? format(startDate, "dd MMM") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date > getIndianDate()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-slate-300 dark:text-slate-600">→</span>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <CalendarIcon className="mr-1.5 h-3 w-3" />
                        {endDate ? format(endDate, "dd MMM") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => date > getIndianDate()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {(startDate || endDate) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-slate-500" 
                      onClick={() => { setStartDate(undefined); setEndDate(undefined); }}
                    >
                      ✕
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={fetchEarnings}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Status Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="all" className="text-xs">
                  All ({tabCounts.all || 0})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">
                  Completed ({tabCounts.completed || 0})
                </TabsTrigger>
                <TabsTrigger value="ready" className="text-xs">
                  Ready ({tabCounts.ready || 0})
                </TabsTrigger>
                <TabsTrigger value="cooking" className="text-xs">
                  Preparing ({tabCounts.cooking || 0})
                </TabsTrigger>
                <TabsTrigger value="not_started" className="text-xs">
                  Pending ({tabCounts.not_started || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-0">
            <OrdersTable orders={filteredOrders} onOrderClick={handleOrderClick} />
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
