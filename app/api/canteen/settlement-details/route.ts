import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { 
  calculateSettlementBreakdown, 
  calculatePlatformProfit,
  calculateCanteenAmount,
  isZliceOrder,
  getCanteenDayBounds,
} from "@/lib/financial-utils";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get auth token from cookies
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "canteen") {
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
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const canteenId = session.user_id;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    // Build day boundaries for the selected date (00:00 to 23:59 IST)
    const { start: startUTC, end: endUTC } = getCanteenDayBounds(dateStr);

    console.log(`[Settlement Details API] Fetching standard IST day: ${dateStr}`);
    console.log(`[Settlement Details API] UTC range: ${startUTC.toISOString()} → ${endUTC.toISOString()}`);

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        created_at,
        order_type,
        total_amount,
        canteen_amount,
        delivery_fee,
        packaging_fee,
        delivery_partner_amount,
        packaging_amount,
        gst_amount_total,
        gst_amount_canteen,
        is_gst_enabled,
        status,
        is_settled,
        user_id,
        charges,
        charge_reason,
        from_pos,
        order_items (
          quantity,
          menu_items (
            name
          )
        ),
        order_requests (
          order_request_items (
             quantity,
             menu_items (
                name
             )
          )
        )
      `)
      .eq("canteen_id", canteenId)
      .neq("status", "cancelled")
      .gte("created_at", startUTC.toISOString())
      .lte("created_at", endUTC.toISOString())
      .order("created_at", { ascending: false });

    if (ordersError) {
      throw new Error(ordersError.message);
    }

    // Map DB fields to OrderFinancials interface
    const orderFinancials = (orders ?? []).map(o => ({
      ...o,
      canteen_id: canteenId,
    }));

    // Aggregate breakdown
    const breakdown = calculateSettlementBreakdown(orderFinancials);

    // Format Orders List for Table
    const ordersList = orderFinancials.map(order => {
      const isZlice = isZliceOrder(order);
      const canteenAmt = calculateCanteenAmount(order);

      // Determine items source (delivery orders use order_requests)
      let itemsSource = order.order_items || [];
      if (itemsSource.length === 0 && order.order_requests) {
        const requests = Array.isArray(order.order_requests)
          ? order.order_requests
          : [order.order_requests];
        const requestItems = requests.flatMap((req: any) => req.order_request_items || []);
        if (requestItems.length > 0) {
          itemsSource = requestItems;
        }
      }

      const itemsList = itemsSource.map((item: any) => {
        const itemName = item.menu_items?.name || "Unknown Item";
        return `${item.quantity}x ${itemName}`;
      }).join(", ");

      // Normalise timestamp to IST for display
      const istTime = new Date(order.created_at).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      });

      return {
        orderId: order.id,
        orderType: order.order_type,
        orderValue: canteenAmt,
        platformFee: isZlice ? calculatePlatformProfit(order) : 0,
        netCanteenAmount: canteenAmt,
        settlementStatus: order.is_settled ? "Paid" : "Pending",
        isZlice,
        formattedTime: istTime,
        items: itemsList || "No items",
        packagingAmount: Number(order.packaging_amount) || Number(order.packaging_fee) || 0,
        deliveryAmount:  Number(order.delivery_partner_amount) || Number(order.delivery_fee) || 0,
        charges: Number(order.charges) || 0,
        chargeReason: order.charge_reason || "",
      };
    });

    return NextResponse.json({
      success: true,
      date: dateStr,
      breakdown: {
        totalOrders:   orders?.length ?? 0,
        grossAmount:   breakdown.totalRevenue,
        // Settled: sum of (canteen_amount - charges) where is_settled = true
        alreadyPaid:   orderFinancials
          .filter(o => o.is_settled)
          .reduce((sum, o) => sum + ((Number(o.canteen_amount) || 0) - (Number(o.charges) || 0)), 0),
        // Charges: sum of all charges for the day
        totalCharges: orderFinancials
          .reduce((sum, o) => sum + (Number(o.charges) || 0), 0),
        // Pending: sum of canteen_amount where is_settled = false, minus total charges
        pendingAmount: orderFinancials
          .filter(o => !o.is_settled)
          .reduce((sum, o) => sum + (Number(o.canteen_amount) || 0), 0) - 
          orderFinancials.reduce((sum, o) => sum + (Number(o.charges) || 0), 0),
        netPayable:    breakdown.canteenSettlement,
        platformFees:  breakdown.platformProfit + breakdown.gstRetained,
      },
      orders: ordersList,
    });

  } catch (error: any) {
    console.error("Error fetching settlement details:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlement details", details: error.message },
      { status: 500 }
    );
  }
}
