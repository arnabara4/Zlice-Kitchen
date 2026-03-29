import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

// Configure VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@canteen-app.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * User types for push notifications
 */
type UserType = 'canteen' | 'delivery' | 'admin';

/**
 * Push subscription record structure
 */
interface PushSubscriptionRecord {
  id: string;
  subscription: webpush.PushSubscription;
  [key: string]: any; // For dynamic ID columns (canteen_id, delivery_man_id, etc.)
}

/**
 * Send push notification to specific user types
 * @param userType - Type of users to notify ('canteen', 'delivery', or 'admin')
 * @param targetIds - Optional array of specific user IDs to notify. If omitted, sends to all users of that type
 * @param notificationData - The notification payload
 */
export async function sendPushNotification(
  userType: UserType,
  notificationData: {
    title: string;
    body: string;
    url?: string;
    data?: any;
  },
  targetIds?: string[]
) {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not set. Push notification skipped.');
    return;
  }

  try {
    const supabase = await createClient();

    // Determine which table to query based on user type
    let tableName: string;
    let idColumn: string;

    switch (userType) {
      case 'canteen':
        tableName = 'canteen_push_subscriptions';
        idColumn = 'canteen_id';
        break;
      case 'delivery':
        tableName = 'delivery_push_subscriptions';
        idColumn = 'delivery_man_id';
        break;
      case 'admin':
        tableName = 'admin_push_subscriptions';
        idColumn = 'admin_identifier';
        break;
      default:
        console.error('Invalid user type:', userType);
        return;
    }

    // Build query
    let query = supabase.from(tableName).select('id, subscription, ' + idColumn);

    // Filter by specific IDs if provided
    if (targetIds && targetIds.length > 0) {
      query = query.in(idColumn, targetIds);
    }

    const { data: subscriptions, error } = await query;

    if (error || !subscriptions) {
      console.error('Error fetching subscriptions:', error);
      return;
    }

    // Type cast to our subscription record structure
    const typedSubscriptions = subscriptions as unknown as PushSubscriptionRecord[];

    if (typedSubscriptions.length === 0) {
      console.log(`No subscriptions found for ${userType}`);
      return;
    }

    const notificationPayload = JSON.stringify({
      title: notificationData.title,
      body: notificationData.body,
      url: notificationData.url || '/',
      orderNumber: notificationData.data?.orderNumber, // Promoted to top level for SW
      orderId: notificationData.data?.orderId,         // Promoted to top level for SW
      type: userType,                                  // Include role/type
      data: notificationData.data || {},
    });

    // Send to all subscribers
    const promises = typedSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          sub.subscription as webpush.PushSubscription,
          notificationPayload
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription expired or invalid - delete it
          console.log(`Deleting expired subscription: ${sub.id}`);
          await supabase.from(tableName).delete().eq('id', sub.id);
        }
        console.error(`Error sending push to ${sub.id}:`, err);
      }
    });

    await Promise.all(promises);
    console.log(`Push notifications sent to ${promises.length} ${userType} devices.`);
  } catch (err) {
    console.error('Error in sendPushNotification:', err);
  }
}

/**
 * Send order notification to canteen owner(s)
 * @param order - Order object
 */
export async function sendOrderNotificationToCanteen(order: any) {
  const canteenId = order.canteen_id;
  
  // GUARD: Only new orders allowed
  const isNewOrder = !order.status || order.status === 'not_started' || order.status === 'pending';
  if (!isNewOrder) {
     console.error(`[Guard] Blocked CANTEEN notification. Status '${order.status}' is not NEW.`);
     return;
  }
  
  if (!canteenId) {
    console.error('No canteen_id in order');
    return;
  }
  
  console.log(`NOTIFICATION_SENT type=NEW_ORDER target=CANTEEN orderId=${order.id}`);

  await sendPushNotification(
    'canteen',
    {
      title: `New Order #${order.order_number}`,
      body: `₹${order.total_amount} - ${order.order_type || 'Order'}`,
      url: '/orders/take',
      data: { 
        orderId: order.id, 
        orderNumber: order.order_number,
        sound: 'new-order' // Trigger notification sound
      },
    },
    [canteenId] // Only notify the specific canteen
  );
}

/**
 * Send order notification to delivery personnel
 * @param order - Order object
 * @param deliveryManId - Optional specific delivery person ID. If omitted, sends to all delivery personnel
 */
export async function sendOrderNotificationToDelivery(order: any, deliveryManId?: string) {
  // GUARD: Strict role isolation
  if (order.status !== 'completed') {
    console.error(`[Guard] Blocked DELIVERY notification. Status '${order.status}' is not 'completed'.`);
    return;
  }

  if (order.order_type !== 'delivery') {
    console.error(`[Guard] Blocked DELIVERY notification. Type '${order.order_type}' is not 'delivery'.`);
    return;
  }

  let targetIds: string[] | undefined = deliveryManId ? [deliveryManId] : undefined;

  // If broadcasting to all (no specific deliveryManId), filter by Canteen
  if (!deliveryManId) {
    try {
      if (!order.canteen_id) {
         console.warn('[Push] Cannot filter delivery by kitchen: Order missing canteen_id');
         // Fallback to undefined (all) or return? Safer to return or log error to prevent leak.
         return; 
      }

      const supabase = await createClient();
      const { data: eligibleRiders, error } = await supabase
        .from('delivery_man_canteens')
        .select('delivery_man_id')
        .eq('canteen_id', order.canteen_id);

      if (error) {
        console.error('[Push] Error fetching eligible riders:', error);
        return;
      }

      if (eligibleRiders && eligibleRiders.length > 0) {
        targetIds = eligibleRiders.map(row => row.delivery_man_id);
        console.log(`[Push] Targeted broadcast to ${targetIds.length} riders for Canteen ${order.canteen_id}`);
      } else {
        console.log(`[Push] No riders linked to Canteen ${order.canteen_id}. Skipping notification.`);
        return;
      }
    } catch (err) {
      console.error('[Push] Failed to resolve kitchen riders:', err);
      return;
    }
  }

  console.log(`NOTIFICATION_SENT type=COOKING target=DELIVERY_ONLY orderId=${order.id} recipient_count=${targetIds?.length || 'ALL'}`);

  await sendPushNotification(
    'delivery',
    {
      title: `New Delivery Order #${order.order_number}`,
      body: `Pickup from ${order.canteen_name || 'Restaurant'} - ₹${order.total_amount}`,
      url: '/delivery/orders',
      data: { orderId: order.id, orderNumber: order.order_number },
    },
    targetIds 
  );
}

