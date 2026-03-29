import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const { session: sessionData, error: sessionError } = await validateAuthSessionWithRole("canteen");
    
    if (sessionError || !sessionData) {
      return sessionError || NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { id, menuData } = body;

    if (id) {
       // Check ownership before updating
       const { data: item } = await supabaseAdmin.from('menu_items').select('canteen_id').eq('id', id).single();
       if (!item || item.canteen_id !== sessionData.canteen_id) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
       
       const { error: err } = await supabaseAdmin
          .from('menu_items')
          .update(menuData)
          .eq('id', id);
        
        if (err) throw err;
    } else {
       // Inserting new menu item
       const { error: err } = await supabaseAdmin
          .from('menu_items')
          .insert([{ ...menuData, canteen_id: sessionData.canteen_id }]);
        
        if (err) throw err;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Menu items POST API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
