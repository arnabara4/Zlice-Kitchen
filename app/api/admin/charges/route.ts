import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

/**
 * POST /api/admin/charges
 * 
 * Create a new charge (canteen-distributed, order-specific, or global-misc).
 * 
 * Body:
 * - canteen_id?: string (optional, required if CANTEEN_DISTRIBUTED or ORDER_SPECIFIC)
 * - order_id?: string (optional, required if ORDER_SPECIFIC)
 * - charge_amount: number
 * - charge_reason: string
 * - charge_type: 'CANTEEN_DISTRIBUTED' | 'ORDER_SPECIFIC' | 'GLOBAL_MISC'
 */

/**
 * GET /api/admin/charges
 * 
 * Fetch all charges across the platform with canteen details.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { session, error: authError } = await validateAuthSessionWithRole("super_admin");
    if (authError || !session) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all charges with canteen name
    const { data: charges, error: fetchError } = await supabaseAdmin
      .from('charges')
      .select(`
        id,
        canteen_id,
        order_id,
        charge_amount,
        charge_reason,
        charge_type,
        applied,
        created_at,
        created_by_admin,
        canteens:canteen_id ( name )
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("[Charges API] Error fetching charges:", fetchError);
      throw fetchError;
    }

    // Map canteen name into a flat field
    const mapped = (charges || []).map((c: any) => ({
      ...c,
      canteen_name: c.canteens?.name || null,
      canteens: undefined,
    }));

    // Calculate totals
    const totalCharges = mapped.reduce((sum: number, c: any) => sum + Number(c.charge_amount || 0), 0);
    const appliedTotal = mapped.filter((c: any) => c.applied).reduce((sum: number, c: any) => sum + Number(c.charge_amount || 0), 0);
    const unappliedTotal = mapped.filter((c: any) => !c.applied).reduce((sum: number, c: any) => sum + Number(c.charge_amount || 0), 0);

    return NextResponse.json({
      success: true,
      charges: mapped,
      totals: {
        total: totalCharges,
        applied: appliedTotal,
        unapplied: unappliedTotal,
        count: mapped.length,
      }
    });

  } catch (error: any) {
    console.error("Error fetching charges:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch charges" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate super admin
    const { session, error: authError } = await validateAuthSessionWithRole("super_admin");
    if (authError || !session) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = session.user_id;

    // Parse body
    const body = await request.json();
    const {
      canteen_id,
      order_id,
      charge_amount,
      charge_reason,
      charge_type,
    } = body;

    // Validation
    if (!charge_amount || isNaN(Number(charge_amount)) || Number(charge_amount) === 0) {
      return NextResponse.json({ error: "Invalid charge amount" }, { status: 400 });
    }
    if (!charge_reason || typeof charge_reason !== 'string' || charge_reason.trim() === '') {
      return NextResponse.json({ error: "Charge reason is required" }, { status: 400 });
    }
    if (!['CANTEEN_DISTRIBUTED', 'ORDER_SPECIFIC', 'GLOBAL_MISC'].includes(charge_type)) {
      return NextResponse.json({ error: "Invalid charge type" }, { status: 400 });
    }

    if (charge_type === 'CANTEEN_DISTRIBUTED' && !canteen_id) {
       return NextResponse.json({ error: "canteen_id is required for CANTEEN_DISTRIBUTED charges" }, { status: 400 });   
    }

    if (charge_type === 'ORDER_SPECIFIC' && !order_id) {
       return NextResponse.json({ error: "order_id is required for ORDER_SPECIFIC charges" }, { status: 400 });   
    }

    // Insert charge
    const { data: newCharge, error: insertError } = await supabaseAdmin
      .from('charges')
      .insert({
        canteen_id: canteen_id || null,
        order_id: order_id || null,
        charge_amount: Number(charge_amount),
        charge_reason: charge_reason.trim(),
        charge_type,
        created_by_admin: adminId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Charges API] Error inserting charge:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "Charge added successfully",
      charge: newCharge
    });

  } catch (error: any) {
    console.error("Error creating charge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create charge" },
      { status: 500 }
    );
  }
}
