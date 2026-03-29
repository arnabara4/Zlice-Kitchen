import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get auth token from cookies
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "canteen") {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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
        { status: 401 },
      );
    }

    const canteenId = session.user_id;

    // Get all delivery personnel associated with this canteen where earnings are visible
    const { data: deliveryMenCanteens, error: deliveryMenError } =
      await supabase
        .from("delivery_man_canteens")
        .select(
          `
        delivery_man_id,
        is_earning_visible
      `,
        )
        .eq("canteen_id", canteenId)
        .eq("is_earning_visible", true);

    if (deliveryMenError) throw deliveryMenError;

    if (!deliveryMenCanteens || deliveryMenCanteens.length === 0) {
      return NextResponse.json({ deliveryEarnings: [] });
    }

    // Get delivery men details
    const deliveryManIds = deliveryMenCanteens.map(
      (dmc) => dmc.delivery_man_id,
    );

    const { data: deliveryMen, error: dmError } = await supabase
      .from("delivery_man")
      .select("id, name, phone, is_active")
      .in("id", deliveryManIds);

    if (dmError) throw dmError;

    if (!deliveryMen || deliveryMen.length === 0) {
      return NextResponse.json({ deliveryEarnings: [] });
    }

    // For each delivery man, get their earnings and payment stats
    const deliveryEarnings = await Promise.all(
      deliveryMen.map(async (deliveryMan) => {
        const deliveryManId = deliveryMan.id;

        // Get delivered orders for this canteen
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(
            `
            id,
            order_number,
            status,
            payment_status,
            total_amount,
            delivery_fee,
            delivery_partner_amount,
            order_type,
            delivery_status,
            created_at,
            canteen_id,
            user_id,
            address_id,
            users (
              id,
              phone,
              name,
              roll_number
            ),
            order_items (
              id,
              menu_item_id,
              quantity,
              price,
              menu_items (
                id,
                name
              )
            )
          `,
          )
          .eq("delivery_man_id", deliveryManId)
          .eq("canteen_id", canteenId)
          .eq("delivery_status", "delivered")
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
        }

        // Get payments made to this delivery man
        const { data: payments, error: paymentsError } = await supabase
          .from("delivery_man_payments")
          .select(
            "amount, paid_at, payment_method, transaction_reference, notes",
          )
          .eq("delivery_man_id", deliveryManId);

        if (paymentsError) {
          console.error("Error fetching payments:", paymentsError);
        }

        const totalEarned = (orders || []).reduce(
          (sum, order) => sum + (order.delivery_partner_amount || 0),
          0,
        );

        const totalPaid = (payments || []).reduce(
          (sum, payment) => sum + payment.amount,
          0,
        );

        const pendingPayment = totalEarned - totalPaid;

        return {
          deliveryMan,
          stats: {
            totalEarned,
            totalPaid,
            pendingPayment,
            totalDeliveries: (orders || []).length,
          },
          recentOrders: (orders || []).slice(0, 10),
          recentPayments: (payments || []).slice(0, 5),
        };
      }),
    );

    return NextResponse.json({ deliveryEarnings });
  } catch (error) {
    console.error("Error fetching delivery earnings:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery earnings" },
      { status: 500 },
    );
  }
}
