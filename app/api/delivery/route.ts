import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { validateAuthSessionWithRole } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single delivery man with assigned canteens
      const { data: deliveryMan, error: deliveryError } = await supabase
        .from('delivery_man')
        .select(`
          *,
          delivery_man_canteens (
            canteen_id,
            assigned_date,
            canteens (
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (deliveryError) throw deliveryError;

      return NextResponse.json(deliveryMan);
    } else {
      // Get all delivery men with assigned canteens
      const { data, error } = await supabase
        .from('delivery_man')
        .select(`
          *,
          delivery_man_canteens (
            canteen_id,
            assigned_date,
            canteens (
              id,
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json(data);
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
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

    const body = await request.json();
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
      canteen_ids = [], // Array of canteen IDs to assign
    } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Hash password if provided
    let password_hash = null;
    if (password) {
      password_hash = await bcrypt.hash(password, 10);
    }

    // Insert delivery man
    const { data: deliveryMan, error: deliveryError } = await supabase
      .from('delivery_man')
      .insert([
        {
          name,
          phone,
          password_hash,
          address,
          vehicle_type,
          vehicle_number,
          id_proof_type,
          id_proof_number,
          emergency_contact_name,
          emergency_contact_phone,
          is_active,
        },
      ])
      .select()
      .single();

    if (deliveryError) throw deliveryError;

    // Assign to canteens if canteen_ids provided
    if (canteen_ids.length > 0) {
      const canteenAssignments = canteen_ids.map((canteen_id: string) => ({
        delivery_man_id: deliveryMan.id,
        canteen_id,
      }));

      const { error: assignmentError } = await supabase
        .from('delivery_man_canteens')
        .insert(canteenAssignments);

      if (assignmentError) {
        console.error('Error assigning kitchens:', assignmentError);
        // Don't fail the entire request, just log the error
      }
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
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

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
      canteen_ids,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Delivery man ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

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

    // Hash password if provided
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    // Update delivery man
    const { data: deliveryMan, error: updateError } = await supabase
      .from('delivery_man')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update canteen assignments if provided
    if (canteen_ids !== undefined) {
      // Delete existing assignments
      await supabase
        .from('delivery_man_canteens')
        .delete()
        .eq('delivery_man_id', id);

      // Insert new assignments
      if (canteen_ids.length > 0) {
        const canteenAssignments = canteen_ids.map((canteen_id: string) => ({
          delivery_man_id: id,
          canteen_id,
        }));

        const { error: assignmentError } = await supabase
          .from('delivery_man_canteens')
          .insert(canteenAssignments);

        if (assignmentError) {
          console.error('Error updating kitchen assignments:', assignmentError);
        }
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
    const { error: authError } = await validateAuthSessionWithRole('super_admin');
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Delivery man ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete delivery man (cascade will handle delivery_man_canteens)
    const { error } = await supabase
      .from('delivery_man')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ message: 'Delivery man deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery man:', error);
    return NextResponse.json(
      { error: 'Failed to delete delivery man' },
      { status: 500 }
    );
  }
}
