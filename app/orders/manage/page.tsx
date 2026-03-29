'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { OrdersManageSkeleton } from "@/components/page-skeletons";
import { useCanteen } from '@/lib/canteen-context';
import { useOrderNotification } from '@/lib/hooks/use-order-notification';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Check, Edit2, Trash2, X, Save, BookOpen, DollarSign, Ban, Volume2, VolumeX, UtensilsCrossed, Package, Bike, Printer, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface OrderItem {
  menu_item_id: string;
  quantity: number;
  price: number;
  menu_items?: { name: string };
  canteen_price?: number;
}

interface OrderWithItems {
  id: string;
  order_number: number;
  serial_number?: string;
  status: 'not_started' | 'started' | 'cooking' | 'ready' | 'completed';
  payment_status: 'paid' | 'pending';
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
  note?: string | null;
  users?: {
    name: string;
    phone: string;
  };
  order_type?: 'dine-in' | 'takeaway' | 'delivery';
  delivery_fee?: number;
  packaging_fee?: number;
  gst_amount_total?: number;
  coupon?: {
    code: string;
    type: string;
    rewards: any[];
  };
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

export default function DisplayPage() {
  const { selectedCanteen } = useCanteen();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<OrderItem[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [khataDialogOpen, setKhataDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [addingToKhata, setAddingToKhata] = useState(false);
  
  // Note Modal State
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNoteOrder, setSelectedNoteOrder] = useState<OrderWithItems | null>(null);

  // Order notification sound hook
  const { 
    isSoundEnabled, 
    checkForNewOrders, 
    enableSound 
  } = useOrderNotification({
    canteenId: selectedCanteen?.id || null,
    enabled: true,
    volume: 0.6
  });

  const fetchOrders = async () => {
    if (!selectedCanteen) {
      setLoading(false);
      return;
    }
    
    try {
      const res = await fetch(`/api/orders/manage?canteenId=${selectedCanteen.id}`);
      if (!res.ok) throw new Error('Failed to load orders');
      
      const transformedData = await res.json();
      
      // Check for new orders and play notification sound
      checkForNewOrders(transformedData);
      
      setOrders(transformedData);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    if (!selectedCanteen) return;
    
    try {
      const res = await fetch(`/api/menu?canteenId=${selectedCanteen.id}`);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      const data = await res.json();
      if (data) setMenuItems(data);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const fetchStudents = async () => {
    if (!selectedCanteen) return;
    
    try {
      const res = await fetch(`/api/khata?canteen_id=${selectedCanteen.id}`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      if (data && data.students) setStudents(data.students);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
    fetchStudents();

    if (!selectedCanteen) return;

    // Use regular polling since realtime requires exposed supabase
    const interval = setInterval(fetchOrders, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [selectedCanteen]);

  const updateOrderStatus = async (orderId: string, newStatus: 'not_started' | 'started' | 'cooking' | 'ready' | 'completed') => {
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus })
      });

      if (!res.ok) throw new Error('Failed to update status');
      
      // console.log('Order updated in DB, triggering notification...'); // Debug log

      // Trigger push notification to user (non-blocking)
      fetch('/api/orders/notify-status-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus }),
      })
        .then(async (res) => {
          const text = await res.text();
          // console.log('Notification API response:', res.status, text); // Debug log
          try {
             return JSON.parse(text);
          } catch (e) {
             return { sent: 0 };
          }
        })
        .then((data) => {
          if (data.sent > 0) {
            console.log(`Push notification sent to ${data.sent} device(s)`);
          } else {
             console.log('Notification result:', data);
          }
        })
        .catch((err) => {
           console.error('Failed to send push notification:', err);
        });

      // Trigger delivery notification when order reaches cooking or started status (non-blocking)
      if (newStatus === 'cooking' || newStatus === 'started') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.order_type === 'delivery') {
          fetch('/api/webhooks/order-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: order.id,
              order_number: order.order_number,
              status: newStatus,
              total_amount: order.total_amount,
              order_type: order.order_type,
              canteen_id: selectedCanteen?.id,
              canteen_name: selectedCanteen?.name,
            }),
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              console.log('✅ Delivery notification sent:', data.message);
            }
          })
          .catch(err => {
            console.error('⚠️ Failed to send delivery notification:', err);
          });
        }
      }
      
      await fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    }
  };

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: 'paid' | 'pending') => {
    try {
      const res = await fetch('/api/orders/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: newPaymentStatus })
      });

      if (!res.ok) throw new Error('Failed to update payment status');
      await fetchOrders();
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const res = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      
      if (!res.ok) throw new Error('Failed to delete order');
      await fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    }
  };

  const startEditingOrder = (order: OrderWithItems) => {
    setEditingOrderId(order.id);
    setEditingItems([...order.order_items]);
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditingItems([]);
  };

  const addOrderToKhata = async () => {
    if (!selectedStudent || !selectedOrder) return;
    
    setAddingToKhata(true);
    try {
      if (!selectedCanteen) {
        alert('No canteen selected');
        return;
      }
      
      const itemsNote = selectedOrder.order_items.map(item => 
        `${item.menu_items?.name} x${item.quantity}`
      ).join(', ');
      
      const orderAmount = Number(selectedOrder.total_amount);
      
      const res = await fetch('/api/khata', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            type: 'add_entry',
            student_id: selectedStudent,
            amount: orderAmount,
            entry_type: 'debit',
            note: `Order #${selectedOrder.order_number} - ${itemsNote}`,
            canteen_id: selectedCanteen.id
         })
      });
      
      if (!res.ok) throw new Error('Failed to add entry');
      
      const data = await res.json();
      const newBalance = data.entry?.balance_after || 0;
      
      console.log('Balance updated successfully:', newBalance);
      
      setKhataDialogOpen(false);
      setSelectedStudent('');
      setSelectedOrder(null);
      
      // Refresh orders list to show updated state
      await fetchOrders();
      
      alert(`Order added to khata successfully! New balance: ₹${newBalance.toFixed(2)}`);
    } catch (err) {
      console.error('Error adding to khata:', err);
      alert('Failed to add order to khata');
    } finally {
      setAddingToKhata(false);
    }
  };

  const updateEditingItemQuantity = (menuItemId: string, delta: number) => {
    setEditingItems(items => 
      items.map(item => 
        item.menu_item_id === menuItemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeEditingItem = (menuItemId: string) => {
    setEditingItems(items => items.filter(item => item.menu_item_id !== menuItemId));
  };

  const addItemToEdit = (menuItem: MenuItem) => {
    const existingItem = editingItems.find(item => item.menu_item_id === menuItem.id);
    
    if (existingItem) {
      updateEditingItemQuantity(menuItem.id, 1);
    } else {
      setEditingItems([...editingItems, {
        menu_item_id: menuItem.id,
        quantity: 1,
        price: menuItem.price,
        menu_items: { name: menuItem.name }
      }]);
    }
  };

  const saveOrderEdit = async (orderId: string) => {
    if (editingItems.length === 0) {
      alert('Order must have at least one item');
      return;
    }

    try {
      const orderItemsForApi = editingItems.map(item => ({
        menuItemId: item.menu_item_id,
        quantity: item.quantity,
        canteen_price: item.price,
      }));
      
      const res = await fetch('/api/orders/edit', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            orderId,
            orderItems: orderItemsForApi,
            canteenId: selectedCanteen?.id
         })
      });

      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error || 'Failed to save order changes');
      }

      setEditingOrderId(null);
      setEditingItems([]);
      await fetchOrders();
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Failed to save order changes');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'cooking':
      case 'started':
        return <ChefHat className="w-5 h-5 text-orange-500" />;
      case 'ready':
        return <Check className="w-5 h-5 text-emerald-500" />;
      default:
        return null;
    }
  };

  const notStartedOrders = orders.filter(o => o.status === 'not_started');
  const inProgressOrders = orders.filter(o => o.status === 'cooking' || o.status === 'started');
  const readyOrders = orders.filter(o => o.status === 'ready');

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1e] p-4 sm:p-6 lg:p-8">
        <OrdersManageSkeleton />
      </div>
    );
  }

  const renderOrderCard = (order: OrderWithItems) => {
    const isEditing = editingOrderId === order.id;
    const displayItems = isEditing ? editingItems : order.order_items;
    
    // Calculate totals
    const itemsTotal = displayItems.reduce((sum, item) => sum + ((item.canteen_price || item.price) * item.quantity), 0);
    const deliveryFee = order.delivery_fee || 0;
    const packagingFee = order.packaging_fee || 0;
    const gstAmount = order.gst_amount_total || 0;
    
    // Calculate expected total before discount
    const subTotalWithFees = itemsTotal + deliveryFee + packagingFee + gstAmount;
    
    // Derived discount (if not storing discount amount directly)
    const finalTotal = isEditing 
      ? itemsTotal // simplified for edit mode
      : order.total_amount;
      
    const discountAmount = isEditing ? 0 : Math.max(0, subTotalWithFees - finalTotal);

  const bgColorClass = order.status === 'ready' 
      ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300' 
      : (order.status === 'cooking' || order.status === 'started')
      ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
      : 'bg-amber-50 border-amber-200 hover:border-amber-300';

    const accentColor = order.status === 'ready' 
      ? 'text-emerald-700' 
      : (order.status === 'cooking' || order.status === 'started')
      ? 'text-orange-700'
      : 'text-amber-700';
    
    console.log(displayItems);

    return (
      <Card key={order.id} className={`${bgColorClass} border-2 hover:shadow-xl transition-all duration-300`}>
        <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-4">
              {/* Left Group */}
              <div className="flex items-center gap-3">
                <div className="bg-[#1e293b] text-white dark:bg-white dark:text-slate-900 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-700 dark:border-slate-200">
                   <span className="font-bold text-sm">#{order.serial_number}</span>
                </div>
                <div className="flex flex-col">
                  <p className="font-bold text-sm text-slate-700 dark:text-slate-200 leading-tight">
                    {order?.users?.name || 'Guest'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {order?.users?.phone}
                  </p>
                </div>
              </div>

              {/* Right Group: Badge + Actions */}
              <div className="flex items-center gap-2">
                 {order.order_type && (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ${
                      order.order_type === 'dine-in' ? 'bg-blue-600' : 
                      order.order_type === 'takeaway' ? 'bg-purple-600' : 'bg-orange-600'
                    }`}>
                      {order.order_type === 'dine-in' && <UtensilsCrossed className="w-3 h-3 mr-1" />}
                      {order.order_type === 'takeaway' && <Package className="w-3 h-3 mr-1" />}
                      {order.order_type === 'delivery' && <Bike className="w-3 h-3 mr-1" />}
                      {order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}
                    </span>
                 )}

                 {!isEditing && (
                   <div className="flex items-center gap-1 ml-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(order);
                          setKhataDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingOrder(order)}
                        className="h-7 w-7 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteOrder(order.id)}
                        className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-500 text-slate-400 dark:text-slate-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                   </div>
                 )}
              </div>
            </div>

          {/* Body */}
          <div className="mb-4 space-y-2">
            {displayItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-white/60 rounded-lg p-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.quantity} × {item.menu_items?.name || 'Unknown'}
                </span>
                <div className="flex items-center gap-2">
                   {isEditing && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateEditingItemQuantity(item.menu_item_id, -1)}
                      className="h-6 w-6 p-0"
                      disabled={item.quantity <= 1}
                    >
                      -
                    </Button>
                  )}
                  {isEditing && (
                    <span className="text-sm font-bold min-w-[20px] text-center">
                     {item.quantity}
                    </span>
                  )}
                  {isEditing && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateEditingItemQuantity(item.menu_item_id, 1)}
                        className="h-6 w-6 p-0"
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEditingItem(item.menu_item_id)}
                        className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ₹{((item.canteen_price || item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Note Section - Truncated Display */}
          {order.note && (
            <div className="mb-4">
               <div 
                onClick={() => {
                  setSelectedNoteOrder(order);
                  setNoteDialogOpen(true);
                }}
                className="group relative cursor-pointer bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-3 border border-dashed border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
              >
                 <div className="flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-amber-600/70 dark:text-amber-500/70 tracking-wider shrink-0">Note:</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate">
                        {order.note}
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      See More
                    </span>
                 </div>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="mb-4 p-3 bg-white/60 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-2">Add Items:</p>
              <div className="flex flex-wrap gap-1">
                {menuItems.map(menuItem => (
                  <Button
                    key={menuItem.id}
                    size="sm"
                    variant="outline"
                    onClick={() => addItemToEdit(menuItem)}
                    className="text-xs h-7"
                  >
                    {menuItem.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Bill Summary */}
          <div className="mb-4 pt-3 border-t-2 border-dashed border-slate-300 space-y-1">
             {!isEditing && (
                 <>
                    {/* Item Total */}
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Items Total</span>
                        <span>₹{itemsTotal.toFixed(2)}</span>
                    </div>

                    {/* Fees Breakdown */}
                    {packagingFee > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Packaging</span>
                            <span>+₹{packagingFee.toFixed(2)}</span>
                        </div>
                    )}
                    {deliveryFee > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Delivery</span>
                            <span>+₹{deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    {gstAmount > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>GST</span>
                            <span>+₹{gstAmount.toFixed(2)}</span>
                        </div>
                    )}

                    {/* Discount */}
                    {(discountAmount > 0.5 || order.coupon) && (
                        <div className="flex justify-between items-center text-xs text-green-600 font-bold">
                            <span className="flex items-center gap-1">
                                <span className="bg-green-100 px-1 rounded uppercase tracking-wider text-[10px]">
                                    {order.coupon?.code || 'COUPON'}
                                </span>
                                Discount
                            </span>
                            <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                 </>
             )}

             {/* Final Total */}
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 mt-1">
                <span className="font-bold text-slate-700">Total</span>
                <span className={`text-2xl font-bold ${accentColor}`}>₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={() => saveOrderEdit(order.id)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button
                onClick={cancelEditing}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
             <div className="flex items-center gap-2">
                <div className="flex-1">
                  {order.status === 'not_started' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'started')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-md active:scale-95 transition-all"
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Start Order
                    </Button>
                  )}
                  {(order.status === 'cooking' || order.status === 'started') && (
                    <div className="flex gap-2">
                       <Button
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Ready
                      </Button>
                       <Button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md active:scale-95 transition-all"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Done
                      </Button>
                    </div>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md active:scale-95 transition-all"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Complete
                    </Button>
                  )}
                  {order.status === 'completed' && (
                     <div className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-center py-2 rounded-md font-bold text-sm">
                        Completed
                     </div>
                  )}
                </div>
                
                <Button
                   variant="outline"
                   className="h-10 w-10 p-0 border-slate-300 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400"
                >
                   <Printer className="w-4 h-4" />
                </Button>

                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePaymentStatus(order.id, order.payment_status === 'paid' ? 'pending' : 'paid');
                    }}
                    className={`h-10 px-4 rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                      order.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                        : 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                    }`}
                  >
                    {order.payment_status === 'paid' ? 'PAID' : 'PENDING'}
                  </button>
             </div>
          )}

              {/* Note Details Modal */}
              <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent className="sm:max-w-[500px] w-[95vw] bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  <DialogHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <DialogTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-100 text-xl">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-full">
                        <Edit2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      Order Note
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 dark:text-slate-400 pt-1">
                       Full instructions for Order #{selectedNoteOrder?.order_number}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-6 overflow-y-auto max-h-[60vh]">
                    <div className="bg-slate-50 dark:bg-[#0f172a] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 min-h-[120px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium leading-relaxed text-base shadow-inner w-full break-all">
                      {selectedNoteOrder?.note || "No content"}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                        onClick={() => setNoteDialogOpen(false)}
                        size="lg"
                        className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 font-semibold"
                    >
                        Close Note
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                Order Management
              </h1>
              <p className="text-slate-600 font-semibold">🔐 Admin: Edit orders, update status, and manage workflow</p>
            </div>
            {/* Sound Toggle Button */}
              <button
                onClick={enableSound}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg ${
                  isSoundEnabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200 animate-pulse border-2 border-amber-300'
                }`}
                title={isSoundEnabled ? 'Sound notifications enabled' : 'Click to enable sound notifications'}
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
                <span>{isSoundEnabled ? 'Sound On' : 'Enable Sound'}</span>
              </button>
              
              <button
                 onClick={() => {
                   fetch('/api/web-push/test', { method: 'POST' })
                     .then(res => res.json())
                     .then(data => {
                       alert(`Test Result: ${JSON.stringify(data)}`);
                     })
                     .catch(err => alert(`Error: ${err.message}`));
                 }}
                 className="ml-2 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-blue-100 text-blue-700 border-2 border-blue-200 hover:bg-blue-200"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                Test Push
              </button>

              <button
                 onClick={async () => {
                   const perm = Notification.permission;
                   const sw = await navigator.serviceWorker.getRegistration();
                   const sub = await sw?.pushManager.getSubscription();
                   alert(`Diagnostic:\nPermission: ${perm}\nSW Active: ${!!sw?.active}\nSubscription: ${sub ? 'EXISTS' : 'MISSING'}\nSub Endpoint: ${sub?.endpoint?.slice(0, 30)}...`);
                 }}
                 className="ml-2 px-3 py-2 rounded-xl text-xs font-mono bg-slate-200 text-slate-700 hover:bg-slate-300"
              >
                 Diagnose
              </button>

              <button
                 onClick={() => {
                   fetch('/api/debug-columns')
                     .then(res => res.json())
                     .then(data => alert(`Schema Probe: ${JSON.stringify(data, null, 2)}`))
                     .catch(e => alert(e.message));
                 }}
                 className="ml-2 px-3 py-2 rounded-xl text-xs font-mono bg-red-100 text-red-700 hover:bg-red-200"
              >
                 Probe Schema
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4 bg-white rounded-lg p-4 shadow-sm">
              <Clock className="w-7 h-7 text-amber-500" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">Waiting</h2>
                <p className="text-xs text-slate-500">Orders in queue</p>
              </div>
              <span className="bg-amber-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {notStartedOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {notStartedOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white/50 rounded-lg border-2 border-dashed border-slate-200">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No pending orders</p>
                </div>
              ) : (
                notStartedOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4 bg-white rounded-lg p-4 shadow-sm">
              <ChefHat className="w-7 h-7 text-orange-500" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">In Progress</h2>
                <p className="text-xs text-slate-500">Being prepared</p>
              </div>
              <span className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {inProgressOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {inProgressOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white/50 rounded-lg border-2 border-dashed border-slate-200">
                  <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No orders in progress</p>
                </div>
              ) : (
                inProgressOrders.map(renderOrderCard)
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4 bg-white rounded-lg p-4 shadow-sm">
              <Check className="w-7 h-7 text-emerald-500" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-800">Ready</h2>
                <p className="text-xs text-slate-500">Ready for pickup</p>
              </div>
              <span className="bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-md">
                {readyOrders.length}
              </span>
            </div>
            <div className="space-y-3">
              {readyOrders.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white/50 rounded-lg border-2 border-dashed border-slate-200">
                  <Check className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No ready orders</p>
                </div>
              ) : (
                readyOrders.map(renderOrderCard)
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-slate-600 font-medium">Auto-refreshing every 5 seconds</p>
          </div>
        </div>
      </div>
    </div>
  );
}
