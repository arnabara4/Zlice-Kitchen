import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Verify delivery user authentication
    const { session, error } = await validateAuthSessionWithRole("delivery");
    if (error) return error;

    const deliveryManId = session?.user_id;

    // Verify delivery man exists and is active
    const { data: deliveryMan, error: deliveryManError } = await supabaseAdmin
      .from("delivery_man")
      .select("id, is_active, is_earning_visible")
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

    // If earning visibility is disabled, return empty results
    if (!deliveryMan.is_earning_visible) {
      return NextResponse.json({
        payments: [],
        stats: {
          totalEarned: 0,
          totalPaid: 0,
          pendingPayment: 0,
          paymentCount: 0,
        },
      });
    }

    // Get payment history
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
        notes
      `
      )
      .eq("delivery_man_id", deliveryManId)
      .order("paid_at", { ascending: false });

    if (paymentsError) throw paymentsError;

    // Get total earned from delivered orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("delivery_partner_amount")
      .eq("delivery_man_id", deliveryManId)
      .eq("delivery_status", "delivered");

    if (ordersError) throw ordersError;

    // Calculate stats
    const totalEarned = (orders || []).reduce(
      (sum, order) => sum + (order.delivery_partner_amount || 0),
      0
    );
    const totalPaid = (payments || []).reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const pendingPayment = totalEarned - totalPaid;
    const paymentCount = (payments || []).length;

    return NextResponse.json({
      payments: payments || [],
      stats: {
        totalEarned,
        totalPaid,
        pendingPayment,
        paymentCount,
      },
    });
  } catch (error) {
    console.error("Error fetching delivery man payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
