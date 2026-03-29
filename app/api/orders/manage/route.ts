import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');

    if (!canteenId) {
      return NextResponse.json({ error: 'Missing canteen ID' }, { status: 400 });
    }

    // Validate authentication and authorization
    const { session, error } = await validateAuthSessionWithRole('canteen');
    if (error) return error;

    // Verify canteen access
    if (session?.canteen_id !== canteenId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        serial_number,
        status,
        payment_status,
        total_amount,
        created_at,
        note,
        order_type,
        delivery_fee,
        packaging_fee,
        gst_amount_total,
        users (
          name,
          phone
        ),
        order_items (
          menu_item_id,
          quantity,
          price,
          menu_items (name)
        ),
        coupon:coupon_id (
            code,
            type,
            rewards
        )
      `)
      .eq('canteen_id', canteenId)
      .in('status', ['not_started', 'started', 'cooking', 'ready'])
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;
    
    const transformedData = (data || []).map((order: any) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        menu_items: Array.isArray(item.menu_items) ? item.menu_items[0] : (item.menu_items || { name: 'Unknown' })
      })),
      coupon: Array.isArray(order.coupon) ? order.coupon[0] : order.coupon
    }));

    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('Orders manage API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
