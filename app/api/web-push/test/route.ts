import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

// Configure VAPID (same as lib/push-notification.ts)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@zlice.app',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Get all subscriptions (or just for current user if we had that link)
    // Theoretically, for "New Order", we notify ALL canteen staff.
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription');

    if (error || !subscriptions) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions', details: error }, { status: 500 });
    }

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No subscriptions found. Please enable sound/notifications again.',
        sent: 0 
      });
    }

    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test notification from the Kitchen App!',
      url: '/orders/manage'
    });

    let sentCount = 0;
    const errors: any[] = [];

    await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription as any, payload);
        sentCount++;
      } catch (err: any) {
        errors.push({ id: sub.id, error: err.message });
        if (err.statusCode === 410 || err.statusCode === 404) {
           await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }));

    return NextResponse.json({ 
      success: true, 
      sent: sentCount, 
      total: subscriptions.length, 
      errors 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
  }
}
