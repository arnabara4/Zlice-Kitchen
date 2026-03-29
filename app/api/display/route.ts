import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { session, error } = await validateAuthSessionWithRole('canteen');
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');

    if (!canteenId || session?.canteen_id !== canteenId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch canteen config
    const { data: canteen, error: canteenError } = await supabaseAdmin
      .from('canteens')
      .select('id, name, logo_url, slideshow_enabled, slideshow_interval, slideshow_items, orders_display_interval, orders_display_duration')
      .eq('id', canteenId)
      .eq('is_active', true)
      .single();

    if (canteenError) throw canteenError;

    // 2. Fetch active orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        created_at,
        order_items (
          menu_item_id,
          quantity,
          price,
          menu_items (name)
        )
      `)
      .eq('canteen_id', canteenId)
      .in('status', ['not_started', 'cooking', 'ready'])
      .order('created_at', { ascending: true });

    if (ordersError) throw ordersError;

    // 3. Transform data to match existing frontend shape
    const transformedOrders = (orders || []).map((order: any) => ({
      ...order,
      order_items: order.order_items.map((item: any) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        menu_items: Array.isArray(item.menu_items) ? item.menu_items[0] : (item.menu_items || { name: 'Unknown' })
      }))
    }));

    return NextResponse.json({
        canteen,
        orders: transformedOrders
    });

  } catch (error: any) {
    console.error('Display API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
