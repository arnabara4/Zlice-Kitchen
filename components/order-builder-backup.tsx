// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCanteen } from '@/lib/canteen-context';
import { useOrderNotification } from '@/lib/hooks/use-order-notification';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, Trash2, Printer, RotateCcw, Clock, ChefHat, Check, Edit2, X, Save, BookOpen, ShoppingCart, Search, DollarSign, Ban, Volume2, VolumeX, UtensilsCrossed, Package, Bike } from 'lucide-react';
import { printReceipt as printReceiptPWA, type ReceiptData, isBluetoothEnabledAndConnected } from '@/lib/printer/pwa-printer';
import { printQueue } from '@/lib/printer/print-queue';
import { printKOT, type KOTData } from '@/lib/printer/kot-printer';
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
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuItem {
  id: string;
  name: string;
  price: number;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  canteen_price: number;
  quantity: number;
}

interface OrderWithItems {
  id: string;
  order_number: string;
  serial_number?: number;
  status: 'not_started' | 'cooking' | 'ready' | 'completed' | 'cancelled';
  payment_status?: 'paid' | 'pending';
  order_type?: 'dine-in' | 'takeaway' | 'delivery';
  total_amount?: number;
  canteen_amount: number;
  packaging_fee?: number;
  packaging_amount?: number;
  delivery_fee?: number;
  delivery_partner_amount?: number;
  is_gst_enabled?: boolean;
  created_at: string;
  user_id?: string | null;
  users?: {
    id: string;
    phone: string;
    name?: string;
    roll_number?: string;
  } | null;
  order_items?: Array<{
    menu_item_id: string;
    quantity: number;
    price: number;
    canteen_price: number;
    menu_items?: { name: string };
  }>;
  note?: string | null;
}

interface OrderBuilderProps {
  onOrderCreated?: () => void;
}

