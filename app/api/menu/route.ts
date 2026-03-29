import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSession, validateAuthSessionWithRole } from "@/lib/api-auth";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const canteenId = searchParams.get("canteenId");

    // Validate authentication and session expiry
    const { session, error } = await validateAuthSession();
    if (error) return error;

    // Allow seeing menu only if it's the admin's canteen or global request (if needed).
    let query = supabaseAdmin
      .from("menu_items")
      .select("*");

    if (canteenId) {
      query = query.eq("canteen_id", canteenId);
    } else if (session?.canteen_id) {
      query = query.eq("canteen_id", session.canteen_id);
    } else {
      return NextResponse.json({ error: "Missing kitchen context" }, { status: 400 });
    }

    const { data: menuItems, error: menuError } = await query.order("name");

    if (menuError) {
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }

    return NextResponse.json(menuItems);
  } catch (error: any) {
    console.error("Menu GET API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // Validate authentication and session expiry with canteen role
    const { session, error } = await validateAuthSessionWithRole("canteen");
    if (error) return error;

    if (!id) {
      return NextResponse.json(
        { error: "Missing menu item ID" },
        { status: 400 },
      );
    }

    // Verify ownership
    const { data: item } = await supabaseAdmin
      .from("menu_items")
      .select("canteen_id")
      .eq("id", id)
      .single();
    if (!item || item.canteen_id !== session?.canteen_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("menu_items")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Menu DELETE API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
