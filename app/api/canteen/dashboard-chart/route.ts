import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAuthSessionWithRole } from "@/lib/api-auth";
import {
  getISTDate,
  getISTDayStart,
  getISTDayEnd,
  formatISTDate,
  getCanteenDayBounds,
  CANTEEN_DAY_START_HOUR,
} from "@/lib/financial-utils";

export async function GET(request: NextRequest) {
  try {
    // Validate authentication with role-based access (canteen-only) and check session expiry
    const { session, error } = await validateAuthSessionWithRole("canteen");
    if (error) return error;

    const canteenId = session?.canteen_id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const chartView = searchParams.get("view") || "day"; // 'hour', 'day', or 'month'
    const selectedDate = searchParams.get("date"); // ISO date string for hour view
    const selectedMonth = searchParams.get("month"); // YYYY-MM format for day view

    const todayIST = getISTDate();
    const todayStart = getISTDayStart(todayIST);

    let revenueData: any[] = [];

    // Helper to get order type category
    const getCategory = (orderType: string | null) => {
      const type = (orderType || "dine_in").toLowerCase();
      if (type.includes("deliver")) return "delivery";
      if (type.includes("take") || type.includes("parcel")) return "takeaway";
      return "dineIn";
    };

    if (chartView === "hour") {
      // Hourly revenue for selected date using the canteen business day window:
      // 6 PM on the selected date → 6 AM the following morning (IST)
      //
      // Default date: resolve the CURRENT canteen session's start date.
      // If it's before 6AM IST, we're still in yesterday's session.
      let dateStr = selectedDate;
      if (!dateStr) {
        dateStr = formatISTDate(getISTDate());
      }
      const { start: dayStart, end: dayEnd } = getCanteenDayBounds(dateStr);

      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("created_at, canteen_amount, order_type, user_id, is_pos")
        .eq("canteen_id", canteenId)
        .gte("created_at", dayStart.toISOString())
        .lte("created_at", dayEnd.toISOString())
        .order("created_at", { ascending: true });

      // Build buckets for full 24-hour day
      const orderedHours = Array.from({ length: 24 }, (_, i) => i);
      const hourlyRevenueMap = new Map<
        number,
        {
          revenue: number;
          orders: number;
          dineIn: number;
          takeaway: number;
          delivery: number;
          posRevenue: number;
          appRevenue: number;
        }
      >();

      for (const h of orderedHours) {
        hourlyRevenueMap.set(h, {
          revenue: 0,
          orders: 0,
          dineIn: 0,
          takeaway: 0,
          delivery: 0,
          posRevenue: 0,
          appRevenue: 0,
        });
      }

      orders?.forEach((order) => {
        const istDate = getISTDate(new Date(order.created_at));
        const hour = istDate.getHours();

        const current = hourlyRevenueMap.get(hour);
        if (!current) return; // outside our window, skip
        const amount = Number(order.canteen_amount);
        const category = getCategory(order.order_type);
        const isPos = order.is_pos || order.user_id === null;

        hourlyRevenueMap.set(hour, {
          revenue: current.revenue + amount,
          orders: current.orders + 1,
          dineIn: current.dineIn + (category === "dineIn" ? amount : 0),
          takeaway: current.takeaway + (category === "takeaway" ? amount : 0),
          delivery: current.delivery + (category === "delivery" ? amount : 0),
          posRevenue: current.posRevenue + (isPos ? amount : 0),
          appRevenue: current.appRevenue + (!isPos ? amount : 0),
        });
      });

      // Emit in display order — evening hours first
      revenueData = orderedHours.map((hour) => ({
        label: `${hour.toString().padStart(2, "0")}:00`,
        ...hourlyRevenueMap.get(hour)!,
      }));
    } else if (chartView === "day") {
      // Daily revenue for selected month.
      // Each bar labelled "DD Mon" covers that date's CANTEEN SESSION: 6PM → 6AM next day IST.
      // Orders between 6AM–6PM are outside the canteen operating window and are skipped.
      const todayIST = getISTDate();
      const monthStr = selectedMonth || formatISTDate(todayIST).slice(0, 7);
      const [year, month] = monthStr.split("-").map(Number);

      const daysInMonth = new Date(year, month, 0).getDate();
      const mm = String(month).padStart(2, "0");

      const rangeStart = new Date(`${monthStr}-01T00:00:00+05:30`);
      
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const rangeEnd = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+05:30`);
      rangeEnd.setMilliseconds(-1);

      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("created_at, canteen_amount, order_type, user_id")
        .eq("canteen_id", canteenId)
        .gte("created_at", rangeStart.toISOString())
        .lte("created_at", rangeEnd.toISOString())
        .order("created_at", { ascending: true });

      const monthsShort = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const dailyRevenueMap = new Map<
        string,
        {
          revenue: number;
          orders: number;
          dineIn: number;
          takeaway: number;
          delivery: number;
          posRevenue: number;
          appRevenue: number;
        }
      >();

      // Initialise one bucket per day in the selected month
      for (let d = 1; d <= daysInMonth; d++) {
        const label = `${d.toString().padStart(2, "0")} ${monthsShort[month - 1]}`;
        dailyRevenueMap.set(label, {
          revenue: 0,
          orders: 0,
          dineIn: 0,
          takeaway: 0,
          delivery: 0,
          posRevenue: 0,
          appRevenue: 0,
        });
      }

      orders?.forEach((order) => {
        const istDate = getISTDate(new Date(order.created_at));
        const istHour = istDate.getHours();

        const sessionDay = new Date(istDate);
        const dayNum = sessionDay.getDate();
        const monthIdx = sessionDay.getMonth(); // 0-based

        // Only include dates that belong to the selected month
        if (monthIdx !== month - 1) return;

        const dateStr = `${dayNum.toString().padStart(2, "0")} ${monthsShort[monthIdx]}`;
        const current = dailyRevenueMap.get(dateStr);
        if (!current) return;

        const amount = Number(order.canteen_amount) || 0;
        const category = getCategory(order.order_type);
        const isPos = order.user_id === null;

        dailyRevenueMap.set(dateStr, {
          revenue: current.revenue + amount,
          orders: current.orders + 1,
          dineIn: current.dineIn + (category === "dineIn" ? amount : 0),
          takeaway: current.takeaway + (category === "takeaway" ? amount : 0),
          delivery: current.delivery + (category === "delivery" ? amount : 0),
          posRevenue: current.posRevenue + (isPos ? amount : 0),
          appRevenue: current.appRevenue + (!isPos ? amount : 0),
        });
      });

      revenueData = Array.from(dailyRevenueMap.entries()).map(
        ([label, data]) => ({
          label,
          ...data,
        }),
      );
    } else {
      // Monthly revenue - show last 6 months or around selected month
      const todayIST = getISTDate();
      let startDate = new Date(todayIST);

      if (selectedMonth) {
        // If a month is selected, show 6 months centered around it
        const [year, month] = selectedMonth.split("-").map(Number);
        startDate = new Date(year, month - 1, 1);
        startDate.setMonth(startDate.getMonth() - 2); // Show 2 months before selected
      } else {
        // Default: show last 6 months
        startDate.setMonth(startDate.getMonth() - 5);
      }

      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("created_at, canteen_amount, order_type, user_id, is_pos")
        .eq("canteen_id", canteenId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      const monthlyRevenueMap = new Map<
        string,
        {
          revenue: number;
          orders: number;
          dineIn: number;
          takeaway: number;
          delivery: number;
          posRevenue: number;
          appRevenue: number;
        }
      >();

      // Determine which months to include
      const numMonths = selectedMonth ? 6 : 6;
      for (let i = numMonths - 1; i >= 0; i--) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        const monthStr = date.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        monthlyRevenueMap.set(monthStr, {
          revenue: 0,
          orders: 0,
          dineIn: 0,
          takeaway: 0,
          delivery: 0,
          posRevenue: 0,
          appRevenue: 0,
        });
      }

      orders?.forEach((order) => {
        const orderDate = new Date(order.created_at);
        const istDate = getISTDate(orderDate);
        const monthStr = istDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        });
        const current = monthlyRevenueMap.get(monthStr);
        if (current) {
          const amount = Number(order.canteen_amount);
          const category = getCategory(order.order_type);
          const isPos = order.is_pos || order.user_id === null;

          monthlyRevenueMap.set(monthStr, {
            revenue: current.revenue + amount,
            orders: current.orders + 1,
            dineIn: current.dineIn + (category === "dineIn" ? amount : 0),
            takeaway: current.takeaway + (category === "takeaway" ? amount : 0),
            delivery: current.delivery + (category === "delivery" ? amount : 0),
            posRevenue: current.posRevenue + (isPos ? amount : 0),
            appRevenue: current.appRevenue + (!isPos ? amount : 0),
          });
        }
      });

      revenueData = Array.from(monthlyRevenueMap.entries()).map(
        ([label, data]) => ({
          label,
          ...data,
        }),
      );
    }

    // Return with cache headers - chart data can be cached longer
    return NextResponse.json(
      {
        success: true,
        chartView,
        data: revenueData,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error: any) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data", details: error.message },
      { status: 500 },
    );
  }
}
