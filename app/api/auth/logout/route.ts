import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Validate authentication and session expiry before logout
    const { session, error } = await validateAuthSession();
    if (error) {
      // Even if session is invalid/expired, still clear cookies
      const response = NextResponse.json({ success: true });
      response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
      response.cookies.set("user_type", "", { maxAge: 0, path: "/" });
      response.cookies.set("canteen_id", "", { maxAge: 0, path: "/" });
      return response;
    }

    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;

    // Delete session from database using admin client
    if (authToken) {
      await supabaseAdmin.from("auth_sessions").delete().eq("token", authToken);
    }

    // Create response and clear cookies
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", "", { maxAge: 0, path: "/" });
    response.cookies.set("user_type", "", { maxAge: 0, path: "/" });
    response.cookies.set("canteen_id", "", { maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
