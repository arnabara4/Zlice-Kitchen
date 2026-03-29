import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all schedules or a single schedule by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const canteenId = searchParams.get('canteen_id');

    if (id) {
      // Get single schedule
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Get all schedules for a specific canteen
      let query = supabase
        .from('schedules')
        .select('*')
        .order('start_time', { ascending: true });

      if (canteenId) {
        query = query.eq('canteen_id', canteenId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, canteen_id, start_time, end_time, cooking_time, capacity, is_active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Schedule name is required' },
        { status: 400 }
      );
    }

    if (!canteen_id) {
      return NextResponse.json(
        { error: 'Kitchen ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert([{ 
        name: name.trim(), 
        canteen_id, 
        start_time: start_time || '00:00:00', 
        end_time: end_time || '23:59:59',
        cooking_time: cooking_time || 20,
        capacity: capacity || null,
        is_active: is_active !== undefined ? is_active : true
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing schedule
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, name, canteen_id, start_time, end_time, cooking_time, capacity, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Schedule name is required' },
        { status: 400 }
      );
    }

    const updateData: any = { 
      name: name.trim()
    };

    if (start_time !== undefined) updateData.start_time = start_time || null;
    if (end_time !== undefined) updateData.end_time = end_time || null;
    if (cooking_time !== undefined) updateData.cooking_time = cooking_time || null;
    if (capacity !== undefined) updateData.capacity = capacity || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (canteen_id) updateData.canteen_id = canteen_id;

    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a schedule
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete schedule - it has associated orders or menu mappings' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
