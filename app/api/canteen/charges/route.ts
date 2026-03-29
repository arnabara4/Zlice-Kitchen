
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

/**
 * GET /api/canteen/charges
 * 
 * Returns detailed logs of all charges for the authenticated canteen.
 */
export async function GET(request: NextRequest) {
  try {
    // Standard role-based authentication
    const { session, error: authError } = await validateAuthSessionWithRole("canteen");
    if (authError) return authError;

    const canteenId = session?.canteen_id;
    if (!canteenId) {
      return NextResponse.json({ error: "Canteen profile not found or linked" }, { status: 404 });
    }

    // Parse query params (optional date range & pagination)
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("charges")
      .select(`
        id,
        charge_amount,
        charge_reason,
        created_at,
        order_id,
        orders (
          order_number
        )
      `, { count: "exact" })
      .eq("canteen_id", canteenId);

    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data: charges, error: fetchError, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) throw fetchError;

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      charges: (charges || []).map((c: any) => ({
        id: c.id,
        amount: Number(c.charge_amount) || 0,
        reason: c.charge_reason || "No reason provided",
        createdAt: c.created_at,
        orderId: c.order_id,
        orderNumber: c.orders?.order_number || null,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });

  } catch (error: any) {
    console.error("Error fetching canteen charges:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch charges" },
      { status: 500 }
    );
  }
}
