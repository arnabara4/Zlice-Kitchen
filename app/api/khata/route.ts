import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .select('canteen_id, user_type')
      .eq('token', authToken)
      .single();

    if (sessionError || !sessionData || sessionData.user_type !== 'canteen') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
       // Get specific Khata details
       const [khataResponse, entriesResponse] = await Promise.all([
         supabaseAdmin.from('khata_students').select('*').eq('id', id).single(),
         supabaseAdmin.from('khata_entries').select('*').eq('student_id', id).order('created_at', { ascending: false })
       ]);
       
       if (khataResponse.error) throw khataResponse.error;
       
       // SECURITY FIX: Verify the khata requested belongs to the canteen session
       if (khataResponse.data.canteen_id !== sessionData.canteen_id) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
       
       return NextResponse.json({
           student: khataResponse.data,
           entries: entriesResponse.data || []
       });
    }

    // Get all Khata basic lists for the canteen
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('khata_students')
      .select('*')
      .eq('canteen_id', sessionData.canteen_id)
      .order('name', { ascending: true });

    if (studentsError) {
      return NextResponse.json({ error: studentsError.message }, { status: 500 });
    }
    
    // Fetch all entries for this canteen to calculate stats
    // We get khata_id, amount, and created_at
    const { data: entriesData, error: entriesError } = await supabaseAdmin
      .from('khata_entries')
      .select('student_id, amount, created_at');

    if (entriesError) {
       console.error("Entries fetch error:", entriesError);
       // Ignore entries error and just return students with 0 stats
       return NextResponse.json((students || []).map(s => ({
          ...s,
          currentMonth: 0,
          lastMonth: 0,
          total: 0,
          entryCount: 0
       })));
    }

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const studentsWithStats = (students || []).map(student => {
       const studentEntries = (entriesData || []).filter(e => e.student_id === student.id);
       
       const currentMonthEntries = studentEntries.filter((e: any) => {
         const date = new Date(e.created_at);
         return date >= currentMonthStart;
       });
       
       const lastMonthEntries = studentEntries.filter((e: any) => {
         const date = new Date(e.created_at);
         return date >= lastMonthStart && date <= lastMonthEnd;
       });
       
       return {
         ...student,
         currentMonth: currentMonthEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0),
         lastMonth: lastMonthEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0),
         total: studentEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0),
         entryCount: studentEntries.length,
       };
    });

    return NextResponse.json(studentsWithStats);

  } catch (error: any) {
    console.error('Khata GET API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get('auth_token')?.value;

    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('auth_sessions')
      .select('canteen_id, user_type')
      .eq('token', authToken)
      .single();

    if (sessionError || !sessionData || sessionData.user_type !== 'canteen') {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { type, payload } = body;

    if (type === 'create') {
       const { name, phone_number, roll_number } = payload;
       const { data, error } = await supabaseAdmin
         .from('khata_students')
         .insert([{ name, phone_number, roll_number, canteen_id: sessionData.canteen_id, balance: 0 }])
         .select()
         .single();
         
       if (error) throw error;
       return NextResponse.json(data);
    } 
    
    if (type === 'add_entry') {
       const { student_id, order_id, amount, notes, entry_type = 'purchase' } = payload;
       
       // Verify khata belongs to canteen
       const { data: khataCheck } = await supabaseAdmin.from('khata_students').select('canteen_id').eq('id', student_id).single();
       if (!khataCheck || khataCheck.canteen_id !== sessionData.canteen_id) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
       
       const { data, error } = await supabaseAdmin
         .from('khata_entries')
         .insert([{ student_id, order_id, amount, custom_notes: notes, entry_type }])
         .select()
         .single();
         
       if (error) throw error;
       
       // Update balance
       const balanceChange = entry_type === 'payment' || entry_type === 'credit' ? -amount : amount;
       const { error: balanceError } = await supabaseAdmin.rpc('increment_khata_balance', {
            khata_id_param: student_id,
            amount_param: balanceChange
       });

       // Fallback if RPC doesn't exist
       if (balanceError) {
         console.warn("RPC failed, falling back to read-modify-write", balanceError);
         const { data: kData } = await supabaseAdmin.from('khata_students').select('prepaid_balance').eq('id', student_id).single();
         await supabaseAdmin.from('khata_students').update({ prepaid_balance: (kData?.prepaid_balance || 0) + (entry_type === 'credit' ? amount : -amount) }).eq('id', student_id);
       }
       
       // If attaching an order to khata, update order payment status
       if (order_id && entry_type === 'purchase') {
           await supabaseAdmin.from('orders').update({ payment_status: 'paid' }).eq('id', order_id);
       }

       return NextResponse.json(data);
    }
    
    if (type === 'delete') {
       const { student_id } = payload;
       
       // Verify khata belongs to canteen
       const { data: khataCheck } = await supabaseAdmin.from('khata_students').select('canteen_id').eq('id', student_id).single();
       if (!khataCheck || khataCheck.canteen_id !== sessionData.canteen_id) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
       
       // Delete entries first
       await supabaseAdmin.from('khata_entries').delete().eq('student_id', student_id);
       
       // Then delete student
       const { error } = await supabaseAdmin.from('khata_students').delete().eq('id', student_id);
       if (error) throw error;
       
       return NextResponse.json({ success: true });
    }
    
    if (type === 'delete_entry') {
       const { entry_id } = payload;
       
       const { data: entry } = await supabaseAdmin.from('khata_entries').select('student_id, amount, entry_type, khata_students(canteen_id)').eq('id', entry_id).single();
       if (!entry || (entry as any).khata_students?.canteen_id !== sessionData.canteen_id) {
           return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
       }
       
       const { error } = await supabaseAdmin.from('khata_entries').delete().eq('id', entry_id);
       if (error) throw error;
       
       // Revert balance change
       const { data: kData } = await supabaseAdmin.from('khata_students').select('prepaid_balance').eq('id', entry.student_id).single();
       const revertAmount = entry.entry_type === 'credit' ? -entry.amount : entry.amount;
       await supabaseAdmin.from('khata_students').update({ prepaid_balance: (kData?.prepaid_balance || 0) + revertAmount }).eq('id', entry.student_id);
       
       return NextResponse.json({ success: true });
    }
    
    if (type === 'update_student') {
        const { student_id, name, roll_number, phone_number } = payload;
        
        const { error } = await supabaseAdmin.from('khata_students').update({ name, roll_number, phone_number }).eq('id', student_id).eq('canteen_id', sessionData.canteen_id);
        if (error) throw error;
        
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });

  } catch (error: any) {
    console.error('Khata POST API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
