import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOrderNotification, sendOrderNotificationToDelivery } from '@/lib/push-notification';
import { validateAuthSession } from '@/lib/api-auth';

/**
 * Webhook endpoint called when order status changes
 * Sends notifications to:
 * 1. Customer (for all status changes)
 * 2. Delivery personnel (when order reaches "cooking" status for delivery orders)
 */
export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await validateAuthSession();
    if (authError) return authError;

    const { orderId, newStatus } = await request.json();

    // Validate input
    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: 'Missing orderId or newStatus' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch full order details with canteen info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id, 
        order_number, 
        user_id, 
        status, 
        total_amount, 
        canteen_id,
        order_type,
        canteens (
          name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log(`[Push Notification] Order #${order.order_number} status changed to: ${newStatus}`);

    // Send notification to customer using the new function
    // sendOrderNotification handles delivery notification internally if status is cooking
    try {
      await sendOrderNotification({
        ...order,
        status: newStatus 
      });
      console.log('✅ Notifications processed via central dispatcher');
    } catch (error) {
      console.error('⚠️ Error sending notifications:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications sent'
    });

  } catch (error: any) {
    console.error('Error in notify-status-change API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
