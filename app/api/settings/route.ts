import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateAuthSessionWithRole } from '@/lib/api-auth';

export async function PUT(req: Request) {
  try {
    const { session: sessionData, error: sessionError } = await validateAuthSessionWithRole("canteen");

    if (sessionError || !sessionData) {
      return sessionError || NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { canteenId, settings } = body;

    // Verify canteen ownership
    if (canteenId !== sessionData.canteen_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('canteens')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', canteenId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Settings update API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
