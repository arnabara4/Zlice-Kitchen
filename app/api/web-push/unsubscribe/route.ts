import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = request.cookies;
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify session using admin client
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .select('user_id, user_type')
      .eq('token', authToken)
      .single();

    if (sessionError || !sessionData) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let tableName = '';
    let idColumn = '';
    let idValue: any = null;

    if (sessionData.user_type === 'canteen') {
      tableName = 'canteen_push_subscriptions';
      idColumn = 'canteen_id';
      idValue = sessionData.user_id;
    } else if (sessionData.user_type === 'delivery') {
      tableName = 'delivery_push_subscriptions';
      idColumn = 'delivery_man_id';
      idValue = sessionData.user_id;
    } else if (sessionData.user_type === 'super_admin') {
      const { data: adminData } = await supabaseAdmin
        .from('super_admins')
        .select('email')
        .eq('id', sessionData.user_id)
        .single();
        
      if (!adminData) {
          return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      tableName = 'admin_push_subscriptions';
      idColumn = 'admin_identifier';
      idValue = adminData.email;
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from(tableName as any)
      .delete()
      .eq(idColumn, idValue);

    if (deleteError) {
      console.error("Error deleting subscription:", deleteError);
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in unsubscribe API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
