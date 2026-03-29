import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendOrderNotification } from "@/lib/push-notification";
import { json } from "stream/consumers";

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

    // Verify delivery man exists and is active
    const { data: deliveryMan, error: deliveryManError } = await supabase
      .from("delivery_man")
      .select("id, is_active")
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

    // Get canteen IDs that this delivery man can deliver to
    const { data: canteenAssignments, error: canteenError } = await supabase
      .from("delivery_man_canteens")
      .select("canteen_id")
      .eq("delivery_man_id", deliveryManId);

    if (canteenError) throw canteenError;

    if (!canteenAssignments || canteenAssignments.length === 0) {
      return NextResponse.json([]);
    }

    const canteenIds = canteenAssignments.map(
      (assignment) => assignment.canteen_id
    );

    // Get all delivery orders for those canteens where no delivery man is assigned yet
    // Use standard client to fetch customer details (RLS policies must allow this)
    const { data: orders, error: ordersError } = await supabase
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
      .eq("order_type", "delivery")
      .is("delivery_man_id", null)
      .in("canteen_id", canteenIds)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    // Map delivery_partner_amount to delivery_fee in response
    const ordersWithPartnerAmount = (orders || []).map(order => ({
      ...order,
      delivery_fee: order.delivery_partner_amount || order.delivery_fee
    }));

    return NextResponse.json(ordersWithPartnerAmount);
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || !userType) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    const deliveryManId = session.user_id;

    // Verify delivery man exists and is active
    const { data: deliveryMan, error: deliveryManError } = await supabase
      .from("delivery_man")
      .select("id, is_active")
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

    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get canteen IDs that this delivery man can deliver to
    const { data: canteenAssignments, error: canteenError } = await supabase
      .from("delivery_man_canteens")
      .select("canteen_id")
      .eq("delivery_man_id", deliveryManId);

    if (canteenError) throw canteenError;

    if (!canteenAssignments || canteenAssignments.length === 0) {
      return NextResponse.json(
        { error: "No kitchens assigned to this delivery person" },
        { status: 403 }
      );
    }

    const canteenIds = canteenAssignments.map(
      (assignment) => assignment.canteen_id
    );

    // Verify order exists and belongs to assigned canteen
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, canteen_id, order_type, delivery_man_id")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.order_type !== "delivery") {
      return NextResponse.json(
        { error: "This order is not a delivery order" },
        { status: 400 }
      );
    }

    if (!canteenIds.includes(order.canteen_id)) {
      return NextResponse.json(
        { error: "You are not authorized to deliver for this kitchen" },
        { status: 403 }
      );
    }

    if (order.delivery_man_id) {
      return NextResponse.json(
        { error: "This order is already assigned to a delivery person" },
        { status: 400 }
      );
    }

    // Assign order to delivery man
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        delivery_man_id: deliveryManId,
        delivery_status: "assigned",
      })
      .eq("id", orderId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Send push notification to user
    await sendOrderNotification(updatedOrder);

    return NextResponse.json({
      message: "Order accepted successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error accepting delivery order:", error);
    return NextResponse.json(
      { error: "Failed to accept delivery order" },
      { status: 500 }
    );
  }
}
