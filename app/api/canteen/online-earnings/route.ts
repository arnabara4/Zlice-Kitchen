import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get auth token from cookies
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "canteen") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session exists and not expired
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

    const canteenId = session.user_id;

    // Get optional date filters from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get canteen details including GST status
    const { data: canteen, error: canteenError } = await supabase
      .from("canteens")
      .select("id, name, is_gst_enabled")
      .eq("id", canteenId)
      .single();

    if (canteenError || !canteen) {
      return NextResponse.json(
        { error: "Canteen not found" },
        { status: 404 }
      );
    }

    const isGstEnabled = canteen.is_gst_enabled || false;

    // Build query for online orders (where user_id is not null) for this canteen
    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        packaging_fee,
        packaging_amount,
        is_gst_enabled,
        created_at,
        user_id,
        canteen_amount,
        users (
          name,
          phone,
          roll_number
        ),
        order_items (
          id,
          quantity,
          canteen_price,
          menu_items (
            name,
            price
          )
        )
      `
      )
      .eq("canteen_id", canteenId)
      .not("user_id", "is", null)
      .not("status", "eq", "cancelled"); // Exclude cancelled orders

    // Apply date filters if provided
    // Dates come from frontend already converted to UTC timestamps
    if (startDate) {
      // Frontend sends start of day in UTC
      ordersQuery = ordersQuery.gte("created_at", startDate);
    }
    if (endDate) {
      // Frontend sends end of day (23:59:59.999) in UTC, use lte to include it
      ordersQuery = ordersQuery.lte("created_at", endDate);
    }

    ordersQuery = ordersQuery.order("created_at", { ascending: false });

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) throw ordersError;

    // Calculate total for each order
    const ordersWithTotals = (orders || []).map((order: any) => {
      // Sum of order items
      const itemsTotal = (order.order_items || []).reduce(
        (sum: number, item: any) => sum + item.canteen_price,
        0
      );

      // Add packaging fee
      const subtotal = itemsTotal + (order.packaging_amount || 0);

      // Apply GST if enabled (5%)
      const gstAmount = (order.is_gst_enabled) ? (subtotal-(order.packaging_amount || 0)) * 0.05 : 0;
      const totalAmount = subtotal + gstAmount;

      return {
        ...order,
        itemsTotal,
        packagingFee: order.packaging_amount || 0,
        subtotal,
        gstAmount,
        totalAmount,
        users: Array.isArray(order.users) ? order.users[0] : order.users,
      };
    });

    // Calculate grand totals
    const totalEarned = ordersWithTotals.reduce(
      (sum, order) => sum + order.canteen_amount,
      0
    );

    // Get total payments received
    const { data: payments, error: paymentsError } = await supabase
      .from("canteen_payments")
      .select("amount")
      .eq("canteen_id", canteenId);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    const totalPaid = (payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const totalDue = totalEarned - totalPaid;

    return NextResponse.json({
      orders: ordersWithTotals,
      stats: {
        totalEarned,
        totalPaid,
        totalDue,
        totalOrders: ordersWithTotals.length,
        isGstEnabled,
      },
      canteen: {
        id: canteen.id,
        name: canteen.name,
      },
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error fetching online earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings data" },
      { status: 500 }
    );
  }
}
