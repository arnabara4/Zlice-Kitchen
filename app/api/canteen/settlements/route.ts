
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  getSettlementEligibilityDate, 
  resolveSettlementDateRange, 
  formatCurrency 
} from "@/lib/financial-utils";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

/**
 * GET /api/canteen/settlements
 * 
 * Returns settlement data for a specific TRANSACTION date (Order Created Date) or all time.
 * Strictly filters by currently authenticated canteen.
 * 
 * Query Params:
 * - date: The transaction date (YYYY-MM-DD). If omitted or 'all', fetches all time.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate Canteen User
    const { session, error: authError } = await validateAuthSessionWithRole("canteen");
    
    if (authError || !session || !session.canteen_id) {
      return authError || NextResponse.json({ error: "Unauthorized or Missing Kitchen Context" }, { status: 401 });
    }
    
    const canteenId = session.canteen_id;
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    
    // Determine the Target Transaction Date
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    // Fetch Orders created strictly within this date range (if provided)
    // STRICT FILTER: canteen_id = session.canteen_id AND from_pos = false
    let query = supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        canteen_amount,
        delivery_fee,
        packaging_fee,
        created_at,
        is_settled,
        order_type,
        from_pos,
        coupon:coupon_id(code),
        charges_data:charges(charge_amount, applied)
      `)
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });
      
    if (dateParam && dateParam !== 'all') {
      const transactionDate = new Date(dateParam);
      // Set to start of day (00:00:00)
      startDate = new Date(transactionDate);
      startDate.setHours(0, 0, 0, 0);
      
      // Set to end of day (23:59:59)
      endDate = new Date(transactionDate);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    // Fetch standalone charges for this canteen
    let standaloneChargesQuery = supabase
      .from("charges")
      .select("charge_amount, applied")
      .eq("canteen_id", canteenId)
      .is("order_id", null);

    if (startDate && endDate) {
      standaloneChargesQuery = standaloneChargesQuery
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
    }

    const { data: standaloneChargesData } = await standaloneChargesQuery;
    
    let appliedChargesTotal = 0;
    let unappliedChargesTotal = 0;

    (standaloneChargesData || []).forEach((c) => {
      const amt = Number(c.charge_amount) || 0;
      if (c.applied) appliedChargesTotal += amt;
      else unappliedChargesTotal += amt;
    });

    const { data: orders, error: ordersError } = await query;

    if (ordersError || !orders) throw ordersError || new Error("Missing orders data");

    // Aggregate Data
    let totalCanteenRevenue = 0;
    let rawPendingAmount = 0;
    let rawSettledAmount = 0;
    
    const formattedOrders = orders.map((order: any) => {
        const chargesArray = order.charges_data || [];
        const orderCharges = chargesArray.reduce((sum: number, charge: any) => sum + (Number(charge.charge_amount) || 0), 0);
        
        chargesArray.forEach((c: any) => {
            if (c.applied) appliedChargesTotal += (Number(c.charge_amount) || 0);
            else unappliedChargesTotal += (Number(c.charge_amount) || 0);
        });
        
        const canteenAmount = Number(order.canteen_amount) || 0;
        const totalAmount = Number(order.total_amount) || 0;
        const netOrderSettlement = Math.max(0, canteenAmount - orderCharges);
        
        totalCanteenRevenue += canteenAmount;
        
        if (order.is_settled) {
            rawSettledAmount += canteenAmount;
        } else {
            rawPendingAmount += canteenAmount;
        }
        
        return {
            id: order.id,
            orderNumber: order.order_number,
            createdAt: order.created_at,
            type: order.order_type,
            totalAmount: totalAmount,
            settlementAmount: netOrderSettlement,
            charges: orderCharges,
            status: order.is_settled ? 'Settled' : 'Pending',
            transactionDate: startDate ? startDate.toISOString() : 'All Time',
            couponCode: order.coupon?.code
        };
    });

    // --- Refined Robust Calculation ---
    // 1. Pending (Due) = Unsettled Gross - Unapplied Charges
    const finalPendingAmount = Math.max(0, rawPendingAmount - unappliedChargesTotal);
    
    // 2. Settled = Settled Gross - Applied Charges
    const finalSettledAmount = rawSettledAmount - appliedChargesTotal;
    
    const grandTotalCharges = appliedChargesTotal + unappliedChargesTotal;
    
    return NextResponse.json({
        success: true,
        summary: {
            transactionDate: startDate ? startDate.toISOString() : 'All Time',
            orderQueryStart: startDate ? startDate.toISOString() : 'All Time',
            orderQueryEnd: endDate ? endDate.toISOString() : 'All Time',
            totalOrders: orders.length,
            totalAmount: totalCanteenRevenue,
            totalCharges: grandTotalCharges,
            settledAmount: finalSettledAmount,
            pendingAmount: finalPendingAmount,
            status: finalPendingAmount <= 0 && orders.length > 0 ? 'Fully Settled' : 'Pending'
        },
        orders: formattedOrders
    });

  } catch (error: any) {
    console.error("Error in kitchen settlement API:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}
