import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* =========================================================
   GET — Fetch coupons for a canteen
   ========================================================= */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const canteen_id = searchParams.get("canteen_id");

    if (!canteen_id) {
      return NextResponse.json(
        { error: "canteen_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("canteen_coupons")
      .select("*")
      .eq("canteen_id", canteen_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { coupons: data ?? [] },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("GET kitchen coupons failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — Create coupon for a canteen
   ========================================================= */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      canteen_id,
      code,
      name,
      type,
      description,
      tagline,
      aura_cost = 0,
      valid_from,
      valid_until,
      is_active = false,
      conditions = [],
      rewards = []
    } = body;

    // 🛡️ Validation
    if (!canteen_id || !code || !name || !type || !valid_from || !valid_until) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Array.isArray(rewards) || rewards.length === 0) {
      return NextResponse.json(
        { error: "At least one reward is required" },
        { status: 400 }
      );
    }

    // Enforced by DB: UNIQUE (canteen_id, code)
    const { data, error } = await supabase
      .from("canteen_coupons")
      .insert({
        canteen_id,
        code,
        name,
        type,
        description,
        tagline,
        aura_cost,
        valid_from,
        valid_until,
        is_active,
        conditions,
        rewards
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, coupon: data },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("POST kitchen coupon failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT — Update coupon by coupon_id
   ========================================================= */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const coupon_id = searchParams.get("id");
    const body = await request.json();

    if (!coupon_id) {
        return NextResponse.json(
          { error: "id is required" },
          { status: 400 }
        );
    }

    const {
      code,
      name,
      type,
      description,
      tagline,
      aura_cost,
      valid_from,
      valid_until,
      is_active,
      conditions,
      rewards
    } = body;

    // Build partial update object safely
    const updatePayload: any = {};

    if (code !== undefined) updatePayload.code = code;
    if (name !== undefined) updatePayload.name = name;
    if (type !== undefined) updatePayload.type = type;
    if (description !== undefined) updatePayload.description = description;
    if (tagline !== undefined) updatePayload.tagline = tagline;
    if (aura_cost !== undefined) updatePayload.aura_cost = aura_cost;
    if (valid_from !== undefined) updatePayload.valid_from = valid_from;
    if (valid_until !== undefined) updatePayload.valid_until = valid_until;
    if (is_active !== undefined) updatePayload.is_active = is_active;
    if (conditions !== undefined) updatePayload.conditions = conditions;
    if (rewards !== undefined) updatePayload.rewards = rewards;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("canteen_coupons")
      .update(updatePayload)
      .eq("id", coupon_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, coupon: data },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("PUT kitchen coupon failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — Soft delete coupon by coupon_id
   ========================================================= */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const coupon_id = searchParams.get("id");

    if (!coupon_id) {
        return NextResponse.json(
          { error: "id is required" },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from("canteen_coupons")
      .update({ is_active: false })
      .eq("id", coupon_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, coupon: data },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("DELETE kitchen coupon failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
