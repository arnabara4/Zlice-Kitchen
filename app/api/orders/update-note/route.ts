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
    const { orderId, note } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId" },
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
      order.canteen_id !== sessionData?.canteen_id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ note: note })
      .eq("id", orderId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Note update API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
