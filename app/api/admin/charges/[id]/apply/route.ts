import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

/**
 * POST /api/admin/charges/[id]/apply
 * 
 * Mark a specific charge as applied.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { session, error: authError } = await validateAuthSessionWithRole("super_admin");
    if (authError || !session) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Charge ID is required" }, { status: 400 });
    }

    // Check if charge exists and is not already applied
    const { data: existingCharge, error: fetchError } = await supabaseAdmin
      .from('charges')
      .select('id, applied, charge_amount, charge_reason')
      .eq('id', id)
      .single();

    if (fetchError || !existingCharge) {
      return NextResponse.json({ error: "Charge not found" }, { status: 404 });
    }

    if (existingCharge.applied) {
      return NextResponse.json({ error: "Charge is already applied" }, { status: 400 });
    }

    // Mark as applied
    const { error: updateError } = await supabaseAdmin
      .from('charges')
      .update({ applied: true })
      .eq('id', id);

    if (updateError) {
      console.error("[Apply Charge] Error:", updateError);
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: `Charge of ₹${existingCharge.charge_amount} marked as applied.`,
    });

  } catch (error: any) {
    console.error("Error applying charge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to apply charge" },
      { status: 500 }
    );
  }
}
