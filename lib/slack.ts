
import { createClient } from '@/lib/supabase/server';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackOrderNotification {
  canteenName: string;
  orderType: string;
  orderId: string; // The UUID or order number
  orderNumber: string; // The visible order number usually (e.g. #1023)
  customerName: string;
  deliveryAddress?: string;
  itemsSummary: string;
  totalAmount: number;
}

export async function sendSlackOrderNotification(order: any) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('SLACK_WEBHOOK_URL is not set. Skipping Slack notification.');
    return;
  }

  // Extract details
  // Extract details
  const canteenName = order.canteen_name || 'Unknown Kitchen';
  const orderType = order.order_type || 'Unknown';
  const orderId = order.id;
  const orderNumber = order.order_number || 'N/A';
  const customerName = order.users?.name || 'Guest';
  const deliveryAddress = order.user_addresses?.address || 'N/A';
  
  // Format items summary correctly
  const itemsSummary = order.order_items && order.order_items.length > 0 
    ? order.order_items.map((item: any) => 
        // Handle nested menu_items structure or direct name property
        `${item.quantity}x ${item.menu_items?.name || item.name || 'Unknown Item'}`
      ).join(', ')
    : 'No items';
    
  const totalAmount = order.canteen_amount || order.total_amount || 0;

  // Construct Slack message payload
  const payload = {
    text: `New Order Received: ${orderNumber}`, // Fallback text
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🔔 Order from ${canteenName} by ${customerName} - #${orderNumber}`,
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Canteen:*\n${canteenName}`
          },
          {
            type: "mrkdwn",
            text: `*Type:*\n${orderType.toUpperCase()}`
          }
        ]
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Customer:*\n${customerName}`
          },
          {
            type: "mrkdwn",
            text: `*Order ID:*\n\`${orderId}\``
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Items:*\n${itemsSummary}`
        }
      },
       {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Total Amount:*\n₹${totalAmount}`
          }
        ]
      }
    ]
  };

  // Add address if delivery
  if (orderType === 'delivery') {
    (payload.blocks as any).push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Delivery Address:*\n${deliveryAddress}`
      }
    });
  }

  // Add Actions (Optional - link to dashboard)
  (payload.blocks as any).push({
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "View Order",
                        emoji: true
                    },
                    url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
                }
            ]
        });

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`Failed to send Slack notification: ${response.status} ${text}`);
    } else {
      console.log('✅ Slack notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
  }
}
