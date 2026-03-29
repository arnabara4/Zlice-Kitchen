import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get custom auth session
    const cookieStore = request.cookies;
    const authToken = cookieStore.get('auth_token')?.value;
    const userType = cookieStore.get('user_type')?.value;

    console.log("Auth Token", authToken);
    console.log("User Type", userType);

    if (!authToken || userType !== 'delivery') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify session in database
    const { data: sessionData, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('user_id')
      .eq('token', authToken)
      .eq('user_type', 'delivery')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Session' },
        { status: 401 }
      );
    }

    const userId = sessionData.user_id;

    // Check if user is a delivery man (optional extra security)
    // For now we just check if they are authenticated as we are sharing the user_push_subscriptions table
    // which is linked to public.users. Delivery men are users.

    // Calculate endpoint hash for uniqueness (simple deduplication)
    // We can use a simple hash of the endpoint URL
    const crypto = require('crypto');
    const endpointHash = crypto
      .createHash('sha256')
      .update(subscription.endpoint)
      .digest('hex');

    // Upsert subscription
    const { error: upsertError } = await supabase
      .from('delivery_push_subscriptions')
      .upsert(
        {
          delivery_man_id: userId,
          subscription,
          endpoint_hash: endpointHash,
        },
        { onConflict: 'delivery_man_id' }
      );

    if (upsertError) {
      console.error('Error saving subscription:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in push-subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get custom auth session
    const cookieStore = request.cookies;
    const authToken = cookieStore.get('auth_token')?.value;
    const userType = cookieStore.get('user_type')?.value;

    if (!authToken || userType !== 'delivery') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate hash
    const crypto = require('crypto');
    const endpointHash = crypto
      .createHash('sha256')
      .update(subscription.endpoint)
      .digest('hex');

    // Delete subscription
    // Since we don't have easy access to delivery_man_id without a DB lookup, 
    // and endpoint_hash is unique enough per device, we can just delete by hash.
    // However, for security, let's verify ownership or just rely on the auth token validation above.
    // Ideally we should match delivery_man_id too.
    
    const { data: sessionData } = await supabase
      .from('auth_sessions')
      .select('user_id')
      .eq('token', authToken)
      .eq('user_type', 'delivery')
      .single();
      
    if (!sessionData) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('delivery_push_subscriptions')
      .delete()
      .eq('delivery_man_id', sessionData.user_id)
      .eq('endpoint_hash', endpointHash);

    if (deleteError) {
      console.error('Error deleting subscription:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in delete push subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
