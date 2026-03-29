import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;
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
      .select("user_id")
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

    // Call the Postgres RPC function for atomic execution
    const { data: result, error: rpcError } = await supabase
      .rpc('process_transaction_settlement', {
        p_transaction_id: transactionId,
        p_admin_id: session.user_id
      });

    if (rpcError) throw rpcError;

    // --- NEW: Sync 'applied' state for charges ---
    // The RPC marks orders as is_settled = true. We must now apply associated charges.
    // Fetch transaction details to get the boundary
    const { data: tx } = await supabase
      .from("transactions")
      .select("canteen_id, requested_at")
      .eq("id", transactionId)
      .single();
      
    if (tx) {
      // 1. Mark standalone charges as applied within the boundary
      const { error: standError } = await supabase
        .from("charges")
        .update({ applied: true })
        .eq("canteen_id", tx.canteen_id)
        .is("order_id", null)
        .lte("created_at", tx.requested_at)
        .eq("applied", false);

      if (standError) console.error("Failed to mark standalone charges applied", standError);
        
      // 2. Mark order-linked charges as applied
      // Get all Zlice orders for this canteen that are NOW settled and within the transaction boundary
      const { data: settledOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("canteen_id", tx.canteen_id)
        .eq("from_pos", false)
        .eq("is_settled", true)
        .lte("created_at", tx.requested_at);
        
      if (settledOrders && settledOrders.length > 0) {
        const orderIds = settledOrders.map(o => o.id);
        const chunkSize = 100; // Chunk to prevent URL length limits in Postgres REST API
        for (let i = 0; i < orderIds.length; i += chunkSize) {
            const chunk = orderIds.slice(i, i + chunkSize);
            const { error: ordError } = await supabase
              .from("charges")
              .update({ applied: true })
              .in("order_id", chunk)
              .eq("applied", false);
            if (ordError) console.error("Failed to mark order charges applied", ordError);
        }
      }
    }

    const rpcResponse = Array.isArray(result) ? result[0] : result;

    if (!rpcResponse || !rpcResponse.success) {
      return NextResponse.json({
        success: false,
        message: rpcResponse?.message || "Failed to process transaction"
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: rpcResponse.message,
      settledCount: rpcResponse.settled_count,
      settledAmount: rpcResponse.settled_amount
    });

  } catch (error: any) {
    console.error("Error confirming transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm transaction" },
      { status: 500 }
    );
  }
}
