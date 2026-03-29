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
    const { orderId, paymentStatus } = body;

    if (!orderId || !paymentStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Verify order belongs to this canteen
    const { data: order, error: orderCheckError } = await supabaseAdmin
      .from("orders")
      .select("canteen_id")
      .eq("id", orderId)
      .single();

    if (
      orderCheckError ||
      !order ||
      order.canteen_id !== sessionData!.canteen_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment update API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
