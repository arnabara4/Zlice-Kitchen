import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  OrderFinancials,
  calculateSettlementBreakdown,
  calculateKPIStats,
  groupOrdersByHour,
  groupOrdersByDate,
  groupOrdersByDateWithSettlement,
  calculateCanteenPerformance,
  isZliceOrder,
  resolveSettlementDateRange,
} from "@/lib/financial-utils";
import type {
  OrderSource,
  DateGranularity,
  AnalyticsAPIResponse,
  HourlySalesByCanteen,
} from "@/types/analytics";

// Helper to get Indian timezone dates
function getIndianDate() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

// Get date range based on preset
function getDateRange(
  preset: string,
  customStart?: string | null,
  customEnd?: string | null
): { startDate: Date; endDate: Date } {
  const today = getIndianDate();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (preset) {
    case "today":
      return { startDate: today, endDate: endOfToday };
    case "yesterday": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { startDate: yesterday, endDate: endOfYesterday };
    }
    case "7d": {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo, endDate: endOfToday };
    }
    case "30d": {
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      return { startDate: monthAgo, endDate: endOfToday };
    }
    case "custom":
      if (customStart && customEnd) {
        return {
          startDate: new Date(customStart),
          endDate: new Date(customEnd),
        };
      }
      // Default to last 7 days if custom dates not provided
      const defaultStart = new Date(today);
      defaultStart.setDate(defaultStart.getDate() - 7);
      return { startDate: defaultStart, endDate: endOfToday };
    default:
      // Default to last 7 days
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: endOfToday };
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate super admin
    const authToken = request.cookies.get("auth_token")?.value;
    const userType = request.cookies.get("user_type")?.value;

    if (!authToken || userType !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from("auth_sessions")
      .select("*")
      .eq("token", authToken)
      .eq("user_type", userType)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const datePreset = searchParams.get("datePreset") || "7d";
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");
    const orderSource = (searchParams.get("orderSource") || "all") as OrderSource;
    const canteenIdsParam = searchParams.get("canteenIds") || "all";
    const granularity = (searchParams.get("granularity") || "day") as DateGranularity;

    // Calculate date range for SETTLEMENT Dates (User selects when they want to see settlements for)
    const { startDate: settlementStartDate, endDate: settlementEndDate } = getDateRange(
      datePreset,
      customStartDate,
      customEndDate
    );

    // Use the selected date range directly (No T-2 offset for Analytics)
    const queryStart = settlementStartDate;
    const queryEnd = settlementEndDate;

    // Fetch all canteens
    const { data: canteens, error: canteensError } = await supabase
      .from("canteens")
      .select("id, name")
      .order("name");

    if (canteensError) throw canteensError;

    // Determine canteen filter
    const canteenIds =
      canteenIdsParam === "all"
        ? (canteens || []).map((c) => c.id)
        : canteenIdsParam.split(",");

    // Build orders query with all required fields
    // Query by created_at using the Resolved Query Range
    let ordersQuery = supabase
      .from("orders")
      .select(
        `
        id,
        user_id,
        canteen_id,
        total_amount,
        delivery_fee,
        packaging_fee,
        delivery_partner_amount,
        packaging_amount,
        gst_amount_total,
        gst_amount_canteen,
        is_gst_enabled,
        created_at
      `
      )
      .in("canteen_id", canteenIds)
      .gte("created_at", queryStart.toISOString())
      .lte("created_at", queryEnd.toISOString())
      .order("created_at", { ascending: true });

    // Apply order source filter
    if (orderSource === "zlice") {
      ordersQuery = ordersQuery.not("user_id", "is", null);
    } else if (orderSource === "pos") {
      ordersQuery = ordersQuery.is("user_id", null);
    }

    const { data: ordersData, error: ordersError } = await ordersQuery;

    if (ordersError) throw ordersError;

    // Transform to OrderFinancials type with proper field handling
    const orders: OrderFinancials[] = (ordersData || []).map((order) => ({
      id: order.id,
      user_id: order.user_id,
      canteen_id: order.canteen_id,
      total_amount: Number(order.total_amount) || 0,
      delivery_fee: Number(order.delivery_fee) || 0,
      packaging_fee: Number(order.packaging_fee) || 0,
      delivery_partner_amount: Number(order.delivery_partner_amount) || 0,
      packaging_amount: Number(order.packaging_amount) || 0,
      gst_amount_total: Number(order.gst_amount_total) || 0,
      gst_amount_canteen: Number(order.gst_amount_canteen) || 0,
      is_gst_enabled: order.is_gst_enabled || false,
      created_at: order.created_at,
      from_pos: order.user_id === null,
    }));

    // Calculate all analytics using financial utilities
    const activeCanteenIds = new Set(orders.map((o) => o.canteen_id));
    const kpiStats = calculateKPIStats(
      orders,
      canteens?.length || 0,
      activeCanteenIds
    );
    const settlementBreakdown = calculateSettlementBreakdown(orders);
    const revenueTimeSeries = groupOrdersByDate(orders, granularity);
    const settlementTimeSeries = groupOrdersByDateWithSettlement(orders, granularity);
    const hourlySales = groupOrdersByHour(orders);
    const canteenPerformance = calculateCanteenPerformance(
      orders,
      canteens || []
    ).map((cp) => ({
      ...cp,
      revenueShare:
        kpiStats.totalRevenue > 0
          ? (cp.totalRevenue / kpiStats.totalRevenue) * 100
          : 0,
    }));

    // Calculate hourly sales by canteen for multi-line chart
    const hourlySalesByCanteen: HourlySalesByCanteen[] = [];
    const canteenHourlyMap = new Map<
      number,
      Map<string, number>
    >();

    // Initialize all hours
    for (let h = 0; h < 24; h++) {
      canteenHourlyMap.set(h, new Map());
    }

    // Aggregate by canteen per hour
    for (const order of orders) {
      const hour = new Date(order.created_at).getHours();
      const hourMap = canteenHourlyMap.get(hour)!;
      const currentRevenue = hourMap.get(order.canteen_id) || 0;
      hourMap.set(order.canteen_id, currentRevenue + order.total_amount);
    }

    // Transform to array format
    for (let h = 0; h < 24; h++) {
      const hourData: HourlySalesByCanteen = {
        hour: h,
        hourLabel: `${h.toString().padStart(2, "0")}:00`,
      };
      const hourMap = canteenHourlyMap.get(h)!;
      for (const [canteenId, revenue] of hourMap.entries()) {
        hourData[canteenId] = revenue;
      }
      hourlySalesByCanteen.push(hourData);
    }

    // Build response
    const response: AnalyticsAPIResponse = {
      success: true,
      filters: {
        startDate: settlementStartDate.toISOString(),
        endDate: settlementEndDate.toISOString(),
        orderSource,
        canteenIds,
        granularity,
      },
      kpiStats,
      settlementBreakdown,
      revenueTimeSeries,
      settlementTimeSeries,
      hourlySales,
      hourlySalesByCanteen,
      canteenPerformance,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error.message },
      { status: 500 }
    );
  }
}
