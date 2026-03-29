'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Package, Phone, MapPin, Clock, IndianRupee, Check, ChevronRight, ClipboardCheck, Loader2, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DeliveryOrdersSkeleton } from '@/components/page-skeletons';

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
  delivery_status?: string | null;
  created_at: string;
  canteen_id: string;
  user_id: string;
  address_id: string | null;
  canteens: {
    id: string;
    name: string;
    phone: string;
    address: string;
  };
  users: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  user_addresses: {
    id: string;
    label: string | null;
    address: string;
    phone: string | null;
  } | null;
  order_items: OrderItem[];

  completed_time: string | null;
  updated_at: string;
}

const OrderTimer = ({ startTime }: { startTime: string | null }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      setElapsed(Math.floor((now - start) / 1000));
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  if (!startTime) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-md border border-orange-100 dark:border-orange-800/30">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      <span className="font-mono font-bold text-sm tracking-wide">{formatTime(elapsed)}</span>
    </div>
  );
};

export default function DeliveryOrdersPage() {
  const router = useRouter();
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [assignedOrders, setAssignedOrders] = useState<Order[]>([]);
  const [acceptingOrder, setAcceptingOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const POLLING_INTERVAL = 10000; // 10 seconds
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Check if already subscribed AND sync with backend
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setIsSubscribed(true);
          // SYNC: Always send current subscription to backend to ensure it exists
          // This fixes "ghost" subscriptions where browser has it but DB doesn't
          try {
            await fetch('/api/delivery/push-subscription', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription }),
            });
            console.log('✅ Subscription synced with backend');
          } catch (err) {
            console.error('Failed to sync subscription:', err);
          }
        }
      });
    }

    // Set up polling every 30 seconds
    const intervalId = setInterval(() => {
      fetchOrders();
    }, POLLING_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [activeTab]);

  const toggleSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe logic
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Notify backend to remove
          await fetch('/api/delivery/push-subscription', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription }),
          });
          
          // Unsubscribe from browser
          await subscription.unsubscribe();
          setIsSubscribed(false);
          toast.success('Notifications disabled');
        }
      } else {
        // Subscribe logic
        const registration = await navigator.serviceWorker.ready;
        
        if (Notification.permission === 'denied') {
          toast.error('Notifications are blocked. Please enable them in your browser settings.');
          setSubscriptionLoading(false);
          return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Notifications permission was not granted.');
          setSubscriptionLoading(false);
          return;
        }

        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) throw new Error('VAPID public key not found');

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });

        const response = await fetch('/api/delivery/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });

        if (!response.ok) throw new Error('Failed to save subscription');

        setIsSubscribed(true);
        toast.success('Notifications enabled!');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error(isSubscribed ? 'Failed to disable notifications' : 'Failed to enable notifications');
    } finally {
      setSubscriptionLoading(false);
    }
  };
  
  // ... existing code ...

  // In the return JSX, replace the button:
          {/* Push Notification Bell Icon */}
          <Button 
            variant="ghost"
            size="icon"
            onClick={toggleSubscription}
            disabled={subscriptionLoading}
            className={`rounded-full transition-all duration-300 ${
              isSubscribed 
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400" 
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
            title={isSubscribed ? "Disable Notifications" : "Enable Notifications"}
          >
            {subscriptionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg 
                className={`w-6 h-6 ${isSubscribed ? 'fill-current' : 'none'}`}
                fill={isSubscribed ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
            )}
          </Button>

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const fetchOrders = async () => {
    try {
      // Fetch pending orders
      const fetchPendingOrders = async () => {
        const pendingResponse = await fetch('/api/delivery/orders', { cache: 'no-store' }); // Disable cache

        if (pendingResponse.status === 401) {
          router.push('/delivery/login');
          return;
        }

        if (!pendingResponse.ok) {
          throw new Error('Failed to fetch pending orders');
        }

        const pendingData = await pendingResponse.json();
        setPendingOrders(pendingData);
      };
      const fetchAssignedOrders = async () => {
        // Fetch assigned orders
        const assignedResponse = await fetch('/api/orders/me', { cache: 'no-store' }); // Disable cache

        if (assignedResponse.ok) {
          const assignedData = await assignedResponse.json();
          setAssignedOrders(assignedData);
        }
      };
      await Promise.all([fetchPendingOrders(), fetchAssignedOrders()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'started':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
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

  const getNextStatus = (currentStatus: string | null | undefined) => {
    switch (currentStatus) {
      case 'assigned':
        return 'delivered';
      default:
        return null;
    }
  };

  const getStatusButtonText = (currentStatus: string | null | undefined) => {
    switch (currentStatus) {
      case 'assigned':
        return 'Complete Delivery';
      default:
        return null;
    }
  };

  const getStatusButtonIcon = (currentStatus: string | null | undefined) => {
    switch (currentStatus) {
      case 'assigned':
        return CheckCircle;
      default:
        return CheckCircle;
    }
  };

  //   const getNextStatus = (currentStatus: string | null | undefined) => {
  //     switch (currentStatus) {
  //       case 'assigned':
  //         return 'picked_up';
  //       case 'picked_up':
  //         return 'delivered';
  //       default:
  //         return null;
  //     }
  //   };

  //   const getStatusButtonText = (currentStatus: string | null | undefined) => {
  //     switch (currentStatus) {
  //       case 'assigned':
  //         return 'Mark as Picked Up';
  //       case 'picked_up':
  //         return 'Mark as Delivered';
  //       default:
  //         return null;
  //     }
  //   };

  //   const getStatusButtonIcon = (currentStatus: string | null | undefined) => {
  //     switch (currentStatus) {
  //       case 'assigned':
  //         return Package;
  //       case 'picked_up':
  //         return Truck;
  //       default:
  //         return CheckCircle;
  //     }
  //   };
  const acceptDelivery = async (orderId: string) => {
    setAcceptingOrder(orderId);
    try {
      const response = await fetch('/api/delivery/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept delivery');
      }

      const data = await response.json();
      toast.success('Delivery accepted successfully!');

      // Remove from pending and refresh assigned orders
      setPendingOrders(pendingOrders.filter(order => order.id !== orderId));

      // Fetch updated assigned orders
      const assignedResponse = await fetch('/api/orders/me');
      if (assignedResponse.ok) {
        const assignedData = await assignedResponse.json();
        setAssignedOrders(assignedData);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept delivery');
    } finally {
      setAcceptingOrder(null);
    }
  };

  const updateDeliveryStatus = async (orderId: string, newStatus: string, otp?: string) => {
    setUpdatingStatus(orderId);
    try {
      const payload: any = {
        orderId,
        deliveryStatus: newStatus
      };



      const response = await fetch('/api/orders/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);

      // Update the order in the assigned orders list
      setAssignedOrders(assignedOrders.map(order =>
        order.id === orderId
          ? { ...order, delivery_status: newStatus }
          : order
      ));

      // Update the order in the assigned orders list
      setAssignedOrders(assignedOrders.map(order =>
        order.id === orderId
          ? { ...order, delivery_status: newStatus }
          : order
      ));

    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleStatusUpdate = (orderId: string, currentStatus: string | null | undefined) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    updateDeliveryStatus(orderId, nextStatus);
  };




  if (loading && pendingOrders.length === 0 && assignedOrders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <DeliveryOrdersSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Delivery Orders</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your delivery assignments</p>
          </div>
          
          {/* Push Notification Bell Icon */}
          <Button 
            variant="ghost"
            size="icon"
            onClick={toggleSubscription}
            disabled={subscriptionLoading}
            className={`rounded-full transition-all duration-300 ${
              isSubscribed 
                ? "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400" 
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
            title={isSubscribed ? "Disable Notifications" : "Enable Notifications"}
          >
            {subscriptionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg 
                className={`w-6 h-6 ${isSubscribed ? 'fill-current' : 'none'}`}
                fill={isSubscribed ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
            )}
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="pending" className="gap-2">
              <Package className="w-4 h-4" />
              Pending ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Assigned ({assignedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pendingOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No pending orders
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    There are no delivery orders available to accept at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">Order #{order.order_number}</CardTitle>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className={`${getStatusColor(order.status)} border-0`}>
                              Kitchen: {order.status}
                            </Badge>
                            <Badge variant="outline" className={`${getPaymentColor(order.payment_status)} border-0`}>
                              Payment: {order.payment_status}
                            </Badge>
                          </div>
                            <CardDescription className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(order.created_at)}
                          </CardDescription>
                          <div className="mt-2">
                             <OrderTimer startTime={order.completed_time || order.updated_at} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-2xl font-bold text-green-600 dark:text-green-400">
                            <IndianRupee className="w-5 h-5" />
                            {order.total_amount}
                          </div>
                          {order.delivery_fee > 0 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Delivery Fee: ₹{order.delivery_fee}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Canteen Pickup Info */}
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Pickup from: {order.canteens.name}
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {order.canteens.phone ? (
                              <a href={`tel:${order.canteens.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                {order.canteens.phone}
                              </a>
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{order.canteens.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Delivery Address */}
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-sm text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Deliver to: {order.users?.name || 'Customer'}
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {(order.users?.phone) ? (
                              <a href={`tel:${order.users?.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                {order.users?.phone}
                              </a>
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              {order.user_addresses?.label && (
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {order.user_addresses.label}:{' '}
                                </span>
                              )}
                              <span>{order.user_addresses?.address || 'Address not available'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
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
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {order.order_items[0]?.menu_items.name}
                                  {order.order_items.length > 1 && (
                                    <span className="text-blue-600 dark:text-blue-400 ml-2">
                                      +{order.order_items.length - 1} more
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            </div>
                          </button>
                        </div>

                        {/* Desktop View - Full List */}
                        <div className="hidden lg:block">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                            Items ({order.order_items.length})
                          </h4>
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                              >
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    {item.menu_items.name}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Qty: {item.quantity}
                                  </p>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    ₹{item.price}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Accept Delivery Button */}
                      <Button
                        onClick={() => acceptDelivery(order.id)}
                        disabled={acceptingOrder === order.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                      >
                        {acceptingOrder === order.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Accepting...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Accept Delivery
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assigned">
            {assignedOrders.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ClipboardCheck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No assigned orders
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    You haven't accepted any delivery orders yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {assignedOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-xl">Order #{order.order_number}</CardTitle>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <Badge variant="outline" className={`${getStatusColor(order.status)} border-0`}>
                              Kitchen: {order.status}
                            </Badge>
                            {order.delivery_status && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">
                                Delivery: {order.delivery_status.replace('_', ' ')}
                              </Badge>
                            )}
                            <Badge variant="outline" className={`${getPaymentColor(order.payment_status)} border-0`}>
                               Payment: {order.payment_status}
                            </Badge>
                          </div>
                            <CardDescription className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(order.created_at)}
                          </CardDescription>
                          <div className="mt-2">
                            {order.delivery_status !== 'delivered' && (
                              <OrderTimer startTime={order.completed_time || order.updated_at} />
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-2xl font-bold text-green-600 dark:text-green-400">
                            <IndianRupee className="w-5 h-5" />
                            {order.total_amount}
                          </div>
                          {order.delivery_fee > 0 && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Delivery Fee: ₹{order.delivery_fee}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Canteen Pickup Info */}
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Pickup from: {order.canteens.name}
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {order.canteens.phone ? (
                              <a href={`tel:${order.canteens.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                {order.canteens.phone}
                              </a>
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{order.canteens.address || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Delivery Address */}
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-semibold text-sm text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Deliver to: {order.users?.name || 'Customer'}
                        </h4>
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {(order.users?.phone) ? (
                              <a href={`tel:${order.users?.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                {order.users?.phone}
                              </a>
                            ) : (
                              <span>N/A</span>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              {order.user_addresses?.label && (
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {order.user_addresses.label}:{' '}
                                </span>
                              )}
                              <span>{order.user_addresses?.address || 'Address not available'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="mb-4">
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
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {order.order_items[0]?.menu_items.name}
                                  {order.order_items.length > 1 && (
                                    <span className="text-blue-600 dark:text-blue-400 ml-2">
                                      +{order.order_items.length - 1} more
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-400" />
                            </div>
                          </button>
                        </div>

                        {/* Desktop View - Full List */}
                        <div className="hidden lg:block">
                          <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">
                            Items ({order.order_items.length})
                          </h4>
                          <div className="space-y-2">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700"
                              >
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    {item.menu_items.name}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Qty: {item.quantity}
                                  </p>
                                  <p className="font-medium text-slate-900 dark:text-white">
                                    ₹{item.price}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Update Delivery Status */}
                      {order.delivery_status !== 'delivered' ? (
                        <div className="mt-4">
                          {getNextStatus(order.delivery_status) && (
                            <Button
                              onClick={() => handleStatusUpdate(order.id, order.delivery_status)}
                              disabled={updatingStatus === order.id}
                              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                            >
                              {updatingStatus === order.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  {(() => {
                                    const Icon = getStatusButtonIcon(order.delivery_status);
                                    return <Icon className="w-4 h-4 mr-2" />;
                                  })()}
                                  {getStatusButtonText(order.delivery_status)}
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Order Delivered</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Sheet for Order Items - Mobile Only */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] flex flex-col">
          {selectedOrder && (
            <>
              <SheetHeader className="flex-shrink-0">
                <SheetTitle className="text-left">Order #{selectedOrder.order_number}</SheetTitle>
                <SheetDescription className="text-left">
                  {selectedOrder.order_items.length} {selectedOrder.order_items.length === 1 ? 'item' : 'items'}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-3 overflow-y-auto flex-1">
                {selectedOrder.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {item.menu_items.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        ₹{item.price} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">
                        ×{item.quantity}
                      </p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ₹{item.price * item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Delivery Fee</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ₹{selectedOrder.delivery_fee}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900 dark:text-white">Total</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                      <IndianRupee className="w-5 h-5" />
                      {selectedOrder.total_amount}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>


    </div>
  );
}
