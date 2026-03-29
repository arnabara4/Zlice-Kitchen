import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { session, error } = await validateAuthSessionWithRole('canteen');
    if (error) return error;

    const sessionData = session!;

    const body = await req.json();
    const {
      orderItems,
      canteenId,
      paymentStatus,
      orderType,
      orderNote,
      clientPackagingFee,
    } = body;

    if (!canteenId || sessionData.canteen_id !== canteenId) {
      return NextResponse.json(
        { error: "Forbidden. Canteen mismatch." },
        { status: 403 },
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: "Items required" }, { status: 400 });
    }

    // 1. Verify Canteen details
    const { data: canteen, error: canteenError } = await supabaseAdmin
      .from("canteens")
      .select(
        "id, name, is_gst_enabled, delivery_fee, packaging_fee_type, packaging_fee_per_item, total_packaging_fee",
      )
      .eq("id", canteenId)
      .single();

    if (canteenError || !canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    // 2. Fetch fresh menu items to calculate totals server-side
    const menuItemIds = orderItems.map((item: any) => item.menuItemId);
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("id, price, name")
      .in("id", menuItemIds);

    if (menuError || !menuItems) {
      return NextResponse.json(
        { error: "Failed to fetch menu items" },
        { status: 500 },
      );
    }

    const menuItemsMap = new Map(menuItems.map((item) => [item.id, item]));

    // 3. Calculate packaging fee
    let packagingFee = 0;
    if (orderType !== "dine-in") {
      const feeType = canteen.packaging_fee_type || "fixed";
      if (feeType === "per_item") {
        const totalQty = orderItems.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0,
        );
        packagingFee = totalQty * (canteen.packaging_fee_per_item || 0);
      } else {
        packagingFee = canteen.total_packaging_fee || 0;
      }
    }

    // Override with client packaging fee ONLY IF specifically needed and matches (for safety, better to use server calc)
    // We strictly use server calculation here.

    // 4. Calculate Delivery Fee
    const deliveryFee =
      orderType === "delivery" && canteen.delivery_fee
        ? canteen.delivery_fee
        : 0;

    // 5. Calculate Order Totals
    let totalAmt = 0;
    const dbOrderItems = [];

    for (const item of orderItems) {
      const dbItem = menuItemsMap.get(item.menuItemId);
      if (!dbItem) {
        return NextResponse.json(
          { error: `Menu item ${item.menuItemId} not found` },
          { status: 400 },
        );
      }
      totalAmt += dbItem.price * item.quantity;
      dbOrderItems.push({
        menu_item_id: dbItem.id,
        quantity: item.quantity,
        price: dbItem.price,
        canteen_price: dbItem.price,
      });
    }

    // 6. Calculate GST
    const gstAmount = canteen.is_gst_enabled ? totalAmt * 0.05 : 0;
    const finalTotal = totalAmt + gstAmount + packagingFee;

    const canteenAmount = canteen.is_gst_enabled
      ? finalTotal - deliveryFee
      : totalAmt + packagingFee + deliveryFee - deliveryFee; // effectively totalAmt + packagingFee

    // 7. Get Next Serial Number
    const now = new Date();
    const todayStartGMT = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const todayEndGMT = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const { data: latestOrder } = await supabaseAdmin
      .from("orders")
      .select("serial_number")
      .eq("canteen_id", canteen.id)
      .gte("created_at", todayStartGMT.toISOString())
      .lte("created_at", todayEndGMT.toISOString())
      .order("serial_number", { ascending: false })
      .limit(1)
      .single();

    const serialNumber = latestOrder ? latestOrder.serial_number + 1 : 1;
    const orderId = crypto.randomUUID();
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedOrderNumber = `${serialNumber}-${randSuffix}`;

    // 8. Insert Order
    const { error: orderError } = await supabaseAdmin.from("orders").insert({
      id: orderId,
      order_number: generatedOrderNumber,
      serial_number: serialNumber,
      status: "not_started",
      payment_status: paymentStatus,
      order_type: orderType,
      total_amount: canteen.is_gst_enabled
        ? finalTotal
        : finalTotal - gstAmount + deliveryFee,
      canteen_amount: canteenAmount,
      delivery_fee: deliveryFee,
      gst_amount_total: gstAmount,
      gst_amount_canteen: gstAmount,
      delivery_partner_amount: deliveryFee,
      packaging_fee: packagingFee,
      packaging_amount: packagingFee,
      is_gst_enabled: canteen.is_gst_enabled,
      canteen_id: canteen.id,
      note: orderNote,
      created_at: now.toISOString(),
      from_pos: true,
    });

    if (orderError)
      throw new Error(`Order insertion failed: ${orderError.message}`);

    // 9. Insert Items
    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(dbOrderItems.map((item) => ({ ...item, order_id: orderId })));

    if (itemsError)
      throw new Error(`Items insertion failed: ${itemsError.message}`);

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: generatedOrderNumber,
      serialNumber,
      totalAmount: canteen.is_gst_enabled
        ? finalTotal
        : finalTotal - gstAmount + deliveryFee,
      gstAmount,
      packagingFee,
      deliveryFee,
      items: dbOrderItems.map((item) => ({
        ...item,
        name: menuItemsMap.get(item.menu_item_id)?.name,
      })),
    });
  } catch (error: any) {
    console.error("Order creation API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
