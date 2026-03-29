
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSettlementEligibilityDate, formatCurrency } from "@/lib/financial-utils";

/**
 * POST /api/admin/settlements/[canteenId]/pay
 * 
 * Executes settlement for a canteen up to the T-2 eligibility cutoff.
 * 
 * Logic:
 * 1. Calculate T-2 cutoff date (getSettlementEligibilityDate)
 * 2. Update all pending orders created <= cutoff for this canteen
 * 3. Set is_settled = true, payment_status = 'paid' (if not already)
 * 4. Return summary of settled orders
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ canteenId: string }> }
) {
  try {
    const { canteenId } = await params;
    const supabase = await createClient();

    // Authenticate super admin
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from("auth_sessions")
      .select("*")
      .eq("token", authToken)
      .eq("user_type", userType)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Parse request body (optional amount check and settlement options)
    const body = await request.json().catch(() => ({}));
    const { expectedAmount, orderIds, force } = body;

    // 1. Determine Cutoff Date (T-2 Logic)
    // We only settle orders that have "matured" past the T+2 window
    const cutoffDate = getSettlementEligibilityDate();
    
    console.log(`[Settlement API] Processing settlement for ${canteenId}`);
    if (force) {
      console.log(`[Settlement API] Force settlement enabled - Bypassing T-2 check`);
    } else if (orderIds?.length) {
      console.log(`[Settlement API] Settling specific orders: ${orderIds.length} orders`);
    } else {
      console.log(`[Settlement API] Cutoff Date (UTC boundary): ${cutoffDate.toISOString()}`);
    }

    // 2. Fetch Eligible Orders first (to verify amount)
    let query = supabase
      .from("orders")
      .select("id, canteen_amount, total_amount")
      .eq("canteen_id", canteenId)
      .eq("is_settled", false); // Only pending orders

    // Apply filters based on request type
    if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
      // Settle specific orders (ignore date)
      query = query.in("id", orderIds);
    } else if (force) {
      // Settle ALL pending orders (ignore date)
      // No date filter applied
    } else {
      // Default: Strict T-2 enforcement
      query = query.lte("created_at", cutoffDate.toISOString());
    }

    const { data: eligibleOrders, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!eligibleOrders || eligibleOrders.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: force 
          ? "No pending orders found to settle" 
          : "No eligible orders found for settlement (T-2 rules applied)" 
      });
    }

    // Calculate total to be settled
    const totalSettlementValue = eligibleOrders.reduce(
      (sum, order) => sum + (Number(order.canteen_amount) || 0), 
      0
    );

    console.log(`[Settlement API] Found ${eligibleOrders.length} orders totaling ${formatCurrency(totalSettlementValue)}`);

    // Verify amount matches expectation (if provided) - basic safety check
    if (expectedAmount && Math.abs(expectedAmount - totalSettlementValue) > 1.0) {
        console.warn(`[Settlement API] Amount mismatch! Expected: ${expectedAmount}, Calculated: ${totalSettlementValue}`);
        // We proceed but log warning, or could halt
    }

    // 3. Execute Settlement Update
    const { error: updateError, count } = await supabase
      .from("orders")
      .update({ 
        is_settled: true,
        updated_at: new Date().toISOString() 
        // We do NOT blindly set payment_status='paid' because POS orders might be 'pending' (cash pending)
        // Settlement here primarily refers to the *Platform paying the Canteen*
      })
      .in("id", eligibleOrders.map(o => o.id)); // Update exactly the orders we fetched

    if (updateError) throw updateError;
    
    // 3.5 Update Charges as 'Applied'
    // Mark ALL charges for these orders as applied
    const { error: chargesUpdateError } = await supabase
      .from("charges")
      .update({ applied: true })
      .in("order_id", eligibleOrders.map(o => o.id));

    if (chargesUpdateError) {
      console.error("[Settlement API] Error updating charges to applied:", chargesUpdateError);
    }

    // 3.7 Update Standalone Charges as 'Applied'
    // Also mark charges NOT tied to orders (standalone) as applied if they are within the same range
    let standaloneQuery = supabase
      .from("charges")
      .update({ applied: true })
      .eq("canteen_id", canteenId)
      .is("order_id", null)
      .eq("applied", false);

    if (!force) {
      standaloneQuery = standaloneQuery.lte("created_at", cutoffDate.toISOString());
    }

    const { error: standaloneChargesError } = await standaloneQuery;
    
    if (standaloneChargesError) {
      console.error("[Settlement API] Error updating standalone charges to applied:", standaloneChargesError);
    }

    // 4. Log the transaction (Optional: Create a Settlement Record table in future)
    // For now, we trust the `is_settled` flag on orders.

    return NextResponse.json({
      success: true,
      settledCount: eligibleOrders.length,
      settledAmount: totalSettlementValue,
      message: `Successfully settled ${eligibleOrders.length} orders totaling ${formatCurrency(totalSettlementValue)}`
    });

  } catch (error: any) {
    console.error("Error processing settlement:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process settlement" },
      { status: 500 }
    );
  }
}
