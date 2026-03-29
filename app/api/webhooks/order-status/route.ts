import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotificationToDelivery } from '@/lib/push-notification';

/**
 * Webhook endpoint to trigger delivery notifications when order status changes
 * This is called when an order reaches "cooking" status
 */
export async function POST(request: NextRequest) {
  try {
    const order = await request.json();
    
    console.log('[Order Status Webhook] Received order:', {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      order_type: order.order_type,
    });

    // Only send notifications for delivery orders that reach cooking status
    if (order.status === 'cooking' && order.order_type === 'delivery') {
      console.log('[Order Status Webhook] Sending delivery notification for order', order.order_number);
      
      await sendOrderNotificationToDelivery(order);
      
      console.log('[Order Status Webhook] Notification sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Delivery notification sent' 
      });
    }

    // Not a delivery order or not cooking status - skip notification
    return NextResponse.json({ 
      success: true, 
      message: 'No notification needed',
      reason: order.order_type !== 'delivery' 
        ? 'Not a delivery order' 
        : 'Status not cooking'
    });

  } catch (error) {
    console.error('[Order Status Webhook] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
