import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const itemId = searchParams.get('itemId');
    const canteenId = searchParams.get('canteenId');

    if (id) {
      // Get single offer
      const { data, error } = await supabase
        .from('item_offers')
        .select(`
          *,
          menu_items (
            id,
            name,
            price,
            canteen_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // Build query
    let query = supabase
      .from('item_offers')
      .select(`
        *,
        menu_items (
          id,
          name,
          price,
          canteen_id
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by item if provided
    if (itemId) {
      query = query.eq('item_id', itemId);
    }

    // Filter by canteen if provided
    if (canteenId) {
      query = query.eq('menu_items.canteen_id', canteenId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Additional filter for canteen_id (since Supabase may not support nested filtering properly)
    let filteredData = data;
    if (canteenId && data) {
      filteredData = data.filter((offer: any) => offer.menu_items?.canteen_id === canteenId);
      
      // Sort by status: Active > Upcoming > Expired
      filteredData.sort((a: any, b: any) => {
        const now = new Date();
        
        // Helper function to get offer status
        const getStatus = (offer: any) => {
          if (new Date(offer.valid_from+'Z') > now) {
            return 'Upcoming'; // Not started yet
          } else if (offer.valid_until+'Z' && new Date(offer.valid_until+'Z') >= now) {
            return 'Active'; // Currently running
          } else {
            return 'Expired'; // Past expiry date
          }
        };
        
        const statusA = getStatus(a);
        const statusB = getStatus(b);
        
        // Define priority order
        const statusPriority: { [key: string]: number } = {
          'Active': 1,
          'Upcoming': 2,
          'Expired': 3,
        };
        
        if(statusPriority[statusA] != statusPriority[statusB])return statusPriority[statusA] - statusPriority[statusB];
       if(b.discount_percentage != a.discount_percentage) return b.discount_percentage - a.discount_percentage;
       return a.valid_from.localeCompare(b.valid_from);
      });
    }

    return NextResponse.json(filteredData || []);
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      item_id,
      offer_description,
      discount_percentage,
      valid_from,
      valid_until,
      is_active = true,
    } = body;

    // Validate required fields
    if (!item_id || discount_percentage === undefined) {
      return NextResponse.json(
        { error: 'Item ID and discount percentage are required' },
        { status: 400 }
      );
    }

    // Validate discount percentage
    if (discount_percentage < 0 || discount_percentage > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate dates if provided
    if (valid_from && valid_until && new Date(valid_from) >= new Date(valid_until)) {
      return NextResponse.json(
        { error: 'Valid from date must be before valid until date' },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const { data: menuItem, error: menuError } = await supabase
      .from('menu_items')
      .select('id')
      .eq('id', item_id)
      .single();

    if (menuError || !menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Insert offer
    const { data, error } = await supabase
      .from('item_offers')
      .insert([
        {
          item_id,
          offer_description,
          discount_percentage,
          valid_from,
          valid_until,
          is_active,
        },
      ])
      .select(`
        *,
        menu_items (
          id,
          name,
          price,
          canteen_id
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      id,
      item_id,
      offer_description,
      discount_percentage,
      valid_from,
      valid_until,
      is_active,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    // Validate discount percentage if provided
    if (discount_percentage !== undefined && (discount_percentage < 0 || discount_percentage > 100)) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Validate dates if both provided
    if (valid_from && valid_until && new Date(valid_from) >= new Date(valid_until)) {
      return NextResponse.json(
        { error: 'Valid from date must be before valid until date' },
        { status: 400 }
      );
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (item_id !== undefined) updateData.item_id = item_id;
    if (offer_description !== undefined) updateData.offer_description = offer_description;
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
    if (valid_from !== undefined) updateData.valid_from = valid_from;
    if (valid_until !== undefined) updateData.valid_until = valid_until;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('item_offers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        menu_items (
          id,
          name,
          price,
          canteen_id
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Offer ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('item_offers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
