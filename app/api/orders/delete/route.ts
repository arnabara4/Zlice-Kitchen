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
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Ensure order belongs to canteen
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("canteen_id")
      .eq("id", orderId)
      .single();

    if (!order || order.canteen_id !== sessionData!.canteen_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete items first
    await supabaseAdmin.from("order_items").delete().eq("order_id", orderId);

    const { error: deleteError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete order API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
