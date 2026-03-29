import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole("super_admin");
    if (error) return error;

    // Parse request body
    const body = await request.json();
    const {
      canteen_id,
      amount,
      payment_method,
      transaction_reference,
      covered_period,
      notes,
    } = body;

    // Validate required fields
    if (!canteen_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Kitchen ID and valid amount are required" },
        { status: 400 }
      );
    }

    // Insert payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("canteen_payments")
      .insert({
        canteen_id,
        amount: parseFloat(amount),
        payment_method,
        transaction_reference,
        covered_period,
        notes,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
