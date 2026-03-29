import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get('canteenId');

    if (!canteenId) {
       return NextResponse.json({ error: 'Canteen ID required' }, { status: 400 });
    }

    // Validate authentication and authorization
    const { session, error } = await validateAuthSessionWithRole('canteen');
    if (error) return error;

    // Verify canteen access
    if (session?.canteen_id !== canteenId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const todayStartGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEndGMT = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const { data: latestOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('serial_number')
      .eq('canteen_id', canteenId)
      .gte('created_at', todayStartGMT.toISOString())
      .lte('created_at', todayEndGMT.toISOString())
      .order('serial_number', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows returned" error
      throw fetchError;
    }

    return NextResponse.json({ serialNumber: latestOrder?.serial_number || 0 });

  } catch (error: any) {
    console.error('Latest order API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
