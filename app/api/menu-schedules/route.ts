import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch menu item mappings
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const canteenId = searchParams.get('canteen_id');

    let query = supabase.from('menu_item_schedules').select('id, menu_item_id, schedule_id, schedules!inner(canteen_id)');

    if (canteenId) {
      query = query.eq('schedules.canteen_id', canteenId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching menu_item_schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu_item_schedules' },
      { status: 500 }
    );
  }
}

// POST - Add a menu item to a schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { menu_item_id, schedule_id } = body;

    if (!menu_item_id || !schedule_id) {
      return NextResponse.json(
        { error: 'menu_item_id and schedule_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('menu_item_schedules')
      .insert([{ menu_item_id, schedule_id }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Mapping already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error mapping schedule:', error);
    return NextResponse.json(
      { error: 'Failed to map schedule' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a menu item from a schedule
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const menu_item_id = searchParams.get('menu_item_id');
    const schedule_id = searchParams.get('schedule_id');

    if (!menu_item_id || !schedule_id) {
      return NextResponse.json(
        { error: 'menu_item_id and schedule_id are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('menu_item_schedules')
      .delete()
      .match({ menu_item_id, schedule_id });

    if (error) throw error;

    return NextResponse.json({ message: 'Mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule mapping:', error);
    return NextResponse.json(
      { error: 'Failed to delete mapped schedule' },
      { status: 500 }
    );
  }
}
