import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";

import {
  getISTDate,
  getISTDayStart,
  getISTDayEnd,
  formatISTDate,
  getCanteenDayBounds,
} from "@/lib/financial-utils";

export async function GET(request: NextRequest) {
  try {
    // Validate authentication with role-based access (canteen-only) and check session expiry
    const { session, error } = await validateAuthSessionWithRole("canteen");
    if (error) return error;

    const canteenId = session?.canteen_id;

    // Canteen business day = 6PM → 6AM IST.
    // "Today" for a canteen means the session that started at 6PM today
    // (or 6PM yesterday if current time is before 6AM today).
    const nowIST = getISTDate();
    const currentHour = nowIST.getHours();

    // If it's before 6AM, the current canteen day is still yesterday evening's session
    const todayIST = new Date(nowIST);
    if (currentHour < 6) {
      // e.g. 2AM on Feb 26 → canteen day is still "Feb 25 6PM → Feb 26 6AM"
      todayIST.setDate(todayIST.getDate() - 1);
    }
    const todayDateStr = formatISTDate(todayIST); // YYYY-MM-DD of the session start date

    // Canteen day boundaries
    const { start: todayStart, end: todayEnd } =
      getCanteenDayBounds(todayDateStr);

    // Yesterday canteen day = the session that started one day before todayDateStr
    const yesterdayIST = new Date(todayIST);
    yesterdayIST.setDate(yesterdayIST.getDate() - 1);
    const yesterdayDateStr = formatISTDate(yesterdayIST);
    const { start: yesterdayStart, end: yesterdayEnd } =
      getCanteenDayBounds(yesterdayDateStr);

    // 30-day lookback: go back from the start of the current canteen day
    const thirtyDaysAgoStart = new Date(todayStart);
    thirtyDaysAgoStart.setDate(thirtyDaysAgoStart.getDate() - 30);

    // 7-day lookback for khata
    const weekAgoStart = new Date(todayStart);
    weekAgoStart.setDate(weekAgoStart.getDate() - 7);

    // Convert to ISO strings for DB queries
    const thirtyDaysAgoISO = thirtyDaysAgoStart.toISOString();
    const weekAgoISO = weekAgoStart.toISOString();

    // Parallel execution
    const [
      ordersResult, // Fetch recent orders (last 30 days) for multiple uses
      paymentsResult, // Lifetime payments
      khataResult, // Recent khata
      studentsResult, // Student count
      chargesResult, // E. Charges
    ] = await Promise.all([
      // A. Detailed Orders (Last 30 Days)
      supabaseAdmin
        .from("orders")
        .select(
          `
          id,
          created_at, 
          total_amount, 
          canteen_amount, 
          order_type,
          user_id,
          status,
          is_settled,
          charges,
          from_pos
        `,
        )
        .eq("canteen_id", canteenId)
        .neq("status", "cancelled")
        .gte("created_at", thirtyDaysAgoISO)
        .order("created_at", { ascending: false }),

      // B. Lifetime Payments
      supabaseAdmin
        .from("canteen_payments")
        .select("amount")
        .eq("canteen_id", canteenId),

      // C. Khata Entries (Last 7 Days)
      supabaseAdmin
        .from("khata_entries")
        .select("amount, entry_date, student_id")
        .eq("canteen_id", canteenId)
        .gte("entry_date", weekAgoISO),

      // D. Total Students
      supabaseAdmin
        .from("khata_students")
        .select("id", { count: "exact" })
        .eq("canteen_id", canteenId),

      // E. Charges
      supabaseAdmin
        .from("charges")
        .select("charge_amount, applied")
        .eq("canteen_id", canteenId),
    ]);

    // Data Processing
    const orders = ordersResult.data || [];
    const payments = paymentsResult.data || [];
    const khataEntries = khataResult.data || [];
    // const orderItems = orderItemsResult.data || []; -> We will fetch this now

    // --- Separate Fetch for Top Items (Robust) ---
    // 1. Get IDs of orders in last 30 days
    const recentOrderIds = orders.map((o) => o.id); // 'orders' already contains last 30 days data for this canteen!

    let orderItems: any[] = [];
    if (recentOrderIds.length > 0) {
      // Chunking if too many orders, but for now direct IN query
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select(
          `
                quantity,
                price,
                menu_item_id,
                orders!inner(canteen_id)
            `,
        )
        .in("order_id", recentOrderIds);
      orderItems = items || [];
    }

    // --- Separate Fetch for Menu Item Names (No Joins) ---
    const uniqueItemIds = Array.from(
      new Set(orderItems.map((oi: any) => oi.menu_item_id).filter(Boolean)),
    );
    const menuItemNameMap = new Map<string, string>();

    if (uniqueItemIds.length > 0) {
      const { data: menuItems } = await supabaseAdmin
        .from("menu_items")
        .select("id, name")
        .in("id", uniqueItemIds);

      menuItems?.forEach((m: any) => menuItemNameMap.set(m.id, m.name));
    }

    // --- 1. Basic Stats (Today vs Yesterday) ---
    // Note: Revenue = total_amount (Sales), not Earnings
    // Use proper IST boundaries for filtering
    // Canteen day window filter:
    //   Today     = 6PM todayDateStr  → 6AM next day
    //   Yesterday = 6PM yesterdayDateStr → 6AM todayDateStr (=== todayStart)
    const todayOrdersData = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= todayStart.getTime() && t <= todayEnd.getTime();
    });
    const yesterdayOrdersData = orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return t >= yesterdayStart.getTime() && t <= yesterdayEnd.getTime();
    });

    const todayRevenue = todayOrdersData.reduce(
      (sum, o) => sum + Number(o.canteen_amount),
      0,
    );
    const yesterdayRevenue = yesterdayOrdersData.reduce(
      (sum, o) => sum + Number(o.canteen_amount),
      0,
    );
    const todayOrders = todayOrdersData.length;
    const yesterdayOrders = yesterdayOrdersData.length;

    const avgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
    const previousAvgOrderValue =
      yesterdayOrders > 0 ? yesterdayRevenue / yesterdayOrders : 0;

    // --- 2. Khata Stats ---
    // Use proper IST boundaries for khata filtering
    const todayKhataCollection = khataEntries
      .filter((e) => {
        const entryDate = new Date(e.entry_date);
        return entryDate >= todayStart && entryDate <= todayEnd;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const yesterdayKhataCollection = khataEntries
      .filter((e) => {
        const entryDate = new Date(e.entry_date);
        return entryDate >= yesterdayStart && entryDate < todayStart;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const activeStudents = new Set(khataEntries.map((e) => e.student_id)).size;
    const totalStudents = studentsResult.count || 0;

    // --- 3. Wallet / Settlement Logic ---

    // Fetch ALL orders for Gross Revenue (POS + App)
    const { data: allOrders } = await supabaseAdmin
      .from("orders")
      .select(
        "total_amount, canteen_amount, user_id, is_settled, created_at, order_type, charges, from_pos",
      )
      .eq("canteen_id", canteenId)
      .neq("status", "cancelled");

    const allOrdersList = allOrders || [];

    // Gross Revenue (ALL sources — sum of canteen_amount regardless of Zlice/POS)
    const lifetimeGross = allOrdersList.reduce(
      (sum, o) => sum + (Number(o.canteen_amount) || 0),
      0,
    );
    const totalOrdersCount = allOrdersList.length;
    const lifetimeAOV =
      totalOrdersCount > 0 ? lifetimeGross / totalOrdersCount : 0;

    // Settlement Stats — Zlice App Orders ONLY (from_pos is false)
    const zliceOrders = allOrdersList.filter((o) => !o.from_pos);

    // Lifetime value to be settled (all Zlice orders)
    const lifetimeSettlementTotal = zliceOrders.reduce(
      (sum, o) => sum + (Number(o.canteen_amount) || 0),
      0,
    );

    // Amount already settled (is_settled = true)
    const lifetimeSettled = zliceOrders
      .filter((o) => o.is_settled)
      .reduce((sum, o) => sum + (Number(o.canteen_amount) || 0), 0);

    // Unsettled balance: direct filter — SUM(canteen_amount) WHERE is_settled = false
    const rawNetDue = zliceOrders
      .filter((o) => !o.is_settled)
      .reduce((sum, o) => sum + (Number(o.canteen_amount) || 0), 0);

    const chargesList = chargesResult.data || [];
    const appliedCharges = chargesList
      .filter((c: any) => c.applied)
      .reduce((sum: number, c: any) => sum + (Number(c.charge_amount) || 0), 0);
    const unappliedCharges = chargesList
      .filter((c: any) => !c.applied)
      .reduce((sum: number, c: any) => sum + (Number(c.charge_amount) || 0), 0);

    // Total net due minus unapplied charges (with floor of 0)
    const totalNetDue = Math.max(0, rawNetDue - unappliedCharges);

    // Lifetime paid minus applied charges
    const netSettled = Math.max(0, lifetimeSettled - appliedCharges);

    // Total Lifetime Paid via Payments table
    const totalLifetimePaid = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0,
    );

    // --- 4. Special Breakdowns ---

    // Sales Breakdown
    const salesBreakdown = {
      zlice: { count: 0, revenue: 0 },
      pos: { count: 0, revenue: 0 },
      channels: {
        dineIn: { count: 0, revenue: 0 },
        takeaway: { count: 0, revenue: 0 },
        delivery: { count: 0, revenue: 0 },
      },
    };

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      // Only include today's orders for sales breakdown
      if (orderDate < todayStart || orderDate > todayEnd) return;

      const amt = Number(order.canteen_amount) || 0;

      if (!order.from_pos) {
        salesBreakdown.zlice.count++;
        salesBreakdown.zlice.revenue += amt;
      } else {
        salesBreakdown.pos.count++;
        salesBreakdown.pos.revenue += amt;
      }

      const type = (order.order_type || "dine_in").toLowerCase();
      if (type.includes("deliver")) {
        salesBreakdown.channels.delivery.count++;
        salesBreakdown.channels.delivery.revenue += amt;
      } else if (type.includes("take") || type.includes("parcel")) {
        salesBreakdown.channels.takeaway.count++;
        salesBreakdown.channels.takeaway.revenue += amt;
      } else {
        salesBreakdown.channels.dineIn.count++;
        salesBreakdown.channels.dineIn.revenue += amt;
      }
    });

    // Top Items (Last 30 Days)
    const itemMap = new Map<string, { quantity: number; revenue: number }>();
    orderItems.forEach((oi: any) => {
      // Use manual lookup from separate fetch
      const name = menuItemNameMap.get(oi.menu_item_id) || "Unknown Item";

      const current = itemMap.get(name) || { quantity: 0, revenue: 0 };
      itemMap.set(name, {
        quantity: current.quantity + oi.quantity,
        revenue: current.revenue + Number(oi.price) * oi.quantity,
      });
    });

    const topItems = Array.from(itemMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 30); // Top 30

    // Hourly Data (Today)
    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);
    todayOrdersData.forEach((o) => {
      const h = new Date(o.created_at).getHours();
      hourlyMap.set(h, (hourlyMap.get(h) || 0) + 1);
    });
    const hourlyData = Array.from(hourlyMap.entries())
      .map(([hour, orders]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        orders,
      }))
      .filter((i) => i.orders > 0);

    // Category Data (Price Ranges - Today)
    const priceRanges = [
      { category: "₹0-50", min: 0, max: 50, revenue: 0 },
      { category: "₹51-100", min: 51, max: 100, revenue: 0 },
      { category: "₹101-200", min: 101, max: 200, revenue: 0 },
      { category: "₹201+", min: 201, max: Infinity, revenue: 0 },
    ];
    todayOrdersData.forEach((o) => {
      const amt = Number(o.canteen_amount);
      const range = priceRanges.find((r) => amt >= r.min && amt <= r.max);
      if (range) range.revenue += amt;
    });
    const catTotal = priceRanges.reduce((s, r) => s + r.revenue, 0);
    const categoryData = priceRanges
      .filter((r) => r.revenue > 0)
      .map((r) => ({
        category: r.category,
        revenue: r.revenue,
        percentage: catTotal > 0 ? (r.revenue / catTotal) * 100 : 0,
      }));

    // Daily Trends (Last 7 Days)
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayIST);
      d.setDate(d.getDate() - i);
      const istD = getISTDate(d);
      const str = istD.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      dailyMap.set(str, { revenue: 0, orders: 0 });
    }
    orders.forEach((o) => {
      const orderDate = new Date(o.created_at);
      if (orderDate >= weekAgoStart) {
        const orderIST = getISTDate(orderDate);
        const str = orderIST.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        });
        if (dailyMap.has(str)) {
          const curr = dailyMap.get(str)!;
          dailyMap.set(str, {
            revenue: curr.revenue + Number(o.canteen_amount),
            orders: curr.orders + 1,
          });
        }
      }
    });
    const dailyTrends = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    return NextResponse.json(
      {
        success: true,
        stats: {
          todayRevenue,
          yesterdayRevenue,
          todayOrders,
          yesterdayOrders,
          totalStudents,
          activeStudents,
          todayKhataCollection,
          yesterdayKhataCollection,
          avgOrderValue,
          previousAvgOrderValue,
        },
        wallet: {
          // Unsettled balance = SUM(canteen_amount) WHERE is_settled = false
          netBalance: totalNetDue,
          lifetimeGross,
          // lifetimeNet = total Zlice canteen_amount (what Zlice owes over lifetime)
          lifetimeNet: lifetimeSettlementTotal,
          // lifetimePaid = sum of canteen_amount where is_settled = true minus applied charges
          lifetimePaid: netSettled,
          aov: lifetimeAOV,
          totalCharges: appliedCharges + unappliedCharges,
        },
        salesBreakdown,
        topItems, // now 30
        dailyTrends,
        hourlyData,
        categoryData,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats", details: error.message },
      { status: 500 },
    );
  }
}
