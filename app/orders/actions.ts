'use server';

import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getActiveOrders(canteenId: string) {
  try {
    const { data: orders, error } = await supabaseAdmin
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
        order_mode,
        scheduled_date,
        scheduled_category_id,
        schedule_id,
        note,
        address_id,
        users (id, phone, name, roll_number),
        user_addresses (id, address, label, phone),
        order_items (
          menu_item_id,
          quantity,
          price,
          canteen_price,
          menu_items (name, description)
        )
      `)
      .eq('canteen_id', canteenId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching active orders:', error);
      return [];
    }

    // Transform data to match UI expectations
    return orders.map((order: any) => ({
      ...order,
      order_items: order.order_items.map((item: any) => {
        // Handle menu_items which could be: array, object, or null/undefined
        let menuItemData = { name: 'Unknown' };
        if (Array.isArray(item.menu_items) && item.menu_items.length > 0) {
          menuItemData = item.menu_items[0];
        } else if (item.menu_items && typeof item.menu_items === 'object' && item.menu_items.name) {
          menuItemData = item.menu_items;
        }
        
        return {
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price,
          canteen_price: item.canteen_price,
          menu_items: menuItemData
        };
      })
    }));
  } catch (error) {
    console.error('Unexpected error in getActiveOrders:', error);
    return [];
  }
}

export async function getMenuItems(canteenId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('canteen_id', canteenId)
    .eq('is_available', true)
    .order('name');
    
  if (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
  return data;
}

export async function getKhataStudents(canteenId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('khata_students')
    .select('*')
    .eq('canteen_id', canteenId)
    .order('name');

  if (error) {
    console.error('Error fetching khata students:', error);
    return [];
  }
  return data;
}

export async function getSchedules(canteenId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('canteen_id', canteenId)
    .order('name');

  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
  return data;
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update status');
  }

  revalidatePath('/orders/take');
  return { success: true };
}

export async function createNewOrder(
  canteenId: string, 
  orderData: {
    items: any[], 
    paymentStatus: string, 
    orderType: string, 
    note: string,
    packagingFee: number,
    grandTotal: number,
    gstEnabled: boolean
}) {
  const supabase = await createClient();
  const now = new Date(); // Use server time if possible, but JS Date is ok here

  // 1. Generate Serial Number
  const todayStartGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayEndGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  console.log("hi IAM DEBUGGING")

  console.log(orderData)

  const { data: latestOrder } = await supabase
    .from('orders')
    .select('serial_number')
    .eq('canteen_id', canteenId)
    .gte('created_at', todayStartGMT.toISOString())
    .lte('created_at', todayEndGMT.toISOString())
    .order('serial_number', { ascending: false })
    .limit(1)
    .single();

  const serialNumber = latestOrder ? latestOrder.serial_number + 1 : 1;
  const orderId = crypto.randomUUID();

  // 2. Generate Order Number
  let orderNumber = serialNumber.toString();

  // 3. Prepare Items
  const { items, paymentStatus, orderType, note, packagingFee, grandTotal, gstEnabled } = orderData;
  
  // Calculate amounts (double check server side ideally, but trusting client for now with basic checks)
  const total = items.reduce((sum: number, item: any) => sum + (item.canteen_price * item.quantity), 0);
  const canteenAmount = gstEnabled ? (total * 1.05 + packagingFee) : grandTotal; // Logic copied from client

  // 4. Insert Order
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      id: orderId,
      order_number: orderNumber,
      serial_number: serialNumber,
      status: 'not_started',
      payment_status: paymentStatus,
      order_type: orderType,
      total_amount: grandTotal,
      canteen_amount: canteenAmount,
      packaging_fee: packagingFee,
      packaging_amount: packagingFee,
      is_gst_enabled: gstEnabled,
      canteen_id: canteenId,
      note: note,
      created_at: now.toISOString(),
    });

  if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

  // 5. Insert Items
  const itemsForDB = items.map((item: any) => ({
    order_id: orderId,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    price: item.canteen_price,
    canteen_price: item.canteen_price,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemsForDB);

  if (itemsError) throw new Error(`Failed to create order items: ${itemsError.message}`);

  revalidatePath('/orders/take');
  
  return { 
    success: true, 
    orderId, 
    orderNumber, 
    serialNumber, 
    createdAt: now.toISOString() 
  };
}
