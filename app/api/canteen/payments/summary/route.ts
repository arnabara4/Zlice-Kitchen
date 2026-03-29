import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get auth token from cookies
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session exists and not expired
    const { data: session, error: sessionError } = await supabase
      .from("auth_sessions")
      .select("*")
      .eq("token", authToken)
      .eq("user_type", userType)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Get optional date filters from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get all canteens
    const { data: canteens, error: canteensError } = await supabase
      .from("canteens")
      .select("id, name, phone, address")
      .order("name");

    if (canteensError) throw canteensError;

    // For each canteen, calculate their earnings and payments
    const canteensWithStats = await Promise.all(
      (canteens || []).map(async (canteen) => {
        // Get total earned from online orders (where user_id is not null) with date filters
        let ordersQuery = supabase
          .from("orders")
          .select("order_items(quantity, canteen_price), packaging_fee,is_gst_enabled")
          .eq("canteen_id", canteen.id)
          .not("user_id", "is", null);

        // Apply date filters if provided
        if (startDate) {
          ordersQuery = ordersQuery.gte("created_at", startDate);
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte("created_at", endDate);
        }

        const { data: orders } = await ordersQuery;

        // Calculate total earnings with GST
        let totalEarned = 0;
        (orders || []).forEach((order: any) => {
          // Calculate items total using canteen_price
          const itemsTotal = (order.order_items || []).reduce(
            (sum: number, item: any) => sum + Number(item.canteen_price) * item.quantity,
            0
          );
          
          const packagingFee = Number(order.packaging_fee || 0);
          
          // GST is 5% of items subtotal only (not packaging)
          const gst = order.is_gst_enabled ? itemsTotal * 0.05 : 0;
          
          // Total = items + GST + packaging
          totalEarned += itemsTotal + gst + packagingFee;
        });

        // Get total paid from payments table
        const { data: payments } = await supabase
          .from("canteen_payments")
          .select("amount")
          .eq("canteen_id", canteen.id);

        const totalPaid = (payments || []).reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        );

        const pendingPayment = totalEarned - totalPaid;
        const onlineOrderCount = (orders || []).length;

        return {
          ...canteen,
          totalEarned,
          totalPaid,
          pendingPayment,
          onlineOrderCount,
        };
      })
    );

    return NextResponse.json(canteensWithStats);
  } catch (error) {
    console.error("Error fetching canteen payment summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment summary" },
      { status: 500 }
    );
  }
}
