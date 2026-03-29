import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate super admin
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Fetch all canteens
    const { data: canteens, error } = await supabase
      .from("canteens")
      .select("id, name")
      .order("name");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      canteens
    });
  } catch (error: any) {
    console.error("Error fetching kitchens list:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch kitchens list" },
      { status: 500 }
    );
  }
}
