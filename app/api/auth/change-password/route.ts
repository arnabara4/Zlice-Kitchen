import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword, userType, secretKey } =
      await request.json();

    // Validate required fields
    if (!email || !currentPassword || !newPassword || !userType || !secretKey) {
      return NextResponse.json(
        {
          error:
            "Email, current password, new password, user type, and secret key are required",
        },
        { status: 400 },
      );
    }

    // Verify secret key
    const changePasswordSecret = process.env.Change_Password_Secret;
    if (secretKey !== changePasswordSecret) {
      return NextResponse.json(
        { error: "Invalid secret key. Unauthorized access." },
        { status: 401 },
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 },
      );
    }

    if (userType === "super_admin") {
      // For super admin, check against .env credentials
      const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@canteen.com";
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";

      if (email !== adminEmail) {
        return NextResponse.json(
          { error: "Invalid email or user not found" },
          { status: 404 },
        );
      }

      if (currentPassword !== adminPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }

      return NextResponse.json(
        {
          error:
            "Super admin password is managed via environment variables (.env file). Please update SUPER_ADMIN_PASSWORD in your .env file and restart the server.",
          info: "Current .env location: SUPER_ADMIN_PASSWORD=your_new_password",
        },
        { status: 400 },
      );
    } else if (userType === "canteen") {
      // For canteen users, verify and update in database
      const { data: canteen, error: fetchError } = await supabaseAdmin
        .from("canteens")
        .select("id, email, password_hash, name")
        .eq("email", email)
        .single();

      if (fetchError || !canteen) {
        console.error("Canteen fetch error:", fetchError);
        return NextResponse.json(
          { error: "Invalid email or canteen not found" },
          { status: 404 },
        );
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        canteen.password_hash,
      );

      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 },
        );
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password in database
      const { error: updateError } = await supabaseAdmin
        .from("canteens")
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", canteen.id);

      if (updateError) {
        console.error("Password update error:", updateError);
        return NextResponse.json(
          { error: "Failed to update password" },
          { status: 500 },
        );
      }

      // Invalidate all existing sessions for this canteen
      await supabaseAdmin
        .from("auth_sessions")
        .delete()
        .eq("user_id", canteen.id)
        .eq("user_type", "canteen");

      return NextResponse.json({
        success: true,
        message:
          "Password changed successfully. Please login again with your new password.",
        canteen: {
          id: canteen.id,
          name: canteen.name,
          email: canteen.email,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid user type. Must be "super_admin" or "canteen"' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
