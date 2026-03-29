import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole('super_admin');
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single delivery man with canteen assignments
      const { data: deliveryMan, error: dmError } = await supabaseAdmin
        .from('delivery_man')
        .select('id, name, phone, address, vehicle_type, vehicle_number, id_proof_type, id_proof_number, emergency_contact_name, emergency_contact_phone, is_active, is_earning_visible, joined_date, created_at, updated_at')
        .eq('id', id)
        .single();

      if (dmError) throw dmError;

      // Get assigned canteens
      const { data: canteens, error: canteensError } = await supabaseAdmin
        .from('delivery_man_canteens')
        .select(`
          canteen_id,
          assigned_date,
          is_earning_visible,
          canteens (
            id,
            name,
            logo_url
          )
        `)
        .eq('delivery_man_id', id);

      if (canteensError) throw canteensError;

      return NextResponse.json({
        ...deliveryMan,
        assigned_canteens: canteens || []
      });
    } else {
      // Get all delivery men with their canteen count
      const { data, error } = await supabaseAdmin
        .from('delivery_man')
        .select(`
          *,
          delivery_man_canteens (
            canteen_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the response to include canteen count
      const formattedData = data.map((dm: any) => ({
        ...dm,
        canteen_count: dm.delivery_man_canteens?.length || 0,
        delivery_man_canteens: undefined // Remove the raw data
      }));

      return NextResponse.json(formattedData);
    }
  } catch (error) {
    console.error('Error fetching delivery men:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery men' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole('super_admin');
    if (error) return error;
    const body = await request.json();

    console.log(body);
    const { 
      name, 
      phone, 
      password,
      address,
      vehicle_type,
      vehicle_number,
      id_proof_type,
      id_proof_number,
      emergency_contact_name,
      emergency_contact_phone,
      is_active = true,
      is_earning_visible = true,
      canteens = [],
      canteen_ids = [] // Fallback for old format
    } = body;

    // Use canteens if provided, otherwise fallback to canteen_ids
    const canteensToAssign = canteens.length > 0 ? canteens : canteen_ids.map((id: string) => ({ canteen_id: id, is_earning_visible: true }));

    // Validate required fields
    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, phone, and password are required' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user_credentials entry
    // const { data: userCred, error: userError } = await supabaseAdmin
    //   .from('user_credentials')
    //   .insert([{
    //     username: phone, // Use phone as username
    //     password_hash,
    //     user_type: 'delivery_man'
    //   }])
    //   .select()
    //   .single();

    // if (userError) throw userError;

    // Insert delivery man
    const { data: deliveryMan, error: dmError } = await supabaseAdmin
      .from('delivery_man')
      .insert([{
        name,
        phone,
        address,
        vehicle_type,
        vehicle_number,
        id_proof_type,
        password_hash,
        id_proof_number,
        emergency_contact_name,
        emergency_contact_phone,
        is_active,
        is_earning_visible
      }])
      .select()
      .single();

      if (dmError) {
        console.error('Error inserting delivery man:', dmError);
        throw dmError;
      }

      console.log('Delivery Man Created:', deliveryMan);

    // Assign canteens if provided
    if (canteensToAssign.length > 0) {
      const canteenAssignments = canteensToAssign.map((c: any) => ({
        delivery_man_id: deliveryMan.id,
        canteen_id: c.canteen_id,
        is_earning_visible: c.is_earning_visible ?? true
      }));

      const { error: assignError } = await supabaseAdmin
        .from('delivery_man_canteens')
        .insert(canteenAssignments);

      if (assignError) throw assignError;
    }

    return NextResponse.json(deliveryMan, { status: 201 });
  } catch (error) {
    console.error('Error creating delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to create delivery man' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole('super_admin');
    if (error) return error;

    const body = await request.json();
    const { 
      id,
      name,
      phone,
      password,
      address,
      vehicle_type,
      vehicle_number,
      id_proof_type,
      id_proof_number,
      emergency_contact_name,
      emergency_contact_phone,
      is_active,
      is_earning_visible,
      canteens,
      canteen_ids // Fallback for old format
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Delivery man ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
    if (vehicle_number !== undefined) updateData.vehicle_number = vehicle_number;
    if (id_proof_type !== undefined) updateData.id_proof_type = id_proof_type;
    if (id_proof_number !== undefined) updateData.id_proof_number = id_proof_number;
    if (emergency_contact_name !== undefined) updateData.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined) updateData.emergency_contact_phone = emergency_contact_phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_earning_visible !== undefined) updateData.is_earning_visible = is_earning_visible;

    // Update delivery man
    const { data: deliveryMan, error: dmError } = await supabaseAdmin
      .from('delivery_man')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dmError) throw dmError;

    // Update password if provided
    if (password && id) {
      const password_hash = await bcrypt.hash(password, 10);
      const { error: pwError } = await supabaseAdmin
        .from('delivery_man')
        .update({ password_hash })
        .eq('id', id);

      if (pwError) throw pwError;
    }

    // Update canteen assignments if provided
    const canteensToUpdate = canteens || (canteen_ids !== undefined ? canteen_ids.map((id: string) => ({ canteen_id: id, is_earning_visible: true })) : null);
    
    if (canteensToUpdate !== null) {
      // Delete existing assignments
      await supabaseAdmin
        .from('delivery_man_canteens')
        .delete()
        .eq('delivery_man_id', id);

      // Add new assignments
      if (canteensToUpdate.length > 0) {
        const canteenAssignments = canteensToUpdate.map((c: any) => ({
          delivery_man_id: id,
          canteen_id: typeof c === 'string' ? c : c.canteen_id,
          is_earning_visible: typeof c === 'string' ? true : (c.is_earning_visible ?? true)
        }));

        const { error: assignError } = await supabaseAdmin
          .from('delivery_man_canteens')
          .insert(canteenAssignments);

        if (assignError) throw assignError;
      }
    }

    return NextResponse.json(deliveryMan);
  } catch (error) {
    console.error('Error updating delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery man' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole('super_admin');
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Delivery man ID is required' },
        { status: 400 }
      );
    }

    // Get user_id before deletion
    const { data: deliveryMan } = await supabaseAdmin
      .from('delivery_man')
      .select('user_id')
      .eq('id', id)
      .single();

    // Delete delivery man (cascade will handle canteen assignments)
    const { error: dmError } = await supabaseAdmin
      .from('delivery_man')
      .delete()
      .eq('id', id);

    if (dmError) throw dmError;

    // Delete user credentials
    if (deliveryMan?.user_id) {
      await supabaseAdmin
        .from('user_credentials')
        .delete()
        .eq('id', deliveryMan.user_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery man' },
      { status: 500 }
    );
  }
}
