import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const { session, error: authError } = await validateAuthSession();
    
    if (authError || !session || session.user_type !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { canteenId, action } = await request.json();

    if (!canteenId || !action) {
      return NextResponse.json({ error: "Missing canteenId or action" }, { status: 400 });
    }

    let updateData = {};
    if (action === "approve") {
      updateData = {
        verification_status: "verified",
      };
    } else if (action === "reject") {
      updateData = {
        verification_status: "rejected",
      };
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("canteens")
      .update(updateData)
      .eq("id", canteenId);

    if (updateError) {
      console.error("Admin verification update error:", updateError);
      return NextResponse.json({ error: "Failed to update canteen status" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Canteen ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
    });

  } catch (error) {
    console.error("Admin verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
