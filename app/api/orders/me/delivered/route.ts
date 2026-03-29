import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get auth token from cookies
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || !userType) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    const deliveryManId = session.user_id;

    // Get optional date filters from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Verify delivery man exists and is active
    const { data: deliveryMan, error: deliveryManError } = await supabase
      .from("delivery_man")
      .select("id, is_active, is_earning_visible")
      .eq("id", deliveryManId)
      .single();

    if (deliveryManError || !deliveryMan) {
      return NextResponse.json(
        { error: "Delivery man not found" },
        { status: 404 }
      );
    }

    if (!deliveryMan.is_active) {
      return NextResponse.json(
        { error: "Delivery man account is inactive" },
        { status: 403 }
      );
    }

    // If earning visibility is disabled, return empty results
    if (!deliveryMan.is_earning_visible) {
      return NextResponse.json({
        orders: [],
        stats: {
          totalEarned: 0,
          totalPaid: 0,
          pendingPayment: 0,
          totalDeliveries: 0,
        },
      });
    }

    // Build query for orders assigned to this delivery man
    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        delivery_fee,
        delivery_partner_amount,
        order_type,
        delivery_status,
        created_at,
        canteen_id,
        canteens (
          id,
          name,
          phone,
          address
        ),
        order_items (
          id,
          menu_item_id,
          quantity,
          price,
          menu_items (
            id,
            name
          )
        )
      `
      )
      .eq("delivery_man_id", deliveryManId)
      .eq("delivery_status", 'delivered');

    // Apply date filters if provided
    // Dates come from frontend already converted to UTC timestamps
    if (startDate) {
      ordersQuery = ordersQuery.gte("created_at", startDate);
    }
    if (endDate) {
      ordersQuery = ordersQuery.lte("created_at", endDate);
    }

    ordersQuery = ordersQuery.order("created_at", { ascending: false });

    const { data: orders, error: ordersError } = await ordersQuery;

    if (ordersError) throw ordersError;

    // Get total payments received by this delivery man
    const { data: payments, error: paymentsError } = await supabase
      .from("delivery_man_payments")
      .select("amount")
      .eq("delivery_man_id", deliveryManId);

    if (paymentsError) {
      console.error("Error fetching payments:", paymentsError);
    }

    // Map delivery_partner_amount to delivery_fee in response
    const ordersWithPartnerAmount = (orders || []).map(order => ({
      ...order,
      delivery_fee: order.delivery_partner_amount || order.delivery_fee
    }));

    // Calculate totals using delivery_partner_amount
    const totalEarned = (orders || []).reduce((sum, order) => sum + (order.delivery_partner_amount || order.delivery_fee || 0), 0);
    const totalPaid = (payments || []).reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayment = totalEarned - totalPaid;

    return NextResponse.json({
      orders: ordersWithPartnerAmount,
      stats: {
        totalEarned,
        totalPaid,
        pendingPayment,
        totalDeliveries: (orders || []).length,
      },
    });
  } catch (error) {
    console.error("Error fetching my delivery orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery orders" },
      { status: 500 }
    );
  }
}