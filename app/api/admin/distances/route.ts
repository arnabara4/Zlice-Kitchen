import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ORS_API_URL = 'https://api.openrouteservice.org/v2/directions/driving-car';
const ORS_API_KEY = process.env.ORS_API_KEY || 'NULL';

export async function POST(request: NextRequest) {
  try {
    // Auth check (super admin only)
    const authToken = request.cookies.get('auth_token')?.value;
    const userType = request.cookies.get('user_type')?.value;
    if (!authToken || userType !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const supabase = await createClient();
    // Fetch up to 20 distances needing calculation
    const { data: distances, error } = await supabase
      .from('distances')
      .select('id, address_slug_1, address_slug_2, distance_meters')
      .lte('distance_meters', 0)
      .limit(20);
    if (error) throw error;
    if (!distances || distances.length === 0) {
      return NextResponse.json({ message: 'No distances to update.' });
    }

    // Get coordinates for all involved slugs
    const slugs = Array.from(new Set(distances.flatMap(d => [d.address_slug_1, d.address_slug_2])));
    const { data: addresses, error: addrError } = await supabase
      .from('addresses')
      .select('address_slug, latitude, longitude')
      .in('address_slug', slugs);
    if (addrError) throw addrError;
    const coordMap = Object.fromEntries(addresses.map(a => [a.address_slug, a]));

    // Prepare API calls
    const results = await Promise.all(distances.map(async (d) => {
      const a1 = coordMap[d.address_slug_1];
      const a2 = coordMap[d.address_slug_2];
      if (!a1 || !a2 || !a1.latitude || !a1.longitude || !a2.latitude || !a2.longitude) {
        return { id: d.id, error: 'Missing coordinates' };
      }
      try {
        const res = await fetch(ORS_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': ORS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [parseFloat(a1.longitude), parseFloat(a1.latitude)],
              [parseFloat(a2.longitude), parseFloat(a2.latitude)]
            ]
          })
        });
        if (!res.ok) throw new Error('ORS API error');
        const data = await res.json();
        const meters = data?.routes?.[0]?.summary?.distance;
        if (!meters) throw new Error('No distance in response');
        // Update in DB
        await supabase.from('distances').update({ distance_meters: meters }).eq('id', d.id);
        return { id: d.id, distance_meters: meters };
      } catch (err: any) {
        return { id: d.id, error: err?.message || 'Unknown error' };
      }
    }));

    return NextResponse.json({ updated: results });
  } catch (error) {
    console.error('Error updating distances:', error);
    return NextResponse.json({ error: 'Failed to update distances' }, { status: 500 });
  }
}
