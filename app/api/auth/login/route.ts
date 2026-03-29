import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email, password, type } = await request.json();

    if (!email || !password || !type) {
      return NextResponse.json(
        { error: "Email, password, and type are required" },
        { status: 400 },
      );
    }

    let userId: string | null = null;
    let userName: string | null = null;
    let canteenId: string | null = null;
    let logoUrl: string | null = null;
    let isVerified: boolean = true;
    let verificationStatus: string | null = null;
    let homeCook: string | null = null;

    if (type === "super_admin") {
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@canteen.com";
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";

      if (email !== adminEmail || password !== adminPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      userId = "00000000-0000-0000-0000-000000000001";
      userName = "Super Admin";
      verificationStatus = "verified"; // Admin is always verified
    } else if (type === "canteen") {
      const { data: canteen, error } = await supabaseAdmin
        .from("canteens")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !canteen) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isValidPassword = await bcrypt.compare(password, canteen.password_hash);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      userId = canteen.id;
      userName = canteen.name;
      canteenId = canteen.id;
      logoUrl = canteen.logo_url;
      homeCook = canteen.home_cook;
      verificationStatus = canteen.verification_status || 'not_started';
      isVerified = verificationStatus === "verified";
    } else {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: sessionError } = await supabaseAdmin
      .from("auth_sessions")
      .insert({
        user_id: userId,
        user_type: type,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        name: userName,
        type,
        canteen_id: canteenId,
        logo_url: logoUrl,
        home_cook: homeCook,
        is_verified: isVerified,
        verification_status: verificationStatus,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("user_type", type, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    if (canteenId) {
      response.cookies.set("canteen_id", canteenId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      response.cookies.set("is_verified", isVerified ? "true" : "false", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      response.cookies.set("verification_status", verificationStatus as string, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
