import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ canteenId: string; orderId: string }> }
) {
  try {
    const { canteenId, orderId } = await params;
    const body = await request.json();
    
    // Ensure charges is a number and reason is a string or null
    const charges = Number(body.charges) || 0;
    const charge_reason = body.charge_reason ? String(body.charge_reason).trim() : null;

    if (charges < 0) {
      return NextResponse.json({ success: false, message: "Charges cannot be negative" }, { status: 400 });
    }

    const supabase = await createClient();

    // Authenticate super admin
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "super_admin") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { data: session, error: sessionError } = await supabase
      .from("auth_sessions")
      .select("*")
      .eq("token", authToken)
      .eq("user_type", userType)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 401 });
    }

    // Verify order exists, belongs to canteen, and is NOT settled
    const { data: order, error: orderCheckError } = await supabase
      .from("orders")
      .select("id, is_settled")
      .eq("id", orderId)
      .eq("canteen_id", canteenId)
      .single();

    if (orderCheckError || !order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.is_settled) {
      return NextResponse.json({ success: false, message: "Cannot edit charges on a settled order" }, { status: 400 });
    }

    // Update the charges (using the new charges table)
    
    // First, delete any existing ORDER_SPECIFIC charges for this order
    const { error: deleteError } = await supabase
      .from("charges")
      .delete()
      .eq("order_id", orderId)
      .eq("charge_type", "ORDER_SPECIFIC");
      
    if (deleteError) {
      throw deleteError;
    }
    
    // If the new amount is > 0, insert it
    if (charges > 0) {
      const { error: insertError } = await supabase
        .from("charges")
        .insert({
          canteen_id: canteenId,
          order_id: orderId,
          charge_amount: charges,
          charge_reason: charge_reason || 'Order adjustment',
          charge_type: 'ORDER_SPECIFIC',
          created_by_admin: session.user_id 
        });
        
      if (insertError) {
        throw insertError;
      }
    }

    // Also clear the legacy columns on the orders table just to be safe (optional but good for cleanup)
    await supabase
      .from("orders")
      .update({ charges: 0, charge_reason: null })
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      message: "Charges updated successfully",
      charges,
      charge_reason
    });

  } catch (error: any) {
    console.error("Error updating order charges:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
