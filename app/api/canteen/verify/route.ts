import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    console.log("📥 Verification request received. Content-Type:", contentType);

    const { session, error: authError } = await validateAuthSession();
    
    if (authError || !session || session.user_type !== "canteen") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canteenId = session.user_id;
    console.log("✅ Auth valid for kitchen:", canteenId);

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid Content-Type. Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    console.log("✅ FormData parsed successfully");
    
    const fullName = formData.get("fullName") as string;
    const kitchenName = formData.get("kitchenName") as string;

    if (!fullName || !kitchenName) {
      return NextResponse.json(
        { error: "Missing required fields (fullName, kitchenName)" },
        { status: 400 }
      );
    }

    // Update Canteen status in database
    const { error: updateError } = await supabaseAdmin
      .from("canteens")
      .update({
        name: kitchenName,
        verification_status: "under_review",
        submitted_at: new Date().toISOString(),
        undertaking_accepted_at: new Date().toISOString(),
        // We could also store the signer name if we had a field for it
      })
      .eq("id", canteenId);

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json({ error: "Failed to update internal record" }, { status: 500 });
    }

    const response = NextResponse.json({ 
      success: true, 
      message: "Verification submitted successfully",
      status: "under_review" 
    });
    
    // Update cookies so proxy immediately allows access
    response.cookies.set("verification_status", "under_review", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Verification submission error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 }
    );
  }
}
