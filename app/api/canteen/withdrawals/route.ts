import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAuthSessionWithRole } from "@/lib/api-auth";
import { formatCurrency } from "@/lib/financial-utils";

/**
 * GET /api/canteen/withdrawals
 * 
 * Fetches the withdrawal transaction history for the authenticated canteen.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { session, error } = await validateAuthSessionWithRole("canteen");
    
    if (error || !session) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("canteen_id", session.canteen_id);

    if (from) query = query.gte("requested_at", from);
    if (to) query = query.lte("requested_at", to);

    const { data: transactions, error: fetchError, count } = await query
      .order("requested_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });

  } catch (err: any) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/canteen/withdrawals
 * 
 * Creates a new withdrawal request for the authenticated canteen.
 * It computes the current unsettled balance and creates a transaction record.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { session, error } = await validateAuthSessionWithRole("canteen");
    
    if (error || !session) {
      return error || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canteenId = session.canteen_id;

    // 1. Calculate unsettled balance
    // Get pending Zlice orders (from_pos = false)
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
        message: "No pending settled amount available for withdrawal."
      });
    }

    const rawNetDue = unsettledOrders.reduce(
      (sum, order) => sum + (Number(order.canteen_amount) || 0),
      0
    );

    // Calculate pending charges (query from charges table for these specific active unsettled order IDs)
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

    // Final withdrawal amount
    const withdrawalAmount = Math.max(0, rawNetDue - totalCharges);

    if (withdrawalAmount <= 0) {
       return NextResponse.json({
        success: false,
        message: "Your pending balance is zero or negative due to charges."
      });
    }

    // 2. Insert transaction
    
    const {data : existingTransaction, error: existingError} = await supabase.from("transactions")
    .select("id")
    .eq("canteen_id",canteenId)
    .eq("status","pending")
    .maybeSingle()

    if (existingError) throw existingError;

    let transactionResult

    if(existingTransaction){
      const {data,error} = await supabase
      .from("transactions")
      .update({
        amount:withdrawalAmount,
        requested_at:new Date().toISOString()
      })
      .eq("id",existingTransaction.id)
      .select()
      .single();

      if(error) throw error;

      transactionResult = data;
    }else {
      const {data, error} = await supabase
      .from("transactions")
      .insert({
        canteen_id: canteenId,
        amount: withdrawalAmount,
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

      if (error) throw error;

      transactionResult = data;
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal request for ${formatCurrency(withdrawalAmount)} created successfully!`,
      transaction: transactionResult
    });

  } catch (err: any) {
    console.error("Error creating withdrawal:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
}
