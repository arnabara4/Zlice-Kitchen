import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';
import { getCanteenDayBounds } from '@/lib/financial-utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');
    const date = searchParams.get('date');

    if (!canteenId || !date) {
      return NextResponse.json({ error: 'Missing canteenId or date' }, { status: 400 });
    }

    // Validate authentication with canteen role
    const { session, error } = await validateAuthSessionWithRole('canteen');
    if (error) return error;

    // Verify canteen access
    if (session?.canteen_id !== canteenId) {
      return NextResponse.json({ error: 'Forbidden: Canteen mismatch' }, { status: 403 });
    }

    const { start: startOfDay, end: endOfDay } = getCanteenDayBounds(date);

    const { data, error: queryError } = await supabaseAdmin
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
        delivery_fee,
        order_type,
        delivery_man_id,
        delivery_status,
        created_at,
        user_id,
        users (
          id,
          phone,
          name,
          roll_number
        ),
        user_addresses (
          address,
          phone
        ),
        delivery_man (
          id,
          name,
          phone
        ),
        order_items (
          menu_item_id,
          quantity,
          price,
          canteen_price,
          menu_items (name)
        )
      `)
      .eq('canteen_id', canteenId)
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString())
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;

    const transformedData = (data || []).map((order: any) => ({
      ...order,
      order_items: (order.order_items || []).map((item: any) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.price,
        canteen_price: item.canteen_price,
        menu_items: Array.isArray(item.menu_items)
          ? (item.menu_items[0] || { name: 'Unknown' })
          : (item.menu_items || { name: 'Unknown' })
      }))
    }));

    return NextResponse.json(transformedData);

  } catch (error: any) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
