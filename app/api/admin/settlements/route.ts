import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  OrderForSettlement,
  aggregateCanteenSettlement,
  formatSettlementDate,
  getISTDayStart,
  getISTDayEnd,
  getISTDate,
} from "@/lib/financial-utils";
import type { SettlementsAPIResponse, CanteenSettlementRow } from "@/types/analytics";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

/**
 * GET /api/admin/settlements
 * 
 * Returns settlement data for the selected date (IST).
 * No T-2 transformation — shows orders for the exact selected date.
 * Groups orders by canteen and aggregates financial breakdown.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate super admin
    const { session, error: authError } = await validateAuthSessionWithRole("super_admin");
    if (authError || !session) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params (supports single date OR range)
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Determine selection (default to all time if nothing provided)
    let selectedFrom: Date | undefined;
    let selectedTo: Date | undefined;
    let queryStart: Date | undefined;
    let queryEnd: Date | undefined;

    if (fromParam && toParam) {
      selectedFrom = new Date(fromParam);
      selectedTo = new Date(toParam);
    } else if (dateParam && dateParam !== 'all') {
      selectedFrom = new Date(dateParam);
      selectedTo = new Date(dateParam);
    }

    if (selectedFrom && selectedTo) {
      // Convert selected dates to IST day boundaries for DB query (no T-2 transformation)
      queryStart = getISTDayStart(selectedFrom);
      queryEnd = getISTDayEnd(selectedTo);
      
      // Debug logging
      console.log('[Settlements API] --------------------------------------------------');
      console.log(`[Settlements API] Selected: ${selectedFrom.toISOString()} TO ${selectedTo.toISOString()}`);
      console.log(`[Settlements API] DB Query: >= ${queryStart.toISOString()} AND <= ${queryEnd.toISOString()}`);
      console.log('[Settlements API] --------------------------------------------------');
    } else {
      console.log('[Settlements API] --------------------------------------------------');
      console.log('[Settlements API] Selected: ALL TIME');
      console.log('[Settlements API] --------------------------------------------------');
    }

    // Fetch all canteens
    const { data: canteens, error: canteensError } = await supabase
      .from("canteens")
      .select("id, name")
      .order("name");

    if (canteensError) throw canteensError;

    // Fetch orders within the selected date range (IST boundaries) or all time
    let ordersQuery = supabase
      .from("orders")
      .select(`
        id,
        user_id,
        canteen_id,
        total_amount,
        canteen_amount,
        delivery_fee,
        packaging_fee,
        delivery_partner_amount,
        packaging_amount,
        gst_amount_total,
        gst_amount_canteen,
        is_gst_enabled,
        created_at,
        from_pos,
        order_type,
        is_settled,
        charges_data:charges(id, charge_amount, charge_reason, applied)
      `);

    // Fetch standalone charges for ALL canteens in the date range
    let standaloneChargesQuery = supabase
      .from("charges")
      .select("canteen_id, charge_amount, applied")
      .is("order_id", null);

    if (queryStart && queryEnd) {
      standaloneChargesQuery = standaloneChargesQuery
        .gte("created_at", queryStart.toISOString())
        .lte("created_at", queryEnd.toISOString());
    }

    const { data: standaloneCharges } = await standaloneChargesQuery;
    
    // Group standalone charges by canteenId
    const standaloneChargesMap = new Map<string, { applied: number, unapplied: number }>();
    (standaloneCharges || []).forEach((c: any) => {
      const cid = c.canteen_id;
      if (cid) {
        const current = standaloneChargesMap.get(cid) || { applied: 0, unapplied: 0 };
        if (c.applied) {
          current.applied += (Number(c.charge_amount) || 0);
        } else {
          current.unapplied += (Number(c.charge_amount) || 0);
        }
        standaloneChargesMap.set(cid, current);
      }
    });

    if (queryStart && queryEnd) {
      ordersQuery = ordersQuery
        .gte("created_at", queryStart.toISOString())
        .lte("created_at", queryEnd.toISOString());
    }

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError || !orders) throw ordersError || new Error("Missing orders data");

    // Transform to OrderForSettlement type
    const ordersForSettlement: OrderForSettlement[] = (orders || []).map((order) => {
      const chargesArray = order.charges_data || [];
      const totalCharges = chargesArray.reduce((sum: number, charge: any) => sum + (Number(charge.charge_amount) || 0), 0);
      const chargeReasons = chargesArray
        .map((charge: any) => charge.charge_reason)
        .filter(Boolean)
        .join("; ");

      return {
        id: order.id,
        user_id: order.user_id,
        canteen_id: order.canteen_id,
        total_amount: Number(order.total_amount) || 0,
        canteen_amount: Number(order.canteen_amount) || 0,
        delivery_fee: Number(order.delivery_fee) || 0,
        packaging_fee: Number(order.packaging_fee) || 0,
        delivery_partner_amount: Number(order.delivery_partner_amount) || 0,
        packaging_amount: Number(order.packaging_amount) || 0,
        gst_amount_total: Number(order.gst_amount_total) || 0,
        gst_amount_canteen: Number(order.gst_amount_canteen) || 0,
        is_gst_enabled: order.is_gst_enabled || false,
        created_at: order.created_at,
        is_settled: order.is_settled || false,
        from_pos: order.from_pos || false,
        order_type: order.order_type || 'Takeaway',
        charges: totalCharges,
        charge_reason: chargeReasons || '',
        // Note: the order itself doesn't have 'applied', but we preserve is_settled status
        // Individual charges hold the applied status. Here we set a general flag if needed,
        // but it's not used by calculateOrderSettlement directly.
        applied: order.is_settled
      };
    });

    // Group orders by canteen
    const ordersByCanteen = new Map<string, OrderForSettlement[]>();
    for (const order of ordersForSettlement) {
      const existing = ordersByCanteen.get(order.canteen_id) || [];
      existing.push(order);
      ordersByCanteen.set(order.canteen_id, existing);
    }

    // Create canteen name map
    const canteenNameMap = new Map<string, string>();
    for (const canteen of canteens || []) {
      canteenNameMap.set(canteen.id, canteen.name);
    }

    // Aggregate settlement data per canteen
    const canteenSettlements: CanteenSettlementRow[] = [];
    
    for (const canteen of canteens || []) {
      const canteenId = canteen.id;
      const canteenName = canteen.name;
      const canteenOrders = ordersByCanteen.get(canteenId) || [];
      const standalone = standaloneChargesMap.get(canteenId) || { applied: 0, unapplied: 0 };
      const standaloneChargesAmount = standalone.applied + standalone.unapplied;
      
      // Skip if no orders AND no standalone charges
      if (canteenOrders.length === 0 && standaloneChargesAmount === 0) continue;

      // Check if all orders are settled
      const allSettled = canteenOrders.every(order => order.is_settled);
      const status: 'pending' | 'settled' = allSettled && canteenOrders.length > 0 ? 'settled' : 'pending';
      
      const summary = aggregateCanteenSettlement(
        canteenOrders,
        canteenId,
        canteenName,
        status
      );

      // Add standalone charges to the summary
      summary.totalCharges += standaloneChargesAmount;
      
      // Deduct applied standalone from paidAmount
      summary.paidAmount = Math.max(0, (summary.paidAmount || 0) - standalone.applied);
      
      // Deduct unapplied standalone from dueAmount
      summary.dueAmount = Math.max(0, (summary.dueAmount || 0) - standalone.unapplied);
      
      // Update settlementAmount
      summary.settlementAmount = (summary.paidAmount || 0) + (summary.dueAmount || 0);

      canteenSettlements.push(summary);
    }

    // Sort by settlement amount descending
    canteenSettlements.sort((a, b) => b.settlementAmount - a.settlementAmount);

    // Calculate grand totals
    const totals = {
      totalRevenue: 0,
      gatewayAmount: 0,
      foodValue: 0,
      deliveryAmount: 0,
      packagingAmount: 0,
      gstAmount: 0,
      totalCharges: 0,
      settlementAmount: 0,
      paidAmount: 0,
      dueAmount: 0,
      profit: 0,
      orderCount: 0,
    };

    for (const c of canteenSettlements) {
      totals.totalRevenue += c.totalRevenue;
      totals.gatewayAmount += c.gatewayAmount;
      totals.foodValue += c.foodValue;
      totals.deliveryAmount += c.deliveryAmount;
      totals.packagingAmount += c.packagingAmount;
      totals.gstAmount += c.gstAmount;
      totals.totalCharges += c.totalCharges;
      totals.paidAmount += (c.paidAmount || 0);
      totals.dueAmount += (c.dueAmount || 0);
      totals.settlementAmount += c.settlementAmount;
      totals.profit += c.profit;
      totals.orderCount += c.orderCount;
    }

    // Debug logging
    console.log(`[Settlements API] Orders: ${orders?.length}, Total Revenue: ${totals.totalRevenue}, Total Charges: ${totals.totalCharges}`);

    // Format display date
    const selectedDateFormatted = selectedFrom && selectedTo 
      ? (selectedFrom.getTime() === selectedTo.getTime() 
          ? formatSettlementDate(getISTDate(selectedFrom))
          : `${formatSettlementDate(getISTDate(selectedFrom))} - ${formatSettlementDate(getISTDate(selectedTo))}`)
      : 'All Time';

    const response: SettlementsAPIResponse = {
      success: true,
      selectedDate: selectedFrom ? selectedFrom.toISOString() : 'All Time',
      selectedDateFormatted,
      canteens: canteenSettlements,
      totals,
      debug: {
        orderCount: orders?.length || 0,
        rawTotalRevenue: totals.totalRevenue
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error in settlements API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

