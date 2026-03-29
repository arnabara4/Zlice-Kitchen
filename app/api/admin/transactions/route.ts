import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
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

    // Fetch transactions with Canteen Names
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(`
        *,
        canteens (
          name
        )
      `)
      .order("paid", { ascending: true }) // Pending first
      .order("requested_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error: any) {
    console.error("Error fetching admin transactions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/transactions
 * 
 * Allows an admin to explicitly create a withdrawal transaction for a specific canteen,
 * bypassing the need for the canteen operator to request it themselves.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate super admin
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Parse payload
    const body = await request.json().catch(() => ({}));
    const { canteenId, amount } = body;

    if (!canteenId) {
       return NextResponse.json({ error: "canteenId is required" }, { status: 400 });
    }

    // Calculate unsettled balance for the canteen
    const { data: unsettledOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, canteen_amount")
      .eq("canteen_id", canteenId)
      .eq("from_pos", false)
      .eq("is_settled", false);

    if (ordersError) throw ordersError;

    if (!unsettledOrders || unsettledOrders.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No pending settled amount available for this canteen to generate a transaction."
      });
    }

    const rawNetDue = unsettledOrders.reduce(
      (sum, order) => sum + (Number(order.canteen_amount) || 0),
      0
    );

    const unsettledOrderIds = unsettledOrders.map(o => o.id);
    let totalCharges = 0;
    
    if (unsettledOrderIds.length > 0) {
      const { data: chargesData, error: chargesError } = await supabase
        .from("charges")
        .select("charge_amount, applied")
        .in("order_id", unsettledOrderIds);
        
      if (!chargesError && chargesData) {
        totalCharges = chargesData
          .filter(c => !c.applied)
          .reduce((sum, charge) => sum + (Number(charge.charge_amount) || 0), 0);
      }
    }

    // Also fetch standalone unapplied charges
    const { data: standaloneData, error: standaloneError } = await supabase
      .from("charges")
      .select("charge_amount")
      .eq("canteen_id", canteenId)
      .is("order_id", null)
      .eq("applied", false);
      
    let standaloneCharges = 0;
    if (!standaloneError && standaloneData) {
      standaloneCharges = standaloneData.reduce((sum, c) => sum + (Number(c.charge_amount) || 0), 0);
    }
    
    totalCharges += standaloneCharges;

    const calculatedWithdrawalAmount = Math.max(0, rawNetDue - totalCharges);

    // Use custom amount if provided, otherwise use calculated maximum
    const finalAmount = (typeof amount === 'number' && amount > 0) 
      ? amount 
      : calculatedWithdrawalAmount;

    if (finalAmount <= 0) {
       return NextResponse.json({
        success: false,
        message: "Amount must be strictly positive."
      });
    }

    // Insert new transaction
    const { data: newTransaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        canteen_id: canteenId,
        amount: finalAmount
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: `Transaction generated for canteen. Amount: ₹${finalAmount.toFixed(2)}`,
      transaction: newTransaction
    });

  } catch (err: any) {
    console.error("Error creating forced admin transaction:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
