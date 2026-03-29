'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bike, Wallet, TrendingUp, IndianRupee, CheckCircle, Clock, Package } from 'lucide-react';

interface DeliveryMan {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
}

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
  delivery_partner_amount: number;
  order_type: string;
  delivery_status: string | null;
  created_at: string;
  users?: {
    id: string;
    phone: string;
    name: string | null;
    roll_number: string | null;
  };
  order_items: OrderItem[];
}

interface DeliveryEarning {
  deliveryMan: DeliveryMan;
  stats: {
    totalEarned: number;
    totalPaid: number;
    pendingPayment: number;
    totalDeliveries: number;
  };
  recentOrders: Order[];
  recentPayments: Array<{
    amount: number;
    paid_at: string;
    payment_method: string | null;
    transaction_reference: string | null;
    notes: string | null;
  }>;
}

export default function DeliveryEarningsPage() {
  const router = useRouter();
  const [deliveryEarnings, setDeliveryEarnings] = useState<DeliveryEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDeliveryEarnings();
  }, []);

  const fetchDeliveryEarnings = async () => {
    try {
      const response = await fetch('/api/canteen/delivery-earnings');
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch delivery earnings');
      }

      const data = await response.json();
      setDeliveryEarnings(data.deliveryEarnings || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load delivery earnings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-lg">Error</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalStats = deliveryEarnings.reduce(
    (acc, de) => ({
      totalEarned: acc.totalEarned + de.stats.totalEarned,
      totalPaid: acc.totalPaid + de.stats.totalPaid,
      pendingPayment: acc.pendingPayment + de.stats.pendingPayment,
      totalDeliveries: acc.totalDeliveries + de.stats.totalDeliveries,
    }),
    { totalEarned: 0, totalPaid: 0, pendingPayment: 0, totalDeliveries: 0 }
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Delivery Partner Earnings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Track earnings and payments for your delivery partners
          </p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IndianRupee className="w-5 h-5" />
              {totalStats.totalEarned.toFixed(2)}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              From {totalStats.totalDeliveries} deliveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IndianRupee className="w-5 h-5" />
              {totalStats.totalPaid.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <IndianRupee className="w-5 h-5" />
              {totalStats.pendingPayment.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Bike className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryEarnings.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Delivery Partner Cards */}
      <div className="space-y-4">
        {deliveryEarnings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Bike className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No Delivery Partners
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  No delivery partners with visible earnings found.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          deliveryEarnings.map((earning) => (
            <Card key={earning.deliveryMan.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Bike className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{earning.deliveryMan.name}</CardTitle>
                      <CardDescription>{earning.deliveryMan.phone}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={earning.deliveryMan.is_active ? "default" : "secondary"}>
                    {earning.deliveryMan.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Earned</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {earning.stats.totalEarned.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Paid</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {earning.stats.totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Pending</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <IndianRupee className="w-4 h-4" />
                      {earning.stats.pendingPayment.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Deliveries</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {earning.stats.totalDeliveries}
                    </p>
                  </div>
                </div>

                {earning.recentOrders.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                    <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-white">
                      Recent Deliveries
                    </h4>
                    <div className="space-y-3">
                      {earning.recentOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                #{order.order_number}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {new Date(order.created_at).toLocaleString()}
                              </p>
                              {order.users && (
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  {order.users.name || order.users.phone}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3" />
                                {order.delivery_partner_amount.toFixed(2)}
                              </p>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {order.delivery_status}
                              </Badge>
                            </div>
                          </div>
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                              {order.order_items.map((item, idx) => (
                                <span key={item.id}>
                                  {item.quantity}x {item.menu_items.name}
                                  {idx < order.order_items.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
