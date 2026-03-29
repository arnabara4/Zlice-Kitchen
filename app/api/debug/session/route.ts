import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * DEBUG: Check current session state
 * This endpoint shows what cookies are set and what's in the database
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    const userType = cookieStore.get("user_type")?.value;
    const canteenId = cookieStore.get("canteen_id")?.value;

    const supabase = await createClient();

    let sessionFromDb = null;
    let dbError = null;

    if (authToken) {
      const { data, error } = await supabase
        .from("auth_sessions")
        .select("*")
        .eq("token", authToken)
        .single();

      sessionFromDb = data;
      dbError = error?.message;
    }

    return NextResponse.json({
      cookies: {
        authToken: authToken ? `${authToken.substring(0, 10)}...` : null,
        userType,
        canteenId,
      },
      database: {
        sessionFound: !!sessionFromDb,
        session: sessionFromDb
          ? {
              user_id: sessionFromDb.user_id,
              user_type: sessionFromDb.user_type,
              expires_at: sessionFromDb.expires_at,
              created_at: sessionFromDb.created_at,
              isExpired: new Date(sessionFromDb.expires_at) < new Date(),
              note: "canteen_id is looked up from canteens table, not stored in auth_sessions",
            }
          : null,
        error: dbError,
      },
      debug: {
        timestamp: new Date().toISOString(),
        message: "If these don't match, there's a connection/storage issue",
      },
    });
  } catch (error) {
    console.error("Debug session error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
