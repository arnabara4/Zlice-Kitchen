import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole("super_admin");
    if (error) return error;

    const adminId = session?.user_id;

    // Parse request body
    const body = await request.json();
    const {
      deliveryManId,
      amount,
      paymentMethod,
      transactionReference,
      coveredPeriod,
      notes,
    } = body;

    // Validate required fields
    if (!deliveryManId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Delivery man ID and valid amount are required" },
        { status: 400 }
      );
    }

    // Verify delivery man exists
    const { data: deliveryMan, error: deliveryManError } = await supabaseAdmin
      .from("delivery_man")
      .select("id, name")
      .eq("id", deliveryManId)
      .single();

    if (deliveryManError || !deliveryMan) {
      return NextResponse.json(
        { error: "Delivery man not found" },
        { status: 404 }
      );
    }

    // Insert payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("delivery_man_payments")
      .insert({
        delivery_man_id: deliveryManId,
        amount,
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod || null,
        transaction_reference: transactionReference || null,
        covered_period: coveredPeriod || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    return NextResponse.json({
      success: true,
      payment,
      message: `Payment of ₹${amount} recorded for ${deliveryMan.name}`,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
