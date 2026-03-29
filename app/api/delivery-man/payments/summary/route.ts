import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    // Verify super admin authentication
    const { session, error } = await validateAuthSessionWithRole("super_admin");
    if (error) return error;

    // Get optional date filters from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get all delivery men with their payment stats
    const { data: deliveryMen, error: deliveryMenError } = await supabaseAdmin
      .from("delivery_man")
      .select("id, name, phone, vehicle_type, is_active")
      .eq("is_active", true)
      .order("name");

    if (deliveryMenError) throw deliveryMenError;

    // For each delivery man, calculate their earnings and payments
    const deliveryMenWithStats = await Promise.all(
      (deliveryMen || []).map(async (dm) => {
        // Get total earned from delivered orders with date filters
        let ordersQuery = supabaseAdmin
          .from("orders")
          .select("delivery_partner_amount")
          .eq("delivery_man_id", dm.id)
          .eq("delivery_status", "delivered");

        // Apply date filters if provided
        if (startDate) {
          ordersQuery = ordersQuery.gte("created_at", startDate);
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte("created_at", endDate);
        }

        const { data: orders } = await ordersQuery;

        const totalEarned = (orders || []).reduce(
          (sum: number, order: any) => sum + (order.delivery_partner_amount || 0),
          0
        );

        // Get total paid from payments table
        const { data: payments } = await supabaseAdmin
          .from("delivery_man_payments")
          .select("amount")
          .eq("delivery_man_id", dm.id);

        const totalPaid = (payments || []).reduce(
          (sum: number, payment: any) => sum + payment.amount,
          0
        );

        const pendingPayment = totalEarned - totalPaid;
        const deliveryCount = (orders || []).length;

        return {
          ...dm,
          totalEarned,
          totalPaid,
          pendingPayment,
          deliveryCount,
        };
      })
    );

    return NextResponse.json(deliveryMenWithStats);
  } catch (error) {
    console.error("Error fetching delivery men payment summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery men" },
      { status: 500 }
    );
  }
}
