import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOrderNotification } from "@/lib/push-notification";
import bcrypt from "bcryptjs";

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

    // 🚀 PARALLEL EXECUTION: Fetch Delivery Man Status AND Orders simultaneously
    // This removes the waterfall where we waited for status check before fetching orders
    const [deliveryManResult, ordersResult] = await Promise.all([
      // Query 1: Check if delivery man is active
      supabase
        .from("delivery_man")
        .select("id, is_active")
        .eq("id", deliveryManId)
        .single(),

      // Query 2: Fetch the actual orders
      supabase
        .from("orders")
        .select(
          `
        id,
        order_number,
        status,
        payment_status,
        total_amount,
        delivery_fee,
        order_type,
        delivery_status,
        created_at,
        updated_at,
        completed_time,
        canteen_id,
        user_id,
        address_id,
        canteens (
          id,
          name,
          phone,
          address
        ),
        users (
          id,
          name,
          phone,
          email
        ),
        user_addresses (
          id,
          label,
          address,
          phone
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
        .neq("delivery_status", "delivered")
        .order("created_at", { ascending: false })
    ]);

    // Validation 1: Check Delivery Man Existence
    if (deliveryManResult.error || !deliveryManResult.data) {
      return NextResponse.json(
        { error: "Delivery man not found" },
        { status: 404 }
      );
    }

    // Validation 2: Check Active Status
    if (!deliveryManResult.data.is_active) {
      return NextResponse.json(
        { error: "Delivery man account is inactive" },
        { status: 403 }
      );
    }

    // Validation 3: Check Orders Result
    if (ordersResult.error) throw ordersResult.error;

    return NextResponse.json(ordersResult.data || []);
  } catch (error) {
    console.error("Error fetching my delivery orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery orders" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { orderId, deliveryStatus } = body;

    if (!orderId || !deliveryStatus) {
      return NextResponse.json(
        { error: "Order ID and delivery status are required" },
        { status: 400 }
      );
    }

    // Validate delivery status
    const validStatuses = [
      "assigned",
      "picked_up",
      "in_transit",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(deliveryStatus)) {
      return NextResponse.json(
        {
          error: `Invalid delivery status. Must be one of: ${validStatuses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Verify the order belongs to this delivery man
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, delivery_man_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.delivery_man_id !== deliveryManId) {
      return NextResponse.json(
        { error: "You are not assigned to this order" },
        { status: 403 }
      );
    }

    // Update the delivery status
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ delivery_status: deliveryStatus })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send push notification to user
    await sendOrderNotification(updatedOrder);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Delivery status updated to ${deliveryStatus}`,
    });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Failed to update delivery status" },
      { status: 500 }
    );
  }
}
