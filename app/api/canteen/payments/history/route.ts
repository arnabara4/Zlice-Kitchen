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

    // Get canteen ID from query params
    const { searchParams } = new URL(request.url);
    const canteenId = searchParams.get("canteenId");

    if (!canteenId) {
      return NextResponse.json(
        { error: "Kitchen ID is required" },
        { status: 400 }
      );
    }

    // Get payment history for this canteen
    const { data: payments, error: paymentsError } = await supabase
      .from("canteen_payments")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("paid_at", { ascending: false });

    if (paymentsError) throw paymentsError;

    return NextResponse.json(payments || []);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
}
