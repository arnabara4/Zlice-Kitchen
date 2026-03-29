import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    // Validate authentication and session expiry
    const { session, error } = await validateAuthSession();
    if (error) return error;

    const sessionData = session;

    const body = await req.json();
    const { orderId, orderItems, canteenId } = body;

    // Ensure order belongs to canteen
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("canteen_id, delivery_fee, packaging_fee, is_gst_enabled")
      .eq("id", orderId)
      .single();

    if (
      !order ||
      order.canteen_id !== sessionData!.canteen_id ||
      canteenId !== sessionData!.canteen_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const deliveryFee = order?.delivery_fee || 0;
    const packagingFee = order?.packaging_fee || 0;

    // Calculate base items total
    const itemsTotal = orderItems.reduce(
      (sum: number, item: any) => sum + item.canteen_price * item.quantity,
      0,
    );

    // Calculate GST
    const gstAmount = order.is_gst_enabled ? itemsTotal * 0.05 : 0;

    // Calculate Grand Total (Items + GST + Packaging + Delivery)
    const newTotalAmount = itemsTotal + gstAmount + packagingFee + deliveryFee;

    // Calculate Canteen Amount (Total - Delivery)
    // This ensures delivery fee is never part of the canteen's revenue
    const newCanteenAmount = newTotalAmount - deliveryFee;

    // Step 1: Delete existing order items
    const { error: deleteError } = await supabaseAdmin
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (deleteError) {
      throw new Error(`Failed to delete old items: ${deleteError.message}`);
    }

    // Step 2: Insert updated order items
    const itemsForDB = orderItems.map((item: any) => ({
      order_id: orderId,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      price: item.canteen_price,
      canteen_price: item.canteen_price,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(itemsForDB);

    if (itemsError) {
      throw new Error(`Failed to insert items: ${itemsError.message}`);
    }

    // Step 3: Update order totals
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        total_amount: newTotalAmount,
        canteen_amount: newCanteenAmount,
        gst_amount_total: gstAmount,
        gst_amount_canteen: gstAmount,
      })
      .eq("id", orderId);

    if (updateError) {
      throw new Error(`Failed to update order: ${updateError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Order edit API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
