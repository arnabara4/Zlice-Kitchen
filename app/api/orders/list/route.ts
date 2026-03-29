import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get("canteenId");

    if (!canteenId) {
      return NextResponse.json(
        { error: "Missing canteen ID" },
        { status: 400 },
      );
    }

    // Validate authentication and session expiry
    const { session, error } = await validateAuthSession();
    if (error) return error;

    if (session?.canteen_id !== canteenId) {
      return NextResponse.json(
        { error: "Forbidden: Canteen mismatch" },
        { status: 403 },
      );
    }

    // Fetch orders for this canteen with optimized selection
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total_amount, canteen_amount, created_at, order_mode, scheduled_date, payment_status, order_items(menu_item_id, quantity)")
      .eq("canteen_id", canteenId)
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    // Transform shape to match the old expected shape slightly
    const formattedOrders = ordersData.map((order) => ({
      ...order,
      items: order.order_items,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error("Orders GET API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
