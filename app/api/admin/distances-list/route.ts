import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Auth check (super admin only)
    const authToken = request.cookies.get('auth_token')?.value;
    const userType = request.cookies.get('user_type')?.value;
    if (!authToken || userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('distances')
      .select('id, address_slug_1, address_slug_2, distance_meters')
      .order('id', { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching distances:', error);
    return NextResponse.json({ error: 'Failed to fetch distances' }, { status: 500 });
  }
}