/**
 * Send notification to admin(s)
 * @param notification - Notification data
 */
export async function sendNotificationToAdmin(notification: {
  title: string;
  body: string;
  url?: string;
  data?: any;
}) {
  await sendPushNotification('admin', notification);
}

/**
 * Send order status update notification
 * @param order - Order object
 * @param status - New status
 */
export async function sendOrderStatusNotification(order: any, status: string) {
  const statusMessages: Record<string, string> = {
    confirmed: 'Your order has been confirmed',
    started: 'Your order is being prepared',
    preparing: 'Your order is being prepared',
    ready: 'Your order is ready for pickup',
    out_for_delivery: 'Your order is out for delivery',
    delivered: 'Your order has been delivered',
    cancelled: 'Your order has been cancelled',
  };

  const message = statusMessages[status] || `Order status: ${status}`;

  // If order has delivery person assigned, notify them
  if (order.delivery_man_id && ['confirmed', 'ready', 'out_for_delivery'].includes(status)) {
    await sendPushNotification(
      'delivery',
      {
        title: `Order #${order.order_number} - ${status}`,
        body: message,
        url: '/delivery/orders',
        data: { orderId: order.id, status },
      },
      [order.delivery_man_id]
    );
  }
}

/**
 * Main notification dispatcher for new orders (called by webhook)
 * Sends notifications to appropriate recipients with sound support
 * @param order - Order object from webhook
 */
export async function sendOrderNotification(order: any) {
  console.log(`[Push] Processing order notification for order #${order.order_number}`);

  // Fetch canteen name if not present (crucial for delivery notifications)
  let orderWithCanteen = { ...order };
  
  if (!orderWithCanteen.canteen_name && orderWithCanteen.canteen_id) {
    try {
      const supabase = await createClient();
      const { data: canteen } = await supabase
        .from('canteens')
        .select('name')
        .eq('id', orderWithCanteen.canteen_id)
        .single();
        
      if (canteen) {
        orderWithCanteen.canteen_name = canteen.name;
        console.log(`[Push] Fetched canteen name: ${canteen.name}`);
      }
    } catch (err) {
      console.error('[Push] Failed to fetch kitchen name:', err);
    }
  }

  // Only notify the canteen owner if it's a NEW order (not a status update)
  // We assume 'not_started', 'pending' or undefined status implies a new order
  const isNewOrder = !orderWithCanteen.status || orderWithCanteen.status === 'not_started' || orderWithCanteen.status === 'pending';
  
  if (isNewOrder) {
    console.log(`[Push] New order detected (${orderWithCanteen.status || 'undefined'}), notifying canteen.`);
    
    // 1. Send Push Notification (Keep original logic intact)
    await sendOrderNotificationToCanteen(orderWithCanteen);

    // 2. Send Slack Notification (New - Independent Fetching)
    // We fetch full details specifically for Slack to avoid altering the original push flow object
    (async () => {
      try {
        const supabase = await createClient();
        const { data: fullOrderData, error } = await supabase
          .from('orders')
          .select(`
            *,
            users (name, phone),
            user_addresses (address),
            canteens (name),
            order_items (
              quantity,
              menu_items (name)
            )
          `)
          .eq('id', order.id)
          .single();

        if (fullOrderData && !error) {
           // FILTER: Only send Slack notification if order is from a registered app user
           if (fullOrderData.users) {
               // Normalize for Slack helper
               if (fullOrderData.canteens?.name) {
                 (fullOrderData as any).canteen_name = fullOrderData.canteens.name;
               }
               const { sendSlackOrderNotification } = await import('@/lib/slack');
               await sendSlackOrderNotification(fullOrderData);
           } else {
               console.log('[Push] Skipping Slack notification: Order has no linked app user');
           }
        }
      } catch (slackErr) {
        console.error('[Push] Failed to send Slack notification:', slackErr);
      }
    })();

  } else {
     console.log(`[Push] Status is '${orderWithCanteen.status}', skipping CANTEEN notification (only sent for new orders)`);
  }

  // Only notify delivery personnel if the status is exactly 'completed' AND it's a delivery order
  if (orderWithCanteen.status === 'completed' && orderWithCanteen.order_type === 'delivery') {
    console.log(`[Push] Status is '${orderWithCanteen.status}' & Type is 'delivery', notifying delivery person: ${orderWithCanteen.delivery_man_id}`);
    await sendOrderNotificationToDelivery(orderWithCanteen, orderWithCanteen.delivery_man_id);
  } else {
    console.log(`[Push] Skipping delivery (Status: '${orderWithCanteen.status}', Type: '${orderWithCanteen.order_type}')`);
  }
  
  console.log(`[Push] Order notifications processed`);
}
