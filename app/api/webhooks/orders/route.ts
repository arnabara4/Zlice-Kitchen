import { NextRequest, NextResponse } from 'next/server';
import { sendOrderNotification } from '@/lib/push-notification';

export async function POST(request: NextRequest) {
  try {
    let payload;
    try {
      payload = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('[Webhook] Received order notification:', JSON.stringify(payload, null, 2));

    let order = null;

    // Case 1: Supabase Database Webhook (INSERT payload)
    if (payload.type === 'INSERT' && payload.table === 'orders' && payload.record) {
      console.log('[Webhook] Detected Supabase Webhook payload');
      order = payload.record;
    }
    // Case 2: Direct API call from Super-app (Payload is the order object)
    else if (payload.id && payload.order_number) {
       console.log('[Webhook] Detected direct API call payload');
       order = payload;
    }

    if (order) {
       await sendOrderNotification(order);
       return NextResponse.json({ success: true, message: 'Notification sent' });
    }
    
    return NextResponse.json({ message: 'Ignored: Not an order insert or invalid format' });
  } catch (error: any) {
     console.error('[Webhook] Error processing webhook:', error);
     return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
