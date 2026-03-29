import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '@/lib/cloudinary';
import { validateAuthSessionWithRole, validateAuthSession } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Use supabaseAdmin to bypass RLS for canteens reads
    // This allows authenticated users to fetch canteen data
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single canteen
      const { data, error } = await supabaseAdmin
        .from('canteens')
        .select('*')
        .eq('id', id);

      if (error) throw error;

      // Handle case where canteen doesn't exist
      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: 'Kitchen not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(data[0]);
    } else {
      // Get all canteens
      const { data, error } = await supabaseAdmin
        .from('canteens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching kitchens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kitchens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      logo, 
      phone, 
      address, 
      latitude, 
      longitude, 
      delivery_fee, 
      is_active = true,
      is_delivery_enabled = false,
      is_takeaway_enabled = false,
      is_dine_in_enabled = false,
      is_gst_enabled = false,
      gst_number = null,
      home_cook = null,
      supports_instant_orders = true,
      supports_scheduled_orders = false,
      increment_percentage = 5.00,
      is_fitness = false
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Upload logo if provided
    let logo_url = null;
    if (logo) {
      logo_url = await uploadToCloudinary(logo);
    }

    const supabase = await createClient();

    // Insert canteen
    const { data, error } = await supabase
      .from('canteens')
      .insert([
        {
          name,
          email,
          password_hash,
          logo_url,
          phone,
          address,
          latitude,
          longitude,
          delivery_fee: delivery_fee ?? 20.00,
          is_active,
          is_delivery_enabled,
          is_takeaway_enabled,
          is_dine_in_enabled,
          is_gst_enabled,
          gst_number,
          home_cook,
          supports_instant_orders,
          supports_scheduled_orders,
          increment_percentage: increment_percentage ?? 5.00,
          is_fitness,
        },
      ])
      .select()
      .single();

    if (error) {
      // If database insert fails and logo was uploaded, delete it
      if (logo_url) {
        try {
          const publicId = extractPublicId(logo_url);
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.error('Failed to delete uploaded logo:', deleteError);
        }
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to create kitchen' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

    const body = await request.json();
    const { 
      id, 
      name, 
      email, 
      password, 
      logo, 
      phone, 
      address, 
      latitude, 
      longitude, 
      delivery_fee, 
      is_active,
      is_delivery_enabled,
      is_takeaway_enabled,
      is_dine_in_enabled,
      is_gst_enabled,
      gst_number,
      home_cook,
      supports_instant_orders,
      supports_scheduled_orders,
      increment_percentage,
      is_fitness
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Kitchen ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current canteen data
    const { data: currentCanteen, error: fetchError } = await supabase
      .from('canteens')
      .select('logo_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (delivery_fee !== undefined) updateData.delivery_fee = delivery_fee;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_delivery_enabled !== undefined) updateData.is_delivery_enabled = is_delivery_enabled;
    if (is_takeaway_enabled !== undefined) updateData.is_takeaway_enabled = is_takeaway_enabled;
    if (is_dine_in_enabled !== undefined) updateData.is_dine_in_enabled = is_dine_in_enabled;
    if (is_gst_enabled !== undefined) updateData.is_gst_enabled = is_gst_enabled;
    if (gst_number !== undefined) updateData.gst_number = gst_number;
    if (home_cook !== undefined) updateData.home_cook = home_cook;
    if (supports_instant_orders !== undefined) updateData.supports_instant_orders = supports_instant_orders;
    if (supports_scheduled_orders !== undefined) updateData.supports_scheduled_orders = supports_scheduled_orders;
    if (increment_percentage !== undefined) updateData.increment_percentage = increment_percentage;
    if (is_fitness !== undefined) updateData.is_fitness = is_fitness;

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Handle logo update
    if (logo !== undefined) {
      // Delete old logo if exists
      if (currentCanteen.logo_url) {
        try {
          const oldPublicId = extractPublicId(currentCanteen.logo_url);
          await deleteFromCloudinary(oldPublicId);
        } catch (deleteError) {
          console.error('Failed to delete old logo:', deleteError);
        }
      }

      // Upload new logo
      if (logo) {
        updateData.logo_url = await uploadToCloudinary(logo);
      } else {
        updateData.logo_url = null;
      }
    }

    // Update canteen
    const { data, error } = await supabase
      .from('canteens')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to update kitchen' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Kitchen ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get canteen data to delete logo
    const { data: canteen, error: fetchError } = await supabase
      .from('canteens')
      .select('logo_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching kitchen:', fetchError);
      throw fetchError;
    }

    // Delete all related data first to avoid foreign key constraints
    // First, get all order IDs for this canteen
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('canteen_id', id);

    // Delete order items first (if there are any orders)
    if (orders && orders.length > 0) {
      const orderIds = orders.map(order => order.id);
      await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);
    }

    // Delete orders
    await supabase
      .from('orders')
      .delete()
      .eq('canteen_id', id);

    // Delete khata entries
    await supabase
      .from('khata_entries')
      .delete()
      .eq('canteen_id', id);

    // Delete khata students
    await supabase
      .from('khata_students')
      .delete()
      .eq('canteen_id', id);

    // Delete menu items
    await supabase
      .from('menu_items')
      .delete()
      .eq('canteen_id', id);

    // Delete auth sessions for this canteen
    await supabase
      .from('auth_sessions')
      .delete()
      .eq('user_id', id)
      .eq('user_type', 'canteen');

    // Finally, delete canteen
    const { error: deleteError } = await supabase
      .from('canteens')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting kitchen:', deleteError);
      throw deleteError;
    }

    // Delete logo from Cloudinary if exists
    if (canteen.logo_url) {
      try {
        const publicId = extractPublicId(canteen.logo_url);
        await deleteFromCloudinary(publicId);
      } catch (deleteError) {
        console.error('Failed to delete logo from Cloudinary:', deleteError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting kitchen:', error);
    return NextResponse.json(
      { error: 'Failed to delete kitchen' },
      { status: 500 }
    );
  }
}
