import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";

// Statuses that indicate the canteen has acknowledged the order
const STOP_ALERT_STATUSES = ['cooking', 'started', 'ready', 'completed', 'cancelled'];

export async function POST(req: Request) {
  try {
    // Validate authentication and session expiry
    const { session, error } = await validateAuthSession();
    if (error) return error;

    const sessionData = session;

    const body = await req.json();
    const { orderId, newStatus } = body;

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // 🔇 Fire-and-forget: Ping Zlice-Backend to send FCM stop_alert to Android devices
    if (STOP_ALERT_STATUSES.includes(newStatus)) {
      const backendUrl = process.env.ZLICE_BACKEND_URL;
      const apiKey = process.env.INTERNAL_API_KEY;

      console.log(`[StopAlert] Status=${newStatus}, backendUrl=${backendUrl ? 'SET' : 'NOT SET'}`);

      if (backendUrl && apiKey) {
        fetch(`${backendUrl}/api/internal/stop-alert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': apiKey,
          },
          body: JSON.stringify({
            canteenId: order.canteen_id,
            orderId: orderId,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              console.error(`[StopAlert] ❌ Backend returned ${res.status}`);
            } else {
              console.log(`[StopAlert] ✅ Stop alert sent for order ${orderId}`);
            }
          })
          .catch((err) => {
            console.error('[StopAlert] ❌ Failed to reach backend:', err.message);
          });
      } else {
        console.warn('[StopAlert] ⚠️ ZLICE_BACKEND_URL or INTERNAL_API_KEY not set — skipping stop alert');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Status update API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
