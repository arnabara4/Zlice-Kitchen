import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { session, error: authError } = await validateAuthSession();
    
    if (authError || !session) {
      if (!session) {
        return NextResponse.json({ user: null }, { status: 200 });
      }
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_id, user_type } = session;

    // Get user details based on type using admin client to bypass RLS
    let user = null;
    if (user_type === "super_admin") {
      // Hardcoded super admin from .env
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@canteen.com";
      user = {
        id: user_id,
        email: adminEmail,
        name: "Super Admin",
        type: "super_admin" as const,
      };
    } else if (user_type === "canteen") {
      const { data: canteen, error: canteenError } = await supabaseAdmin
        .from("canteens")
        .select("*")
        .eq("id", user_id)
        .single();
        
      if (canteenError) {
        console.error("❌ Kitchen query failed in /api/auth/me:", canteenError);
      }

      if (canteen) {
        user = {
          id: canteen.id,
          email: canteen.email,
          name: canteen.name,
          logo_url: canteen.logo_url,
          type: "canteen" as const,
          canteen_id: canteen.id,
          home_cook: canteen.home_cook,
          is_verified: canteen.is_verified ?? false,
          verification_status: canteen.verification_status || 'not_started',
        };
      }
    } else if (user_type === "delivery") {
      const { data: deliveryMan } = await supabaseAdmin
        .from("delivery_man")
        .select("id, phone, name, is_active")
        .eq("id", user_id)
        .single();

      if (deliveryMan) {
        user = {
          id: deliveryMan.id,
          phone: deliveryMan.phone,
          name: deliveryMan.name,
          type: "delivery" as const,
        };
      }
    }

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const response = NextResponse.json({ user });

    // Refresh the is_verified and verification_status cookies if it's a canteen and the values have changed
    if (user.type === "canteen") {
      const currentIsVerified = request.cookies.get("is_verified")?.value;
      const actualIsVerified = user.verification_status === "verified" ? "true" : "false";

      if (currentIsVerified !== actualIsVerified) {
        response.cookies.set("is_verified", actualIsVerified, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
      }

      const currentStatus = request.cookies.get("verification_status")?.value;
      const actualStatus = user.verification_status;

      if (currentStatus !== actualStatus) {
        response.cookies.set("verification_status", actualStatus, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
      }
    }

    return response;
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
