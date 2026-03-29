import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch all categories or a single category by ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const canteenId = searchParams.get('canteen_id');

    if (id) {
      // Get single category
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Get all categories for a specific canteen
      let query = supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (canteenId) {
        query = query.eq('canteen_id', canteenId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Create a new category
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { name, image_url, canteen_id, order_start_time, order_cutoff_time } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    if (!canteen_id) {
      return NextResponse.json(
        { error: 'Kitchen ID is required' },
        { status: 400 }
      );
    }

    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert([{ 
        name: name.trim(), 
        image_url: image_url || null, 
        canteen_id,
        order_start_time: order_start_time || null,
        order_cutoff_time: order_cutoff_time || null
      }])
      .select()
      .single();

    if (categoryError) {
      if (categoryError.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists in your kitchen' },
          { status: 409 }
        );
      }
      throw categoryError;
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing category
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id, name, image_url, canteen_id, order_start_time, order_cutoff_time } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const updateData: any = { 
      name: name.trim(), 
      image_url: image_url || null 
    };

    if (order_start_time !== undefined) updateData.order_start_time = order_start_time;
    if (order_cutoff_time !== undefined) updateData.order_cutoff_time = order_cutoff_time;

    // Include canteen_id if provided
    if (canteen_id) {
      updateData.canteen_id = canteen_id;
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A category with this name already exists in your kitchen' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete category - it is being used by menu items or kitchens' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
