import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

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

    // Calculate hash
    const endpointHash = crypto
      .createHash('sha256')
      .update(subscription.endpoint)
      .digest('hex');

    // Determine table and upsert data
    let tableName = '';
    let upsertData: any = {};
    let conflictColumn = '';

    if (sessionData.user_type === 'canteen') {
      tableName = 'canteen_push_subscriptions';
      upsertData = {
        canteen_id: sessionData.user_id,
        subscription: subscription,
        endpoint_hash: endpointHash,
        updated_at: new Date().toISOString(),
      };
      conflictColumn = 'canteen_id';
    } else if (sessionData.user_type === 'delivery') {
      tableName = 'delivery_push_subscriptions';
      upsertData = {
        delivery_man_id: sessionData.user_id,
        subscription: subscription,
        endpoint_hash: endpointHash,
        updated_at: new Date().toISOString(),
      };
      conflictColumn = 'delivery_man_id';
    } else if (sessionData.user_type === 'super_admin') {
      // Need to fetch admin email specifically for super_admin
      const { data: adminData } = await supabaseAdmin
        .from('super_admins')
        .select('email')
        .eq('id', sessionData.user_id)
        .single();
        
      if (!adminData) {
          return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
      }

      tableName = 'admin_push_subscriptions';
      upsertData = {
        admin_identifier: adminData.email,
        subscription: subscription,
        endpoint_hash: endpointHash,
        updated_at: new Date().toISOString(),
      };
      conflictColumn = 'admin_identifier';
    } else {
      return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
      .from(tableName as any)
      .upsert(upsertData, { onConflict: conflictColumn });

    if (upsertError) {
      console.error("Error saving subscription:", upsertError);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in subscribe API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