export function OrderBuilder({ onOrderCreated }: OrderBuilderProps) {
  const { selectedCanteen, selectedCanteenId } = useCanteen();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentOrders, setCurrentOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextOrderNumber, setNextOrderNumber] = useState('A1B2');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<any[]>([]);
  const [editingOrderNumber, setEditingOrderNumber] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [khataDialogOpen, setKhataDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [addingToKhata, setAddingToKhata] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Note Modal State
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNoteOrder, setSelectedNoteOrder] = useState<OrderWithItems | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('pending');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [orderNote, setOrderNote] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Order notification sound hook
  const {
    isSoundEnabled,
    checkForNewOrders,
    toggleSound
  } = useOrderNotification({
    canteenId: selectedCanteen?.id || null,
    enabled: true,
    volume: 0.7
  });

  const fetchCurrentOrders = async () => {
    if (!selectedCanteen) return;

    try {
      const supabase = createClient();
      const { data: currentOrdsData } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number,
          serial_number, 
          status,
          payment_status,
          total_amount, 
          canteen_amount,
          is_gst_enabled,
          packaging_fee,
          packaging_amount,
          delivery_fee,
          delivery_partner_amount,
          created_at,
          user_id,
          order_type,
          note,
          users (id, phone, name, roll_number),
          order_items (
            menu_item_id,
            quantity,
            price,
            canteen_price,
            menu_items (name)
          )
        `)
        .eq('canteen_id', selectedCanteen.id)
        .in('status', ['not_started', 'cooking', 'ready'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (currentOrdsData) {
        const transformedData = currentOrdsData.map((order: any) => ({
          ...order,
          order_items: order.order_items.map((item: any) => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price,
            canteen_price: item.canteen_price,
            menu_items: item.menu_items?.[0] || item.menu_items || { name: 'Unknown' }
          }))
        }));

        // Check for new orders and play notification sound
        checkForNewOrders(transformedData);
        console.log("Fetched current orders:", transformedData);
        setCurrentOrders(transformedData);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const printOrder = async (order: OrderWithItems) => {
    const itemsToPrint = order.order_items || [];

    // Use stored total_amount from database, fallback to canteen_amount
    const storedTotal = order.total_amount || order.canteen_amount;

    // Calculate items subtotal from stored prices
    const itemsSubtotal = itemsToPrint.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);

    // Use stored packaging fee from order
    const packagingFee = order.packaging_fee || 0;

    // Get delivery fee from order (only for delivery orders)
    const deliveryFee = (order.order_type === 'delivery' && order.delivery_fee) ? order.delivery_fee : 0;

    // Calculate GST as 5% of subtotal
    const gstAmount = order.is_gst_enabled ? itemsSubtotal * 0.05 : 0;

    // Use PWA printer with Bluetooth fallback
    await printReceiptPWA({
      canteenName: selectedCanteen?.name,
      address: selectedCanteen?.address || undefined,
      phone: selectedCanteen?.phone || undefined,
      orderNumber: order.order_number,
      serialNumber: order.serial_number,
      createdAt: order.created_at,
      items: itemsToPrint.map((it: any) => ({
        name: `${it.menu_items?.name || 'Unknown'}`,
        quantity: it.quantity,
        price: it.price
      })),
      subtotal: itemsSubtotal,
      gst: gstAmount > 0 ? gstAmount : undefined,
      packagingFee: packagingFee > 0 ? packagingFee : undefined,
      deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
      total: itemsSubtotal + gstAmount + packagingFee + deliveryFee,
      customerName: order.users?.name,
      customerPhone: order.users?.phone,
      customerRoll: order.users?.roll_number
    });
  };

  // Print KOT (Kitchen Order Ticket) - for kitchen workers
  // No pricing information, focused on items and quantities
  const printKOTForOrder = async (order: OrderWithItems, useThermal: boolean = true) => {
    const itemsToPrint = order.order_items || [];

    // Prepare KOT data without pricing
    const kotData: KOTData = {
      canteenName: selectedCanteen?.name,
      orderNumber: order.order_number,
      serialNumber: order.serial_number,
      createdAt: order.created_at,
      items: itemsToPrint.map((it: any) => ({
        name: it.menu_items?.name || it.menu_items || 'Unknown',
        quantity: it.quantity,
        // notes: '' // Can be added if you track item-specific notes
      })),
      customerName: order.users?.name,
      customerPhone: order.users?.phone,
      customerRoll: order.users?.roll_number,
      // customerAddress: order.users?.address, // Add if available
      orderType: order.order_type,
      // tableNumber: order.table_number, // Add if you track table numbers
      // specialInstructions: order.special_instructions, // Add if you track special instructions
    };

    // Print KOT
    await printKOT(kotData, useThermal);
  };


  const fetchStudents = async () => {
    if (!selectedCanteen) return;

    setLoadingStudents(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('khata_students')
        .select('*')
        .eq('canteen_id', selectedCanteen.id)
        .order('name');

      if (data) setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCanteen) return;

      try {
        const supabase = createClient();

        // Fetch menu items
        const { data: items } = await supabase
          .from('menu_items')
          .select('*')
          .eq('canteen_id', selectedCanteen.id)
          .eq('is_available', true)
          .order('name');

        if (items) {
            setMenuItems(items);
        }

        // Fetch students for khata
        await fetchStudents();

        // Generate next serial number for today
        const generateSerialNumber = async () => {
          if (!selectedCanteen) return 1;

          // Get today's date in GMT timezone (start and end of day)
          const now = new Date();
          const todayStartGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
          const todayEndGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

          // Query orders from today for this canteen, ordered by serial number descending
          const { data: todayOrders, error } = await supabase
            .from('orders')
            .select('serial_number')
            .eq('canteen_id', selectedCanteen.id)
            .gte('created_at', todayStartGMT.toISOString())
            .lte('created_at', todayEndGMT.toISOString())
            .order('serial_number', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Error fetching today\'s orders:', error);
            return 1;
          }

          // If no orders today, start from 1
          if (!todayOrders || todayOrders.length === 0) {
            return 1;
          }

          // Parse the highest serial number and increment
          const lastSerialNumber = todayOrders[0].serial_number;
          return lastSerialNumber ? lastSerialNumber + 1 : 1;
        };

        const nextSerial = await generateSerialNumber();
        setNextOrderNumber(nextSerial.toString());

        // Fetch current orders
        await fetchCurrentOrders();
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      fetchCurrentOrders();
    }, 2000);

    const handleOnline = () => {
      console.log('Online detected: Refreshing menu and orders...');
      fetchData();
      fetchCurrentOrders();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [selectedCanteenId, checkForNewOrders]); // Use stable ID

  const addItem = (item: MenuItem) => {
    const existing = orderItems.find(oi => oi.menuItemId === item.id);
    if (existing) {
      setOrderItems(orderItems.map(oi =>
        oi.menuItemId === item.id
          ? { ...oi, quantity: oi.quantity + 1 }
          : oi
      ));
    } else {
      setOrderItems([...orderItems, {
        menuItemId: item.id,
        name: item.name,
        canteen_price: item.price,
        quantity: 1,
      }]);
    }
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setOrderItems(orderItems.map(oi =>
      oi.menuItemId === menuItemId
        ? { ...oi, quantity: Math.max(1, oi.quantity + delta) }
        : oi
    ).filter(oi => oi.quantity > 0));
  };

  const removeItem = (menuItemId: string) => {
    setOrderItems(orderItems.filter(oi => oi.menuItemId !== menuItemId));
  };

  const total = orderItems.reduce((sum, item) => sum + (item.canteen_price * item.quantity), 0);

  // Calculate packaging fee based on order type and canteen settings
  const calculatePackagingFee = () => {
    if (orderType === 'dine-in' || !selectedCanteen) return 0;

    const feeType = selectedCanteen.packaging_fee_type || 'fixed';
    if (feeType === 'per_item') {
      const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
      return totalItems * (selectedCanteen.packaging_fee_per_item || 0);
    } else {
      return selectedCanteen.total_packaging_fee || 0;
    }
  };

  // Calculate packaging fee for an existing order
  const calculateOrderPackagingFee = (order: OrderWithItems) => {
    if (order.order_type === 'dine-in' || !selectedCanteen) return 0;

    const feeType = selectedCanteen.packaging_fee_type || 'fixed';
    if (feeType === 'per_item') {
      const totalItems = (order.order_items || []).reduce((sum, item) => sum + item.quantity, 0);
      return totalItems * (selectedCanteen.packaging_fee_per_item || 0);
    } else {
      return selectedCanteen.total_packaging_fee || 0;
    }
  };

  const packagingFee = calculatePackagingFee();
  const grandTotal = total + packagingFee;

  // Generate new random order number for next order
  const generateOrderNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const submitOrder = async () => {
    if (orderItems.length === 0) {
      alert('Please add items to order');
      return;
    }

    if (!selectedCanteen) {
      alert('Please select a kitchen first');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const now = new Date();

      // Generate  next serial number from database
      const getNextSerialNumber = async () => {
        const todayStartGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const todayEndGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const { data: latestOrder } = await supabase
          .from('orders')
          .select('serial_number')
          .eq('canteen_id', selectedCanteen.id)
          .gte('created_at', todayStartGMT.toISOString())
          .lte('created_at', todayEndGMT.toISOString())
          .order('serial_number', { ascending: false })
          .limit(1)
          .single();
        
        return latestOrder ? latestOrder.serial_number + 1 : 1;
      };

      const serialNumber = await getNextSerialNumber();
      const orderId = crypto.randomUUID();

      // Construct order items for database
      const orderItemsForDB = orderItems.map(item => ({
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.canteen_price,
        canteen_price: item.canteen_price,
      }));

      // Ensure global uniqueness across the orders table by appending a random alphanumeric suffix
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const generatedOrderNumber = `${serialNumber}-${randSuffix}`;

      // Create order in database
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          order_number: generatedOrderNumber,
          serial_number: serialNumber,
          status: 'not_started',
          payment_status: paymentStatus,
          order_type: orderType,
          total_amount: grandTotal,
          canteen_amount: selectedCanteen.is_gst_enabled ? (total * 1.05 + packagingFee) : grandTotal,
          packaging_fee: packagingFee,
          packaging_amount: packagingFee,
          is_gst_enabled: selectedCanteen.is_gst_enabled,
          canteen_id: selectedCanteen.id,
          note: orderNote,
          created_at: now.toISOString(),
        });

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`);
      }

      // Insert order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsForDB.map(item => ({ ...item, order_id: orderId })));

      if (itemsError) {
        throw new Error(`Failed to create order items: ${itemsError.message}`);
      }

      // Prepare receipt data for printing
      const itemsToPrint = orderItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.canteen_price
      }));

      const totalAmt = orderItems.reduce((sum, item) => sum + (item.canteen_price * item.quantity), 0);
      const gstAmount = selectedCanteen.is_gst_enabled ? totalAmt * 0.05 : 0;
      const deliveryFee = (orderType === 'delivery' && (selectedCanteen as any).delivery_fee) ? (selectedCanteen as any).delivery_fee : 0;
      const finalTotal = totalAmt + gstAmount + packagingFee + deliveryFee;

      const receiptData: ReceiptData = {
        canteenName: selectedCanteen?.name,
        address: selectedCanteen?.address || undefined,
        phone: selectedCanteen?.phone || undefined,
        orderNumber: generatedOrderNumber,
        serialNumber: serialNumber,
        createdAt: now.toISOString(),
        items: itemsToPrint,
        subtotal: totalAmt,
        gst: gstAmount > 0 ? gstAmount : undefined,
        packagingFee: packagingFee > 0 ? packagingFee : undefined,
        deliveryFee: deliveryFee > 0 ? deliveryFee : undefined,
        total: finalTotal,
        orderType: orderType,
        paymentMethod: paymentStatus
      };

      // Queue print job if Bluetooth is connected
      const bluetoothConnected = await isBluetoothEnabledAndConnected();
      if (bluetoothConnected) {
        console.log('Queuing Print Job (Bluetooth connected):', receiptData);
        await printQueue.addJob(receiptData);
      } else {
        console.log('ℹ️ Bluetooth not connected - skipping print queue');
      }

      // Refresh orders list
      await fetchCurrentOrders();

      // Cleanup form
      const nextSerial = serialNumber + 1;
      setNextOrderNumber(nextSerial.toString());
      setOrderItems([]);
      setPaymentStatus('pending');
      setOrderType('dine-in');
      setOrderNote('');
      onOrderCreated?.();

    } catch (err) {
      console.error('Order Submission Error:', err);
      alert('Error creating order. Please try again. Error: ' + (err instanceof Error ? err.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  // Simple print for initial order creation - only order number
  const printOrderNumberOnly = (orderNumber: number) => {
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${orderNumber}</title>
        <style>
        @page {
          size: 58mm auto;
          margin: 0;
        }
        body { 
          font-family: 'Courier New', monospace; 
          width: 58mm;
          max-width: 58mm;
          margin: 0 auto;
          padding: 8px;
          background: white;
          font-weight: 900;
        }
        .order-number-display {
          text-align: center;
          font-size: 72px;
          font-weight: 900;
          margin: 0;
          padding: 0;
          line-height: 1;
        }
        .credits {
          text-align: center;
          font-size: 10px;
          font-weight: 900;
          margin-top: 5px;
          padding-top: 5px;
          border-top: 1px dashed #000;
        }
        </style>
      </head>
      <body>
        <div class="order-number-display">#${orderNumber}</div>
        <p class="credits">Made with ❤️ by Shahid Mollick & Sohail Belim (batch of 27)</p>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    // Mobile-friendly hidden iframe approach
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(billContent);
      iframeDoc.close();

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print failed:', e);
        }
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    }
  };

  // Detailed print function for order manager (kept for print button in right panel)
  const printBillSilently = (orderNumber: number) => {
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order #${orderNumber}</title>
        <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 58mm auto; margin: 0; }
        @media print {
          body { width: 58mm !important; }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        body { font-family: 'Courier New', Courier, monospace; width: 100%; max-width: 58mm; margin: 0; padding: 4px 8px; background: white; font-size: 14px; line-height: 1.5; font-weight: bold; color: #000; }
        .canteen-name { text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 1px; margin: 2px 0 2px 0; text-transform: uppercase; }
        .address { text-align: center; font-size: 11px; font-weight: bold; margin: 2px 0; line-height: 1.3; }
        .phone { text-align: center; font-size: 12px; font-weight: bold; margin: 2px 0 4px 0; }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 8px; }
        .header p { margin: 3px 0; font-size: 13px; font-weight: bold; }
        .order-number { font-size: 20px; font-weight: bold; margin: 5px 0; }
        .items { margin: 10px 0; min-height: 50px; }
        .item { width: 100%; margin: 5px 0; font-size: 15px; line-height: 1.6; }
        .item-row { display: table; width: 100%; }
        .item-name { display: table-cell; width: 60%; word-wrap: break-word; font-weight: bold; vertical-align: top; }
        .item-qty { display: table-cell; width: 15%; text-align: center; font-weight: bold; vertical-align: top; }
        .item-price { display: table-cell; width: 25%; text-align: right; font-weight: bold; vertical-align: top; }
        .divider { border-top: 2px solid #000; margin: 8px 0; }
        .total-section { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 10px 0; }
        .total { width: 100%; margin: 5px 0; font-size: 18px; }
        .total-row { display: table; width: 100%; }
        .total-label { display: table-cell; font-size: 16px; font-weight: bold; }
        .total-amount { display: table-cell; text-align: right; font-size: 22px; font-weight: bold; }
        .footer { text-align: center; margin-top: 15px; padding-top: 10px; padding-bottom: 10px; border-top: 1px solid #000; page-break-inside: avoid; }
        .footer p { margin: 5px 0; font-size: 12px; font-weight: bold; }
        .footer .thank-you { font-size: 15px; font-weight: bold; margin-bottom: 8px; }
        .footer .credits { font-size: 13px; font-style: italic; margin-top: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="canteen-name">${selectedCanteen?.name?.toUpperCase() || 'CANTEEN'}</div>
        ${selectedCanteen?.address ? `<div class="address">${selectedCanteen.address}</div>` : ''}
        ${selectedCanteen?.phone ? `<div class="phone">Ph: ${selectedCanteen.phone}</div>` : ''}
        <div class="header">
        <p class="order-number">Order #${orderNumber}</p>
        <p>${new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}</p>
        </div>
        <div class="items">
        ${orderItems.map(item => `
          <div class="item">
          <div class="item-row">
          <span class="item-name">${item.name}</span>
          <span class="item-qty">×${item.quantity}</span>
          <span class="item-price">₹${(item.canteen_price * item.quantity).toFixed(2)}</span>
          </div>
          </div>
        `).join('')}
        </div>
        <div class="total-section">
        <div class="total">
          <div class="total-row">
          <span class="total-label">TOTAL:</span>
          <span class="total-amount">₹${total.toFixed(2)}</span>
          </div>
        </div>
        </div>
        <div class="footer">
        <p class="thank-you">Thank You! Visit Again</p>
        <p class="credits">Made with ❤️ by Shahid & Sohail</p>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(billContent);
      iframeDoc.close();

      // Wait for content to fully load before printing
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Print failed:', e);
            alert('Print failed. Please check your printer connection.');
          }
          // Extended timeout for mobile printer processing
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }, 500);
      };
    }
  };

  // Order Management Functions
  // Order Management Functions
  const updateOrderStatus = async (orderId: string, newStatus: 'not_started' | 'cooking' | 'ready' | 'completed' | 'cancelled') => {
    // Debug alert removed
    
    setUpdateLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // console.log('Order updated in DB (OrderBuilder), triggering notification...'); 

      // Trigger push notification to user (non-blocking)
      fetch('/api/orders/notify-status-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, newStatus }),
      })
        .then(async (res) => {
          const text = await res.text();
          // console.log('Notification API response:', res.status, text); 
        })
        .catch((err) => {
           console.error('Failed to send push notification:', err);
        });

      // Refresh orders list immediately
      await fetchCurrentOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdateLoading(false);
    }
  };

  // ... (keeping other functions same if not shown, but assuming I'm replacing the block including the render loop is risky if too large, so I'll target specific chunks)

  /* 
     NOTE: I am splitting this into two ReplaceFileContent calls because the range is too large to do safely in one go 
     if I include the render loop.
     Actually, the tool allows replacing a large chunk.
     Let's verify the StartLine. The alert is at 811. The render loop starts around 1100.
     I should do the alert removal separately to be safe.
  */

  const updatePaymentStatus = async (orderId: string, newPaymentStatus: 'paid' | 'pending') => {
    setUpdateLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: newPaymentStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Refresh orders list immediately
      await fetchCurrentOrders();
    } catch (err) {
      console.error('Error updating payment status:', err);
      alert('Failed to update payment status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteOrder = async (orderId: string, skipConfirm: boolean = false) => {
    if (!skipConfirm && !confirm('Are you sure you want to delete this order?')) return;

    setUpdateLoading(true);
    try {
      const supabase = createClient();
      await supabase.from('order_items').delete().eq('order_id', orderId);
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;

      // Refresh orders list immediately
      await fetchCurrentOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      alert('Failed to delete order');
    } finally {
      setUpdateLoading(false);
    }
  };

  const startEditingOrder = (order: OrderWithItems) => {
    // Clear current order and populate with editing items
    setEditingOrderId(order.id);
    setEditingOrderNumber(order.order_number);
    if (order.order_items) {
      // Transform to OrderItem format for the middle panel
      const items: OrderItem[] = order.order_items.map(item => ({
        menuItemId: item.menu_item_id,
        name: item.menu_items?.name || 'Unknown',
        canteen_price: item.canteen_price,
        quantity: item.quantity
      }));
      setOrderItems(items);
      setEditingItems([...order.order_items]);
    }
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    setEditingOrderNumber(null);
    setEditingItems([]);
    setOrderItems([]);
  };

  const addOrderToKhata = async () => {
    if (!selectedStudent || !selectedOrder || !selectedCanteen) return;

    setAddingToKhata(true);
    try {
      const supabase = createClient();

      const itemsNote = (selectedOrder.order_items || []).map(item =>
        `${item.menu_items?.name || 'Unknown'} x${item.quantity}`
      ).join(', ');

      // Get current student balance
      const { data: studentData, error: studentError } = await supabase
        .from('khata_students')
        .select('prepaid_balance')
        .eq('id', selectedStudent)
        .single();

      if (studentError) throw studentError;

      const currentBalance = Number(studentData?.prepaid_balance || 0);
      const orderAmount = Number(selectedOrder.canteen_amount);
      const newBalance = currentBalance - orderAmount; // Debit reduces balance

      // Insert khata entry with entry_type and balance_after
      const { error } = await supabase.from('khata_entries').insert([{
        student_id: selectedStudent,
        amount: orderAmount,
        entry_type: 'debit',
        note: `Order #${selectedOrder.order_number} - ${itemsNote}`,
        entry_date: new Date().toISOString(),
        balance_after: newBalance,
        canteen_id: selectedCanteen.id,
      }]);

      if (error) throw error;

      // Update student's prepaid balance
      const { error: balanceError } = await supabase
        .from('khata_students')
        .update({ prepaid_balance: newBalance })
        .eq('id', selectedStudent);

      if (balanceError) throw balanceError;

      setKhataDialogOpen(false);
      setSelectedStudent('');
      setSelectedOrder(null);
      alert('Order added to khata successfully!');
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
        canteen_price: menuItem.price,
        menu_items: { name: menuItem.name }
      }]);
    }
  };

  const saveOrderEdit = async (orderId: string) => {
    if (orderItems.length === 0) {
      alert('Order must have at least one item');
      return;
    }

    setUpdateLoading(true);
    try {
      const supabase = createClient();
      const newCanteenTotal = orderItems.reduce((sum, item) => sum + (item.canteen_price * item.quantity), 0);

      await supabase.from('order_items').delete().eq('order_id', orderId);

      const orderItemsData = orderItems.map(item => ({
        order_id: orderId,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.canteen_price,
        canteen_price: item.canteen_price,
      }));

      await supabase.from('order_items').insert(orderItemsData);

      // Calculate canteen_amount with GST if enabled
      const canteenAmount = selectedCanteen?.is_gst_enabled
        ? newCanteenTotal * 1.05
        : newCanteenTotal;

      await supabase.from('orders').update({
        total_amount: newCanteenTotal,
        canteen_amount: canteenAmount
      }).eq('id', orderId);

      setEditingOrderId(null);
      setEditingOrderNumber(null);
      setEditingItems([]);
      setOrderItems([]);
    } catch (err) {
      console.error('Error saving order:', err);
      alert('Failed to save order changes');
    } finally {
      setUpdateLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cooking':
        return <ChefHat className="w-4 h-4 text-red-500" />;
      case 'ready':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Waiting';
      case 'cooking':
        return 'Cooking';
      case 'ready':
        return 'Ready';
      default:
        return status;
    }
  };

  const filteredItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* MOBILE & TABLET VIEW - Active Orders + Bottom Drawer (< 1280px) */}
      <div className="xl:hidden flex flex-col h-[calc(100vh-140px)]">
        {/* Mobile & Tablet Header */}
        <div className="bg-slate-50 dark:bg-[#0a0f1e] border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 py-3 md:py-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-500">Orders Management</h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">Manage and track current orders</p>
          </div>
        </div>

        {/* Active Orders Grid - 1 col on mobile, 2 cols on tablet - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-32">
            {currentOrders.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-400 dark:text-slate-500">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-40" />
                <p className="text-base font-medium">No active orders</p>
                <p className="text-xs mt-2 opacity-70">Start by creating a new order below</p>
              </div>
            ) : (
              currentOrders.map(order => {
                const isEditing = editingOrderId === order.id;
                const isExpanded = expandedOrderId === order.id;
                const displayItems = isEditing ? editingItems : (order.order_items || []);
                const total = isEditing
                  ? editingItems.reduce((sum, item) => sum + ((item.canteen_price || item.price) * item.quantity), 0)
                  : (order.canteen_amount || order.total_amount);

                return (
                  <div
                    key={order.id}
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className={`rounded-xl border-2 transition-all shadow-sm active:shadow-md cursor-pointer ${order.order_type === 'dine-in'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-700/50'
                      : order.order_type === 'takeaway'
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-700/50'
                        : order.order_type === 'delivery'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 dark:border-orange-700/50'
                          : 'bg-slate-50 dark:bg-slate-900/20 border-slate-400 dark:border-slate-700/50'
                      }`}
                  >
                    {/* Header */}
                    <div className="p-3">
                      {/* First Layer - Order Number + Name/Phone + Order Type + Inline Actions */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {/* Left Group: Number & Details */}
                        <div className="flex items-center gap-3">
                          {/* Order Number */}
                          <div className="bg-[#1e293b] text-white dark:bg-white dark:text-slate-900 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-700 dark:border-slate-200">
                             <span className="font-bold text-sm">#{order.serial_number}</span>
                          </div>
                          
                          {/* Name and Phone */}
                          <div className="flex flex-col">
                            {order.user_id && order.users ? (
                              <>
                                <p className="font-bold text-sm text-slate-200 dark:text-slate-800 leading-tight">
                                  {order.users.name || 'Unknown User'}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                  {order.users.phone}
                                </p>
                              </>
                            ) : (
                               <p className="font-bold text-sm text-slate-400 dark:text-slate-500">Guest</p>
                            )}
                          </div>
                        </div>

                        {/* Right Group: Type Badge & Actions */}
                        <div className="flex items-center gap-2">
                           {/* Order Type Badge */}
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

                           {/* Inline Actions */}
                           {!isEditing && !order.user_id && (
                             <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setKhataDialogOpen(true);
                                  }}
                                  disabled={updateLoading}
                                  className="h-7 w-7 p-0 hover:bg-slate-700/50 dark:hover:bg-slate-200/50 text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    startEditingOrder(order);
                                    setDrawerOpen(true);
                                  }}
                                  disabled={updateLoading}
                                  className="h-7 w-7 p-0 hover:bg-slate-700/50 dark:hover:bg-slate-200/50 text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-slate-900 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteOrder(order.id)}
                                  disabled={updateLoading}
                                  className="h-7 w-7 p-0 hover:bg-red-900/40 dark:hover:bg-red-100 hover:text-red-500 dark:hover:text-red-600 text-slate-400 dark:text-slate-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: (isExpanded || isEditing) ? '500px' : '0px' }}>
                        <div className="space-y-1.5 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {displayItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 rounded-lg p-2 shadow-sm">
                              <span className="font-medium flex-1 text-xs text-slate-800 dark:text-slate-200">{item.menu_items?.name || 'Unknown'}</span>
                              <span className="font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">×{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                        {(() => {
                          // Use stored values from order
                          const packagingFee = order.packaging_amount || order.packaging_fee || 0;
                          const deliveryFee = order.delivery_fee || 0;
                          const itemsSubtotal = displayItems.reduce((sum, item) => sum + ((item.canteen_price || 0) * item.quantity), 0);
                          const gstAmount = order.is_gst_enabled ? itemsSubtotal * 0.05 : 0;

                          const hasBreakdown = packagingFee > 0 || gstAmount > 0 || deliveryFee > 0;

                          return hasBreakdown && (order.order_type === 'delivery' || order.order_type === 'takeaway' || order.is_gst_enabled) ? (
                            <>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-xs text-slate-600 dark:text-slate-400">Subtotal:</span>
                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">₹{itemsSubtotal.toFixed(2)}</span>
                              </div>
                              {order.is_gst_enabled && (
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-xs text-slate-600 dark:text-slate-400">GST (5%):</span>
                                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">₹{gstAmount.toFixed(2)}</span>
                                </div>
                              )}
                              {packagingFee > 0 && (order.order_type === 'delivery' || order.order_type === 'takeaway') && (
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-xs text-slate-600 dark:text-slate-400">Packaging Fee:</span>
                                  <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">₹{packagingFee.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-xs text-slate-600 dark:text-slate-400">Total:</span>
                                <span className="font-bold text-lg text-slate-900 dark:text-slate-100">₹{total.toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between items-center">
                              <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">Total:</span>
                              <span className="font-bold text-lg text-slate-900 dark:text-slate-100">₹{total.toFixed(2)}</span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Third Layer - Status Button, Print, and Payment */}
                      {!isEditing && (
                        <div className="mt-3 flex flex-col gap-2">
                          {/* 1. Main Status Action - Full Width */}
                          <div className="w-full">
                             {order.status === 'not_started' && (
                                <Button
                                  onClick={() => updateOrderStatus(order.id, 'cooking')}
                                  disabled={updateLoading}
                                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm h-10"
                                >
                                  <ChefHat className="w-4 h-4 mr-2" />
                                  Start Cooking
                                </Button>
                             )}
                            {order.status === 'cooking' && (
                                <Button
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                  disabled={updateLoading}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm h-10"
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Mark Ready
                                </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                disabled={updateLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm h-10"
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Complete
                              </Button>
                            )}
                          </div>

                          {/* 2. Secondary Actions Grid */}
                          <div className="grid grid-cols-4 gap-2">
                             {/* Bill Button */}
                             <Button
                                onClick={() => printOrder(order)}
                                disabled={updateLoading}
                                variant="outline"
                                className="h-9 px-0 w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                title="Print Bill"
                              >
                                <Printer className="w-4 h-4 mr-1.5" />
                                <span className="text-xs font-semibold">Bill</span>
                              </Button>

                              {/* KOT Button */}
                              <Button
                                onClick={() => printKOTForOrder(order, true)}
                                disabled={updateLoading}
                                variant="outline"
                                className="h-9 px-0 w-full border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400 hover:bg-orange-100"
                                title="Print KOT"
                              >
                                <ChefHat className="w-4 h-4 mr-1.5" />
                                <span className="text-xs font-semibold">KOT</span>
                              </Button>

                              {/* Payment Toggle */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePaymentStatus(order.id, order.payment_status === 'paid' ? 'pending' : 'paid');
                                }}
                                disabled={updateLoading}
                                className={`h-9 px-0 w-full rounded-md font-bold text-[10px] md:text-xs uppercase tracking-wider transition-all border ${
                                  order.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                                }`}
                              >
                                {order.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                              </button>

                              {/* Cancel Button (Conditional) or Placeholder */}
                              {order.status === 'cooking' && order.user_id ? (
                                <Button
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                    disabled={updateLoading}
                                    variant="outline"
                                    className="h-9 px-0 w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50"
                                    title="Cancel Order"
                                  >
                                    <Ban className="w-4 h-4" />
                                </Button>
                              ) : (
                                /* Empty div to keep grid alignment if no cancel button */
                                <div className="hidden"></div>
                              )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Khata Dialog - Shared for all orders */}
        <Dialog open={khataDialogOpen} onOpenChange={(open) => {
          setKhataDialogOpen(open);
          if (open) {
            fetchStudents();
            setStudentSearch('');
          } else {
            setSelectedStudent('');
            setSelectedOrder(null);
            setStudentSearch('');
          }
        }}>
          <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-lg text-red-600 dark:text-red-500">
                {selectedOrder ? `Add Order #${selectedOrder.order_number} to Khata` : 'Add to Khata'}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs">
                {selectedOrder && `Total: ₹${(selectedOrder.canteen_amount || selectedOrder.total_amount || 0).toFixed(2)}`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <div className="space-y-2">
                <Input
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="h-9 text-sm"
                  autoFocus
                />
                {loadingStudents ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="max-h-[250px] overflow-y-auto border rounded-md">
                    {students
                      .filter((student) =>
                        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        student.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((student) => (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudent(student.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-b last:border-b-0 ${selectedStudent === student.id
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium'
                            : ''
                            }`}
                        >
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-slate-500">Roll: {student.roll_number}</div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={addOrderToKhata}
                disabled={!selectedStudent || addingToKhata}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {addingToKhata ? 'Adding...' : 'Add to Khata'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Fixed Bottom CTA Button - Mobile & Tablet */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <div className="fixed bottom-16 left-0 right-0 px-4 md:px-8 py-4 bg-gradient-to-t from-slate-50 dark:from-[#0a0f1e] via-slate-50/95 dark:via-[#0a0f1e]/95 to-transparent pointer-events-none z-40">
              <Button
                className="w-full h-12 md:h-14 bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 text-white font-bold text-sm md:text-base shadow-lg active:scale-[0.98] transition-all pointer-events-auto rounded-xl"
                size="lg"
              >
                <ChefHat className="w-4 h-4 mr-2" />
                Create New Order
                {orderItems.length > 0 && (
                  <span className="ml-2 bg-yellow-400 text-black text-xs font-black rounded-full h-6 min-w-[24px] px-2 flex items-center justify-center">
                    {orderItems.length}
                  </span>
                )}
              </Button>
            </div>
          </DrawerTrigger>
          <DrawerContent className="max-h-[90vh] bg-slate-50 dark:bg-[#0a0f1e]">
            <DrawerHeader className="border-b border-slate-200 dark:border-slate-800 px-4 md:px-8">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-red-600 text-lg md:text-xl font-bold">
                  {editingOrderId ? `Edit Order #${editingOrderNumber}` : `Order #${nextOrderNumber}`}
                </DrawerTitle>
                {total > 0 && (
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    ₹{total.toFixed(2)}
                  </div>
                )}
              </div>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto">
              {/* Menu Items Grid - 2 cols on mobile, 3 cols on tablet */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 p-4 md:p-8">
                {filteredItems.map(item => {
                  const isSelected = orderItems.some(oi => oi.menuItemId === item.id);
                  const selectedItem = orderItems.find(oi => oi.menuItemId === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`h-auto p-3 flex flex-col justify-between gap-3 transition-all rounded-xl relative bg-white dark:bg-slate-900 border ${isSelected
                        ? 'border-red-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800'
                        }`}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-sm leading-tight text-left text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[2.5em]">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">₹{item.price.toFixed(2)}</p>
                      </div>

                      {isSelected ? (
                         <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-lg p-1 border border-red-100 dark:border-red-800/30">
                            <Button 
                              onClick={() => selectedItem?.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, -1)} 
                              size="sm" 
                              variant="ghost" 
                              className={`h-7 w-7 p-0 rounded-md ${selectedItem?.quantity === 1 
                                ? 'hover:bg-red-100 text-red-600 hover:text-red-700 dark:hover:bg-red-900/30' 
                                : 'hover:bg-white dark:hover:bg-slate-800 hover:text-red-600 text-red-700 dark:text-red-400'
                              }`}
                            >
                              {selectedItem?.quantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                            </Button>
                            <span className="font-bold text-sm text-red-700 dark:text-red-400 w-6 text-center">{selectedItem?.quantity}</span>
                            <Button 
                              onClick={() => updateQuantity(item.id, 1)} 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 w-7 p-0 hover:bg-white dark:hover:bg-slate-800 hover:text-red-600 text-red-700 dark:text-red-400 rounded-md"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                         </div>
                      ) : (
                         <Button 
                           onClick={() => addItem(item)} 
                           size="sm"
                           className="w-full h-9 bg-white hover:bg-slate-50 text-red-600 border border-red-200 hover:border-red-300 dark:bg-slate-800 dark:text-red-400 dark:border-slate-700 dark:hover:border-slate-600 font-semibold shadow-sm"
                         >
                           Add
                         </Button>
                      )}
                    </div>
                  );

                })}
              </div>
            </div>
            <DrawerFooter className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pt-4 pb-6 px-4 md:px-8 space-y-3">
              {/* Cart Items as Badges */}
              {orderItems.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-2">
                  {orderItems.map(item => (
                    <div
                      key={item.menuItemId}
                      className="inline-flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-semibold"
                    >
                      <span>{item.name}</span>
                      <span className="text-red-600 dark:text-red-300">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 text-sm rounded-xl pl-10 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {editingOrderId ? (
                  <>
                    <Button
                      onClick={() => {
                        cancelEditing();
                        setDrawerOpen(false);
                      }}
                      variant="outline"
                      className="h-11 text-sm font-semibold rounded-xl border-slate-300 dark:border-slate-700 active:scale-95 transition-transform"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        saveOrderEdit(editingOrderId);
                        setDrawerOpen(false);
                      }}
                      disabled={updateLoading || orderItems.length === 0}
                      className="h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white disabled:opacity-50 active:scale-95 transition-all shadow-lg rounded-xl"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {updateLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setOrderItems([])}
                      disabled={orderItems.length === 0}
                      variant="outline"
                      className="h-11 text-sm font-semibold rounded-xl border-slate-300 dark:border-slate-700 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button
                      onClick={() => {
                        submitOrder();
                        setDrawerOpen(false);
                      }}
                      disabled={loading || orderItems.length === 0}
                      className="h-11 text-sm font-bold bg-red-600 hover:bg-red-700 active:bg-red-800 text-white disabled:opacity-50 active:scale-95 transition-all shadow-lg rounded-xl"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      {loading ? 'Processing...' : 'Add Items'}
                    </Button>
                  </>
                )}
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      {/* DESKTOP VIEW - Three Column Layout (≥ 1280px only) */}
      <div className="hidden xl:flex flex-row gap-6 h-full">
        {/* Left Sidebar - Menu Items */}
        <div className="w-72 flex flex-col border border-slate-200 dark:border-slate-800/50 rounded-lg bg-white dark:bg-[#1e293b] shadow-sm">
          {/* Search */}
          <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700/50">
            <Input
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 text-sm dark:bg-[#0f172a] dark:border-slate-700/50 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Menu Items List */}
          <div className="flex-1 overflow-y-auto p-2">
            {menuItems.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 text-center text-sm py-8">No menu items</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                {filteredItems.map(item => (
                  <Button
                    key={item.id}
                    onClick={() => addItem(item)}
                    variant="outline"
                    className="w-full justify-between h-auto p-2 md:p-3 bg-white dark:bg-[#0f172a] hover:bg-red-600 hover:text-white dark:hover:bg-red-500 transition-colors group dark:border-slate-700/50"
                  >
                    <div className="text-left flex-1">
                      <p className="font-semibold text-xs md:text-sm leading-tight text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 group-hover:text-white">₹{item.price.toFixed(2)}</p>
                    </div>
                    <Plus className="w-3 h-3 md:w-4 md:h-4 ml-1 md:ml-2 shrink-0" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Section - Order Summary */}
        <div className="flex-1 flex flex-col gap-3 md:gap-4 min-h-0">
          <Card className="flex-1 flex flex-col min-w-0 min-h-0 dark:bg-[#1e293b] dark:border-slate-800/50">
            <CardHeader className="pb-2 md:pb-3 border-b border-slate-200 dark:border-slate-700/50 px-3 md:px-6 py-3 md:py-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2 md:gap-3">
                  <CardTitle className="text-lg md:text-2xl text-slate-900 dark:text-white">
                    {editingOrderId ? (
                      <>
                        <span className="text-red-500">Editing</span> #{editingOrderNumber}
                      </>
                    ) : (
                      <>Order #{nextOrderNumber}</>
                    )}
                  </CardTitle>
                  {editingOrderId && (
                    <span className="text-[10px] md:text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full font-semibold">
                      EDIT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Sound Toggle Button */}
                  <button
                    onClick={toggleSound}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold text-xs transition-all ${isSoundEnabled
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-md'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700'
                      }`}
                    title={isSoundEnabled ? 'Sound on - Click to mute' : 'Sound off - Click to enable'}
                  >
                    {isSoundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{isSoundEnabled ? 'Sound On' : 'Sound Off'}</span>
                  </button>
                  <span className="text-xs md:text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-1 rounded-full w-fit">{orderItems.length} items</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-2 md:p-4">
              {orderItems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 py-8">
                  <p className="text-sm md:text-base">Select items to create order</p>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {orderItems.map(item => (
                    <div
                      key={item.menuItemId}
                      className="flex items-center justify-between bg-slate-100 dark:bg-[#0f172a] p-2 md:p-4 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:border-red-500 dark:hover:border-red-500 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs md:text-sm text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">₹{item.canteen_price.toFixed(2)} each</p>
                      </div>

                      <div className="flex items-center gap-1 md:gap-2 ml-2 md:ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0"
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <span className="w-6 md:w-8 text-center font-bold text-xs md:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-1 md:px-2 py-1 rounded">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0"
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(item.menuItemId)}
                          className="h-7 w-7 md:h-8 md:w-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      </div>

                      <div className="text-right ml-2 md:ml-4 font-semibold text-xs md:text-sm min-w-[50px] md:min-w-[70px]">
                        ₹{(item.canteen_price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Footer with Total and Actions */}
            <div className="border-t border-slate-200 dark:border-slate-700/50 p-2 space-y-2 bg-slate-50 dark:bg-slate-900/50 shrink-0">
              {!editingOrderId && (<>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="order-type" className="text-xs text-slate-600 dark:text-slate-400">Order Type</Label>
                    <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                      <SelectTrigger id="order-type" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dine-in">Dine-In</SelectItem>
                        <SelectItem value="takeaway">Takeaway</SelectItem>
                        <SelectItem value="delivery">Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payment-status" className="text-xs text-slate-600 dark:text-slate-400">Payment</Label>
                    <Select value={paymentStatus} onValueChange={(value: any) => setPaymentStatus(value)}>
                      <SelectTrigger id="payment-status" className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                  <div className="mt-2 text-left">
                    <Label htmlFor="order-note" className="text-xs text-slate-600 dark:text-slate-400">Order Note (Optional)</Label>
                    <Input
                      id="order-note"
                      placeholder="e.g. Less spicy, Extra sauce..."
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="h-8 text-xs mt-1 dark:bg-[#0f172a] dark:border-slate-700/50"
                    />
                  </div>
                </>
              )}

              {/* Total Display - Fixed at bottom */}
              <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 rounded-lg p-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs">Subtotal</span>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100">₹{total.toFixed(2)}</span>
                </div>
                {packagingFee > 0 && (
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-slate-600 dark:text-slate-400 text-xs">Packaging Fee</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-100">₹{packagingFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-700/50 pt-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Total</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-500">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {editingOrderId ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => saveOrderEdit(editingOrderId)}
                    disabled={updateLoading || orderItems.length === 0}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold h-9 text-sm"
                    size="lg"
                  >
                    <Save className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    {updateLoading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={cancelEditing}
                    disabled={updateLoading}
                    variant="outline"
                    className="font-semibold h-9 text-sm dark:border-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    onClick={submitOrder}
                    disabled={loading || orderItems.length === 0}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold col-span-2 h-9 text-xs"
                    size="lg"
                  >
                    <Printer className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    {loading ? 'Processing...' : 'Print & Submit'}
                  </Button>
                  <Button
                    onClick={() => setOrderItems([])}
                    variant="outline"
                    className="font-semibold h-9 p-0"
                  >
                    <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Sidebar - Order Management */}
        <div className="w-[26rem] flex flex-col border border-slate-200 dark:border-slate-800/50 rounded-lg bg-white dark:bg-[#1e293b] shadow-lg h-full min-h-0">
          <div className="p-3 md:p-3 lg:p-4 border-b border-slate-200 dark:border-slate-700/50 bg-slate-100 dark:bg-[#0f172a]">
            <h3 className="font-bold text-base md:text-base lg:text-lg text-red-600 dark:text-red-500">Order Management</h3>
            <p className="text-[10px] md:text-[11px] lg:text-xs text-slate-600 dark:text-slate-400">Edit, update status and manage orders</p>
          </div>

          {updateLoading && (
            <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50 px-4 py-2 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-red-700 dark:text-red-400 font-medium">Updating order...</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {currentOrders.length === 0 ? (
              <div className="text-center text-slate-400 dark:text-slate-500 text-sm py-8">
                <p>No active orders</p>
              </div>
            ) : (
              currentOrders.map(order => {
                const isEditing = editingOrderId === order.id;
                const isExpanded = expandedOrderId === order.id;
                const displayItems = isEditing ? editingItems : (order.order_items || []);
                const total = isEditing
                  ? editingItems.reduce((sum, item) => sum + ((item.canteen_price || item.price) * item.quantity), 0)
                  : (order.canteen_amount || order.total_amount);

                return (
                  <div
                    key={order.id}
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                    className={`rounded-lg border-2 text-xs md:text-xs lg:text-sm transition-all cursor-pointer ${order.order_type === 'dine-in'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700/50'
                      : order.order_type === 'takeaway'
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700/50'
                        : order.order_type === 'delivery'
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700/50'
                          : 'bg-slate-50 dark:bg-slate-900/20 border-slate-300 dark:border-slate-700/50'
                      }`}
                  >
                    <div className="p-2 md:p-2 lg:p-3">
                       {/* Header */}
                       <div className="flex items-start justify-between gap-2 mb-2">
                          {/* Left Group */}
                          <div className="flex items-center gap-2">
                             <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-sm">#{order.serial_number}</span>
                             </div>
                             <div className="flex flex-col min-w-0">
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate leading-tight">
                                  {order.users?.name || 'Guest'}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                                  {order.users?.phone}
                                </p>
                             </div>
                          </div>

                          {/* Right Group: Badge + Actions */}
                          <div className="flex items-center gap-1">
                             {order.order_type && (
                                <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-sm whitespace-nowrap ${
                                  order.order_type === 'dine-in' ? 'bg-blue-600' : 
                                  order.order_type === 'takeaway' ? 'bg-purple-600' : 'bg-orange-600'
                                }`}>
                                  {order.order_type === 'dine-in' && <UtensilsCrossed className="w-2.5 h-2.5 mr-1" />}
                                  {order.order_type === 'takeaway' && <Package className="w-2.5 h-2.5 mr-1" />}
                                  {order.order_type === 'delivery' && <Bike className="w-2.5 h-2.5 mr-1" />}
                                  {order.order_type.charAt(0).toUpperCase() + order.order_type.slice(1)}
                                </span>
                             )}

                             {!isEditing && (
                               <div className="flex items-center gap-0.5 ml-0.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setKhataDialogOpen(true);
                                    }}
                                    className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingOrder(order)}
                                    className="h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteOrder(order.id)}
                                    className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-500 text-slate-400 dark:text-slate-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                               </div>
                             )}
                          </div>
                       </div>

                      {/* Items - Show when expanded or currently editing */}
                      {(isExpanded || isEditing) && (
                        <div className="space-y-1 mb-2">
                          {displayItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 rounded p-1.5 text-xs">
                              <span className="font-medium flex-1 text-slate-800 dark:text-slate-200">{item.menu_items?.name || 'Unknown'}</span>
                              <span className="font-bold ml-2">×{item.quantity}</span>
                            </div>
                          ))}
                          {isEditing && (
                            <div className="text-center py-1 text-[10px] text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 rounded">
                              Edit items on left →
                            </div>
                          )}
                        </div>
                      )}

                      {/* Note Section */}
                      {order.note && (
                        <div className="mb-2 px-1">
                           <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedNoteOrder(order);
                              setNoteDialogOpen(true);
                            }}
                            className="group relative cursor-pointer bg-amber-50/50 dark:bg-amber-900/10 rounded-lg p-2 border border-dashed border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700 transition-all"
                          >
                             <div className="flex items-center gap-1.5">
                                <Edit2 className="w-3 h-3 text-amber-500/70 shrink-0" />
                                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider shrink-0">Note:</span>
                                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                                    {order.note}
                                  </p>
                                </div>
                                <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  See More
                                </span>
                             </div>
                          </div>
                        </div>
                      )}

                      {/* Total */}
                      <div className="flex justify-between items-center py-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                         <span className="font-semibold text-xs text-slate-600 dark:text-slate-400">Total:</span>
                         <span className="font-bold text-sm text-slate-900 dark:text-slate-100">₹{total.toFixed(2)}</span>
                      </div>

                      {/* Footer Actions */}
                      {!isEditing && (
                         <div className="mt-2 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                            {/* 1. Main Status Action - Full Width */}
                            <div className="w-full">
                              {order.status === 'not_started' && (
                                  <Button
                                    onClick={() => updateOrderStatus(order.id, 'cooking')}
                                    disabled={updateLoading}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white h-9 text-xs font-bold shadow-sm"
                                    size="sm"
                                  >
                                    <ChefHat className="w-3.5 h-3.5 mr-1.5" />
                                    Start Cooking
                                  </Button>
                                )}
                              {order.status === 'cooking' && (
                                <Button
                                  onClick={() => updateOrderStatus(order.id, 'ready')}
                                  disabled={updateLoading}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-bold shadow-sm"
                                  size="sm"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  Mark Ready
                                </Button>
                              )}
                              {order.status === 'ready' && (
                                <Button
                                  onClick={() => updateOrderStatus(order.id, 'completed')}
                                  disabled={updateLoading}
                                  className="w-full bg-blue-500 hover:bg-blue-600 text-white h-9 text-xs font-bold shadow-sm"
                                  size="sm"
                                >
                                  <Check className="w-3.5 h-3.5 mr-1.5" />
                                  {updateLoading ? 'Updating...' : 'Complete Order'}
                                </Button>
                              )}
                            </div>

                            {/* 2. Secondary Actions Grid */}
                            <div className="grid grid-cols-4 gap-1.5">
                               {/* Bill Button */}
                               <Button
                                  onClick={() => printOrder(order)}
                                  disabled={updateLoading}
                                  variant="outline"
                                  className="h-8 px-0 w-full border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800"
                                  size="sm"
                                  title="Print Bill"
                                >
                                  <Printer className="w-3.5 h-3.5 mr-1" />
                                  Bill
                                </Button>

                                {/* KOT Button */}
                                <Button
                                  onClick={() => printKOTForOrder(order, true)}
                                  disabled={updateLoading}
                                  variant="outline"
                                  className="h-8 px-0 w-full border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                  size="sm"
                                  title="Print KOT"
                                >
                                  <ChefHat className="w-3.5 h-3.5 mr-1" />
                                  KOT
                                </Button>

                                {/* Payment Button */}
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updatePaymentStatus(order.id, order.payment_status === 'paid' ? 'pending' : 'paid');
                                  }}
                                  disabled={updateLoading}
                                  variant={order.payment_status === 'paid' ? 'default' : 'outline'}
                                  className={`h-8 px-0 w-full font-bold text-[10px] border ${
                                    order.payment_status === 'paid'
                                      ? 'bg-green-600 hover:bg-green-700 border-transparent text-white'
                                      : 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                  }`}
                                  size="sm"
                                >
                                  {order.payment_status === 'paid' ? 'PAID' : 'UNPAID'}
                                </Button>

                                {/* Cancel Button (Conditional) */}
                                {order.status === 'cooking' && order.user_id ? (
                                   <Button
                                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                      disabled={updateLoading}
                                      variant="outline"
                                      className="h-8 px-0 w-full border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-slate-800"
                                      size="sm"
                                      title="Cancel Order"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </Button>
                                ) : (
                                  /* Empty div for grid alignment */
                                  <div className="hidden"></div>
                                )}
                            </div>
                         </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Khata Dialog - Shared for all desktop orders */}
          <Dialog open={khataDialogOpen} onOpenChange={(open) => {
            setKhataDialogOpen(open);
            if (open) {
              fetchStudents();
              setStudentSearch('');
            } else {
              setSelectedStudent('');
              setSelectedOrder(null);
              setStudentSearch('');
            }
          }}>
            <DialogContent className="sm:max-w-[500px] dark:bg-[#1e293b] dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-lg text-red-600 dark:text-red-500">
                  {selectedOrder ? `Add Order #${selectedOrder.order_number} to Khata` : 'Add to Khata'}
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 text-xs">
                  {selectedOrder && `Total: ₹${(selectedOrder.canteen_amount || selectedOrder.total_amount || 0).toFixed(2)}`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-3">
                <div className="space-y-2">
                  <Input
                    placeholder="Search students by name or roll number..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="h-9 text-sm dark:bg-[#0f172a] dark:border-slate-700/50"
                    autoFocus
                  />
                  {loadingStudents ? (
                    <div className="space-y-2 py-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700/50 rounded-md">
                      {students
                        .filter((student) =>
                          student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          student.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                        .map((student) => (
                          <button
                            key={student.id}
                            onClick={() => setSelectedStudent(student.id)}
                            className={`w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-b-0 ${selectedStudent === student.id
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium'
                              : 'text-slate-900 dark:text-slate-100'
                              }`}
                          >
                            <div className="font-medium">{student.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Roll: {student.roll_number}</div>
                          </button>
                        ))}
                      {students.filter((student) =>
                        student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                        student.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
                      ).length === 0 && (
                          <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            No students found
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKhataDialogOpen(false);
                    setSelectedStudent('');
                    setSelectedOrder(null);
                  }}
                  disabled={addingToKhata}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={addOrderToKhata}
                  disabled={!selectedStudent || addingToKhata}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white h-8 text-xs"
                >
                  {addingToKhata ? 'Adding...' : 'Add to Khata'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                Instructions for Order #{selectedNoteOrder?.order_number}
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
    </>
  );
}
