/**
 * API Authentication Helper
 *
 * Centralized security validation for all API routes.
 * Ensures consistent authentication, session validation, and expiry checks.
 */

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export interface AuthSession {
  user_id: string;
  canteen_id?: string; // For canteen users, looked up from canteens table
  user_type: "super_admin" | "canteen" | "delivery";
  expires_at: string;
  token: string;
}

/**
 * Validates authentication token and session expiry
 * Returns session data or error response
 *
 * NOTE: Uses server client for auth_sessions query (with RLS applied)
 * This is safe because it checks token + user_type match + expiry
 */
export async function validateAuthSession(): Promise<{
  session: AuthSession | null;
  error: NextResponse | null;
}> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token")?.value;
    const userType = cookieStore.get("user_type")?.value as
      | "super_admin"
      | "canteen"
      | "delivery"
      | undefined;

    if (!authToken || !userType) {
      console.log(
        "❌ Missing auth token or user_type. Token:",
        !!authToken,
        "UserType:",
        userType,
      );
      return {
        session: null,
        error: NextResponse.json(
          { error: "Unauthorized: Missing authentication token" },
          { status: 401 },
        ),
      };
    }

    // Use admin client for auth_sessions to bypass RLS entirely.
    // This is safe because it checks high-entropy token + user_type match + expiry
    // and standard RLS blocks anonymous access to this session table.
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("auth_sessions")
      .select("user_id, user_type, expires_at, token")
      .eq("token", authToken)
      .eq("user_type", userType)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !sessionData) {
      console.log(
        "❌ Session query failed. Error:",
        sessionError?.message,
        "Data:",
        sessionData,
      );
      return {
        session: null,
        error: NextResponse.json(
          { error: "Unauthorized: Invalid session" },
          { status: 401 },
        ),
      };
    }

    // Validate user_type matches cookie (defense against token tampering)
    if (sessionData.user_type !== userType) {
      console.log(
        "❌ User type mismatch. Session type:",
        sessionData.user_type,
        "Cookie type:",
        userType,
      );
      return {
        session: null,
        error: NextResponse.json(
          { error: "Unauthorized: User type mismatch" },
          { status: 401 },
        ),
      };
    }

    // For canteen users, look up canteen_id from canteens table
    let canteenId: string | undefined;
    if (userType === "canteen") {
      const { data: canteen } = await supabaseAdmin
        .from("canteens")
        .select("id")
        .eq("id", sessionData.user_id)
        .single();
      canteenId = canteen?.id;
    }

    console.log(
      "✅ Auth valid for",
      sessionData.user_type,
      "canteen_id:",
      canteenId || "N/A",
    );
    return {
      session: {
        user_id: sessionData.user_id,
        user_type: sessionData.user_type as
          | "super_admin"
          | "canteen"
          | "delivery",
        expires_at: sessionData.expires_at,
        token: sessionData.token,
        canteen_id: canteenId,
      } as AuthSession,
      error: null,
    };
  } catch (error) {
    console.error("Auth validation error:", error);
    return {
      session: null,
      error: NextResponse.json(
        { error: "Internal server error during authentication" },
        { status: 500 },
      ),
    };
  }
}

/**
 * Validates auth session and ensures user is of specific type
 * Useful for role-based access control
 */
export async function validateAuthSessionWithRole(
  requiredRole: "super_admin" | "canteen" | "delivery",
): Promise<{
  session: AuthSession | null;
  error: NextResponse | null;
}> {
  const { session, error } = await validateAuthSession();

  if (error || !session) {
    return {
      session: null,
      error:
        error || NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user_type !== requiredRole) {
    return {
      session: null,
      error: NextResponse.json(
        { error: `Forbidden: This action requires ${requiredRole} role` },
        { status: 403 },
      ),
    };
  }

  return { session, error: null };
}

/**
 * Validates that user owns a specific resource
 * Prevents users from accessing other canteens' data
 */
export function validateCanteenAccess(
  sessionCanteenId: string | undefined,
  resourceCanteenId: string,
): boolean {
  if (!sessionCanteenId) return false;
  return sessionCanteenId === resourceCanteenId;
}
