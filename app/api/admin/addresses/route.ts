import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated as super admin
    const authToken = request.cookies.get('auth_token')?.value;
    const userType = request.cookies.get('user_type')?.value;

    if (!authToken || userType !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    
    // Get all addresses
    const { data: addresses, error } = await supabase
      .from('addresses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated as super admin
    const authToken = request.cookies.get('auth_token')?.value;
    const userType = request.cookies.get('user_type')?.value;

    if (!authToken || userType !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address_slug, name, description, latitude, longitude } = body;

    // Validate required fields
    if (!address_slug || !name || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Address slug, name, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Insert new address
    const { data: newAddress, error: insertError } = await supabase
      .from('addresses')
      .insert([
        {
          address_slug: address_slug.toLowerCase().trim(),
          name: name.trim(),
          description: description?.trim() || null,
          latitude,
          longitude,
        },
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Address slug already exists' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // Get all existing addresses
    const { data: existingAddresses, error: fetchError } = await supabase
      .from('addresses')
      .select('address_slug')
      .neq('address_slug', newAddress.address_slug);

    if (fetchError) throw fetchError;

    // Create distance entries for all combinations with the new address
    // For now, set distance to 0
    if (existingAddresses && existingAddresses.length > 0) {
      const distanceEntries = existingAddresses.map((addr) => {
        // Ensure alphabetical order for the constraint
        const [slug1, slug2] = [addr.address_slug, newAddress.address_slug].sort();
        return {
          address_slug_1: slug1,
          address_slug_2: slug2,
          distance_meters: 0, // For now, set to 0
        };
      });

      const { error: distanceError } = await supabase
        .from('distances')
        .insert(distanceEntries);

      if (distanceError) {
        console.error('Error creating distance entries:', distanceError);
        // Don't fail the request if distance creation fails
      }
    }

    return NextResponse.json(newAddress, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check if user is authenticated as super admin
    const authToken = request.cookies.get('auth_token')?.value;
    const userType = request.cookies.get('user_type')?.value;

    if (!authToken || userType !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, description, latitude, longitude } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update address (address_slug cannot be changed)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    const { data, error } = await supabase
      .from('addresses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If coordinates were updated, reset all distances involving this address to 0
    if (latitude !== undefined || longitude !== undefined) {
      const { error: distanceError } = await supabase
        .from('distances')
        .update({ distance_meters: 0 })
        .or(`address_slug_1.eq.${data.address_slug},address_slug_2.eq.${data.address_slug}`);

      if (distanceError) {
        console.error('Error resetting distances:', distanceError);
        // Don't fail the request if distance reset fails
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if user is authenticated as super admin
    const authToken = request.cookies.get('auth_token')?.value;
    const userType = request.cookies.get('user_type')?.value;

    if (!authToken || userType !== 'super_admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Address ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete address (distances will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
