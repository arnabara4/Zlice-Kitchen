import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole("super_admin");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const deliveryManId = searchParams.get("deliveryManId");

    if (!deliveryManId) {
      return NextResponse.json(
        { error: "Delivery man ID is required" },
        { status: 400 }
      );
    }

    // Get payment history for the delivery man
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("delivery_man_payments")
      .select(
        `
        id,
        amount,
        paid_at,
        payment_method,
        transaction_reference,
        covered_period,
        notes,
        paid_by,
        users:paid_by (
          name
        )
      `
      )
      .eq("delivery_man_id", deliveryManId)
      .order("paid_at", { ascending: false });

    if (paymentsError) throw paymentsError;

    // Transform the data to include paid_by_name
    const transformedPayments = (payments || []).map((payment: any) => ({
      ...payment,
      paid_by_name: payment.users?.name || null,
      users: undefined, // Remove the nested object
    }));

    return NextResponse.json(transformedPayments);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
