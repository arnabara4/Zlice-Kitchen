import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

export async function POST(req: Request) {
  try {
    // Validate authentication with role-based access (canteen-only)
    const { session, error } = await validateAuthSessionWithRole("canteen");
    if (error) return error;

    console.log(session);

    const sessionData = session;

    const body = await req.json();
    const { is_online } = body;

    // Backend Guard: Fetch current canteen details before allowing an online toggle.
    const { data: canteen, error: fetchError } = await supabaseAdmin
      .from("canteens")
      .select("home_cook, verification_status")
      .eq("id", sessionData!.canteen_id)
      .single();

    if (fetchError || !canteen) {
      return NextResponse.json({ error: "Canteen not found" }, { status: 404 });
    }

    if (is_online && canteen.verification_status !== 'verified') {
      return NextResponse.json(
        { error: "Verification not completed. Kitchens must be verified to go online." },
        { status: 403 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("canteens")
      .update({ is_online })
      .eq("id", sessionData!.canteen_id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, is_online });
  } catch (error: any) {
    console.error("Canteen status update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
