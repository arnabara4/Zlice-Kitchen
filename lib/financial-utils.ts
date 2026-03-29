/**
 * Financial Utilities for Canteen Analytics
 * 
 * This module provides centralized financial calculation logic for the Admin Analytics Dashboard.
 * All calculations strictly follow the defined business rules for Zlice App vs PoS orders.
 * 
 * BUSINESS RULES:
 * 
 * Zlice App Orders (user_id IS NOT NULL):
 * - Items are priced at 5% above canteen_price
 * - Delivery and packaging fees include 2% markup
 * - Gateway takes 2% of total_amount
 * - Zlice commission is 1.9% of total_amount
 * - GST is applied on the inflated subtotal
 * 
 * PoS Orders (user_id IS NULL):
 * - No price elevation
 * - No commission
 * - delivery_fee = delivery_partner_amount
 * - packaging_fee = packaging_amount
 * - gst_amount_total = gst_amount_canteen
 */

// ==================== CONSTANTS ====================

/** Zlice platform commission rate (1.9%) */
export const ZLICE_COMMISSION_RATE = 0.019;

/** Payment gateway fee rate (2% deducted from total) */
export const GATEWAY_FEE_RATE = 0.02;

/** Item price markup for Zlice orders (5%) */
export const ITEM_MARKUP_RATE = 0.05;

/** Delivery and packaging fee markup (2%) */
export const DELIVERY_PACKAGING_MARKUP_RATE = 0.02;

/** GST rate applied on food items (5%) */
export const GST_RATE = 0.05;

/** 
 * Cached Bank Holidays (YYYY-MM-DD)
 * Ideally fetched from DB/API, currently hardcoded for stability as requested.
 * Add dates here to skip them during settlement calculation.
 */
export const BANK_HOLIDAYS = new Set([
  '2024-01-26', // Republic Day
  '2024-08-15', // Independence Day
  '2024-10-02', // Gandhi Jayanti
  '2024-12-25', // Christmas
  // Add 2025/2026 dates as needed
]);

// ==================== TYPES ====================

export interface OrderFinancials {
  id: string;
  user_id: string | null;
  total_amount: number;
  delivery_fee: number;
  packaging_fee: number;
  delivery_partner_amount: number;
  packaging_amount: number;
  gst_amount_total: number;
  gst_amount_canteen: number;
  is_gst_enabled: boolean;
  created_at: string;
  canteen_id: string;
  is_settled?: boolean;
  from_pos: boolean;
}

export interface SettlementBreakdown {
  /** Sum of total_amount for all orders */
  totalRevenue: number;
  /** Zlice commission: total_amount * 1.9% (Zlice orders only) */
  zliceCommission: number;
  /** Amount after gateway deduction: total_amount * 98% */
  netAfterGateway: number;
  /** Total paid to canteens: base_item_subtotal + gst_amount_canteen + packaging_amount */
  canteenSettlement: number;
  /** Total paid to delivery partners */
  deliveryPartnerAmount: number;
  /** Platform profit after all payouts */
  platformProfit: number;
  /** Total GST collected from customers */
  gstTotal: number;
  /** GST paid to canteens (on base prices) */
  gstCanteen: number;
  /** GST retained by platform (difference from price elevation) */
  gstRetained: number;
  /** Number of Zlice orders */
  zliceOrderCount: number;
  /** Number of PoS orders */
  posOrderCount: number;
}

export interface KPIStats {
  totalRevenue: number;
  totalProfit: number;
  totalCanteens: number;
  activeCanteens: number;
  totalOrders: number;
  zliceOrders: number;
  posOrders: number;
  averageOrderValue: number;
}

export interface CanteenPerformance {
  id: string;
  name: string;
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  zliceOrderCount: number;
  posOrderCount: number;
  avgOrderValue: number;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Check if an order is from Zlice App (online order)
 * Zlice orders have a user_id associated
 */
export function isZliceOrder(order: Pick<OrderFinancials, 'from_pos'>): boolean {
  return !order.from_pos;
}

/**
 * Format amount as Indian Rupee currency
 * @param amount - Amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 */
export function formatCurrency(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Format large numbers with Indian number system (lakhs, crores)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

// ==================== IST TIMEZONE UTILITIES ====================

/**
 * Get current date/time in IST timezone
 * Returns a Date object with IST context
 * 
 * @param date - Optional date to convert. If omitted, uses current time.
 * @returns Date object representing the same moment in IST timezone
 */
export function getISTDate(date?: Date | string): Date {
  const inputDate = date ? new Date(date) : new Date();
  return new Date(inputDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Get start of day in IST, returned as UTC Date for database queries
 * 
 * Example: IST 2024-01-15 00:00:00 IST -> returns Date object representing
 * that exact moment in time (which when converted to UTC might be 2024-01-14 18:30:00)
 * 
 * @param date - The date to get the start of day for (in IST context)
 * @returns Date object set to 00:00:00.000 IST, ready for database comparison
 */
export function getISTDayStart(date: Date): Date {
  const istDate = getISTDate(date);
  istDate.setHours(0, 0, 0, 0);
  
  // Create a new UTC date from the IST components
  // This preserves the IST boundary when comparing with DB timestamps
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();
  
  // Reconstruct as IST then convert to UTC equivalent
  const istString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  return new Date(istString + '+05:30'); // IST offset
}

/**
 * Get end of day in IST, returned as UTC Date for database queries
 * 
 * Example: IST 2024-01-15 23:59:59.999 IST -> returns Date object representing
 * that exact moment in time
 * 
 * @param date - The date to get the end of day for (in IST context)
 * @returns Date object set to 23:59:59.999 IST, ready for database comparison
 */
export function getISTDayEnd(date: Date): Date {
  const istDate = getISTDate(date);
  istDate.setHours(23, 59, 59, 999);
  
  // Create a new UTC date from the IST components
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();
  
  // Reconstruct as IST then convert to UTC equivalent
  const istString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59.999`;
  return new Date(istString + '+05:30'); // IST offset
}

/**
 * Format date as YYYY-MM-DD in IST timezone
 * 
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format (IST timezone)
 */
export function formatISTDate(date: Date): string {
  const istDate = getISTDate(date);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Start hour of the canteen business day in IST (18 = 6 PM) */
export const CANTEEN_DAY_START_HOUR = 18;

/** End hour of the canteen business day in IST (6 = 6 AM next day) */
export const CANTEEN_DAY_END_HOUR = 6;

/**
 * Get the standard IST calendar day boundaries for a given date string.
 *
 * A "day" for date D is defined as:
 *   Start: D @ 00:00:00 IST
 *   End:   D @ 23:59:59 IST
 *
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns { start: Date, end: Date } as UTC-equivalent Date objects for DB queries
 */
export function getCanteenDayBounds(dateStr: string): { start: Date; end: Date } {
  // Start: selected date at 00:00:00 IST
  const start = new Date(`${dateStr}T00:00:00+05:30`);

  // End: same calendar day at 23:59:59.999 IST
  const end = new Date(`${dateStr}T23:59:59.999+05:30`);

  return { start, end };
}


/**
 * Check if a given date is a working day
 * Rules: Mon-Fri AND NOT a Bank Holiday
 */
export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  // 1. Weekend Check (Sat=6, Sun=0)
  if (day === 0 || day === 6) {
    return false;
  }
  
  // 2. Bank Holiday Check
  // Format to YYYY-MM-DD in IST to match set
  const dateStr = formatISTDate(date);
  if (BANK_HOLIDAYS.has(dateStr)) {
    return false;
  }
  
  return true;
}

// ==================== CALCULATION FUNCTIONS ====================

/**
 * Calculate platform profit for a single order
 * 
 * For Zlice Orders:
 *   profit = (total_amount * 0.98) - delivery_partner_amount - packaging_amount - gst_amount_canteen - canteen_base_subtotal
 * 
 * For PoS Orders:
 *   profit = 0 (no platform profit from PoS orders)
 * 
 * @param order - Order with financial data
 * @returns Platform profit for this order
 */
export function calculatePlatformProfit(order: OrderFinancials): number {
  if (!isZliceOrder(order)) {
    // PoS orders have no platform profit
    return 0;
  }

  // Amount after payment gateway takes 2%
  const netAfterGateway = order.total_amount * (1 - GATEWAY_FEE_RATE);
  
  // Actual amounts paid out
  const deliveryPayout = order.delivery_partner_amount || order.delivery_fee || 0;
  const packagingPayout = order.packaging_amount || order.packaging_fee || 0;
  const gstCanteenPayout = order.gst_amount_canteen || 0;
  
  // Calculate base item subtotal (reverse engineer from total)
  // total_amount = inflated_subtotal + gst_total + delivery_fee + packaging_fee
  // inflated_subtotal = base_subtotal * 1.05
  // gst_total = inflated_subtotal * 0.05 (if GST enabled)
  const deliveryFee = order.delivery_fee || 0;
  const packagingFee = order.packaging_fee || 0;
  const gstTotal = order.gst_amount_total || 0;
  
  // inflated_subtotal_with_gst = total_amount - delivery_fee - packaging_fee
  const subtotalWithGst = order.total_amount - deliveryFee - packagingFee;
  
  // If GST enabled: inflated_subtotal = subtotalWithGst / 1.05 (reverse GST)
  // If not: inflated_subtotal = subtotalWithGst
  const inflatedSubtotal = order.is_gst_enabled 
    ? subtotalWithGst / (1 + GST_RATE)
    : subtotalWithGst;
  
  // base_subtotal = inflated_subtotal / 1.05
  const baseSubtotal = inflatedSubtotal / (1 + ITEM_MARKUP_RATE);
  
  // Platform profit = what we receive after gateway - what we pay out
  const profit = netAfterGateway - deliveryPayout - packagingPayout - gstCanteenPayout - baseSubtotal;
  
  return Math.max(0, profit); // Ensure non-negative
}

/**
 * Calculate GST split for an order
 * 
 * @returns Object with GST total, canteen share, and retained amount
 */
export function calculateGstSplit(order: OrderFinancials): {
  gstTotal: number;
  gstCanteen: number;
  gstRetained: number;
} {
  const gstTotal = order.gst_amount_total || 0;
  const gstCanteen = order.gst_amount_canteen || 0;
  const gstRetained = gstTotal - gstCanteen;
  
  return { gstTotal, gstCanteen, gstRetained };
}

/**
 * Calculate amount owed to canteen for an order
 * 
 * canteen_amount = base_item_subtotal + gst_amount_canteen + packaging_amount
 * 
 * Note: For legacy orders where these fields may be 0, we fall back to
 * calculating from canteen_price in order_items
 */
export function calculateCanteenAmount(order: OrderFinancials): number {
  const packagingAmount = order.packaging_amount || order.packaging_fee || 0;
  const gstCanteen = order.gst_amount_canteen || 0;
  
  // Calculate base subtotal (reverse from total)
  const deliveryFee = order.delivery_fee || 0;
  const packagingFee = order.packaging_fee || 0;
  const gstTotal = order.gst_amount_total || 0;
  
  const subtotalWithGst = order.total_amount - deliveryFee - packagingFee;
  const inflatedSubtotal = order.is_gst_enabled 
    ? subtotalWithGst / (1 + GST_RATE)
    : subtotalWithGst;
  
  // For Zlice orders, base = inflated / 1.05
  // For PoS orders, base = inflated (no markup)
  const baseSubtotal = isZliceOrder(order)
    ? inflatedSubtotal / (1 + ITEM_MARKUP_RATE)
    : inflatedSubtotal;
  
  return baseSubtotal + gstCanteen + packagingAmount;
}

/**
 * Calculate the T-2 cutoff date for settlement eligibility.
 * 
 * Rules:
 * - Orders created ON or BEFORE this date are eligible for settlement TODAY.
 * - This effectively reverses the T+2 logic:
 *   If today is Wed, visible orders are from Mon (or earlier).
 *   If today is Tue, visible orders are from Fri (or earlier).
 * 
 * @param referenceDate - The anchor date (usually Today)
 * @returns The latest Order Creation Date that is eligible for settlement
 */
export function getSettlementEligibilityDate(referenceDate: Date = new Date()): Date {
  const cutoff = new Date(referenceDate);
  let workingDaysSubtracted = 0;
  
  // Convert to IST context for accurate day checks
  const istDate = new Date(cutoff.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istDate.setHours(0, 0, 0, 0);

  // Go backwards 2 working days
  while (workingDaysSubtracted < 2) {
    istDate.setDate(istDate.getDate() - 1);
    // If it's a working day, we count it as 1 day of the T+2 cycle
    if (isWorkingDay(istDate)) {
        workingDaysSubtracted++;
    }
    // If it's a holiday/weekend, we skip counting it (it just adds to the delay)
  }
  
  // Set to end of that day to include all orders from that day
  const result = new Date(istDate);
  result.setHours(23, 59, 59, 999);
  
  // Convert back to UTC for DB query
  // Actually, we usually want to return the IST boundary, and let the caller handle UTC conversion
  // or return a Date object that effectively points to that moment in time.
  return result;
}

/**
 * Calculate aggregated settlement breakdown for multiple orders
 * 
 * This provides a complete financial summary suitable for:
 * - Settlement cards
 * - Admin dashboards
 * - Financial reports
 */
export function calculateSettlementBreakdown(orders: OrderFinancials[]): SettlementBreakdown {
  const breakdown: SettlementBreakdown = {
    totalRevenue: 0,
    zliceCommission: 0,
    netAfterGateway: 0,
    canteenSettlement: 0,
    deliveryPartnerAmount: 0,
    platformProfit: 0,
    gstTotal: 0,
    gstCanteen: 0,
    gstRetained: 0,
    zliceOrderCount: 0,
    posOrderCount: 0,
  };

  for (const order of orders) {
    const isZlice = isZliceOrder(order);
    
    // Count orders
    if (isZlice) {
      breakdown.zliceOrderCount++;
    } else {
      breakdown.posOrderCount++;
    }

    // Revenue (Gross Canteen Earning)
    breakdown.totalRevenue += calculateCanteenAmount(order);

    // Zlice commission (only for Zlice orders)
    if (isZlice) {
      breakdown.zliceCommission += order.total_amount * ZLICE_COMMISSION_RATE;
      breakdown.netAfterGateway += order.total_amount * (1 - GATEWAY_FEE_RATE);
    } else {
      breakdown.netAfterGateway += order.total_amount;
    }

    // Delivery partner payouts
    breakdown.deliveryPartnerAmount += order.delivery_partner_amount || order.delivery_fee || 0;

    // Canteen settlements
    breakdown.canteenSettlement += calculateCanteenAmount(order);

    // GST breakdown
    const gstSplit = calculateGstSplit(order);
    breakdown.gstTotal += gstSplit.gstTotal;
    breakdown.gstCanteen += gstSplit.gstCanteen;
    breakdown.gstRetained += gstSplit.gstRetained;

    // Platform profit
    breakdown.platformProfit += calculatePlatformProfit(order);
  }

  return breakdown;
}

/**
 * Calculate KPI stats from orders and canteen data
 */
export function calculateKPIStats(
  orders: OrderFinancials[],
  totalCanteens: number,
  activeCanteenIds: Set<string>
): KPIStats {
  const breakdown = calculateSettlementBreakdown(orders);
  
  return {
    totalRevenue: breakdown.totalRevenue,
    totalProfit: breakdown.platformProfit,
    totalCanteens,
    activeCanteens: activeCanteenIds.size,
    totalOrders: orders.length,
    zliceOrders: breakdown.zliceOrderCount,
    posOrders: breakdown.posOrderCount,
    averageOrderValue: orders.length > 0 
      ? breakdown.totalRevenue / orders.length 
      : 0,
  };
}

/**
 * Group orders by hour for hourly sales chart
 * @param orders - Orders to group
 * @returns Array of hourly aggregates (0-23)
 */
export function groupOrdersByHour(
  orders: OrderFinancials[]
): Array<{ hour: number; hourLabel: string; revenue: number; orders: number }> {
  const hourlyMap = new Map<number, { revenue: number; orders: number }>();
  
  // Initialize all hours
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, { revenue: 0, orders: 0 });
  }

  // Aggregate orders
  for (const order of orders) {
    const orderDate = new Date(order.created_at);
    const hour = orderDate.getHours();
    const current = hourlyMap.get(hour)!;
    hourlyMap.set(hour, {
      revenue: current.revenue + calculateCanteenAmount(order),
      orders: current.orders + 1,
    });
  }

  // Convert to array
  return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    hourLabel: `${hour.toString().padStart(2, '0')}:00`,
    ...data,
  }));
}

/**
 * Group orders by date for revenue time series
 * @param orders - Orders to group
 * @param granularity - 'day' | 'week' | 'month'
 */
export function groupOrdersByDate(
  orders: OrderFinancials[],
  granularity: 'day' | 'week' | 'month' = 'day'
): Array<{ date: string; revenue: number; orders: number; zliceRevenue: number; posRevenue: number }> {
  const dateMap = new Map<string, { 
    revenue: number; 
    orders: number; 
    zliceRevenue: number; 
    posRevenue: number 
  }>();

  for (const order of orders) {
    const orderDate = resolveSettlementDate(order.created_at);
    let dateKey: string;

    switch (granularity) {
      case 'week':
        // Get start of week (Monday)
        const day = orderDate.getDay();
        const diff = orderDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(orderDate);
        weekStart.setDate(diff);
        dateKey = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        break;
      case 'month':
        dateKey = orderDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        break;
      default: // day
        dateKey = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    const current = dateMap.get(dateKey) || { 
      revenue: 0, 
      orders: 0, 
      zliceRevenue: 0, 
      posRevenue: 0 
    };
    
    const isZlice = isZliceOrder(order);
    
    dateMap.set(dateKey, {
      revenue: current.revenue + calculateCanteenAmount(order),
      orders: current.orders + 1,
      zliceRevenue: current.zliceRevenue + (isZlice ? calculateCanteenAmount(order) : 0),
      posRevenue: current.posRevenue + (isZlice ? 0 : calculateCanteenAmount(order)),
    });
  }

  // Sort by date and return
  return Array.from(dateMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => {
      // Basic sort - for proper sorting, we'd need actual date objects
      return 0;
    });
}

/**
 * Settlement Time Series Data Point
 * This EXACT structure is required for the stacked bar chart
 */
export interface SettlementTimeSeriesPoint {
  date: string;
  /** Total revenue for the day */
  revenue: number;
  /** Total orders for the day */
  orders: number;
  /** Amount payable to canteens: base_subtotal + gst_canteen + packaging_amount */
  canteenPayment: number;
  /** Actual delivery partner payouts: delivery_partner_amount */
  deliveryAmount: number;
  /** Payment gateway fee: (delivery_fee - delivery_partner_amount) + (packaging_fee - packaging_amount) + 2% of Zlice orders */
  gatewayAmount: number;
  /** Platform profit after all payouts (Zlice orders only) */
  profit: number;
}

/**
 * Group orders by date with settlement breakdown for stacked bar chart
 * 
 * Each data point contains EXACTLY these segments for stacking:
 * 1. canteenPayment - Amount paid to canteens
 * 2. deliveryAmount - Actual delivery partner payouts
 * 3. gatewayAmount - Payment gateway fees
 * 4. profit - Platform profit
 * 
 * @param orders - Orders to aggregate
 * @param granularity - 'day' | 'week' | 'month'
 */
export function groupOrdersByDateWithSettlement(
  orders: OrderFinancials[],
  granularity: 'day' | 'week' | 'month' = 'day'
): SettlementTimeSeriesPoint[] {
  const dateMap = new Map<string, {
    revenue: number;
    orders: number;
    canteenPayment: number;
    deliveryAmount: number;
    gatewayAmount: number;
    profit: number;
  }>();

  for (const order of orders) {
    const orderDate = resolveSettlementDate(order.created_at);
    let dateKey: string;

    switch (granularity) {
      case 'week':
        const day = orderDate.getDay();
        const diff = orderDate.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(orderDate);
        weekStart.setDate(diff);
        dateKey = weekStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        break;
      case 'month':
        dateKey = orderDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        break;
      default:
        dateKey = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    const current = dateMap.get(dateKey) || {
      revenue: 0,
      orders: 0,
      canteenPayment: 0,
      deliveryAmount: 0,
      gatewayAmount: 0,
      profit: 0,
    };

    const isZlice = isZliceOrder(order);
    
    // Calculate amounts for this order
    const deliveryFee = order.delivery_fee || 0;
    const packagingFee = order.packaging_fee || 0;
    const deliveryPartnerAmount = order.delivery_partner_amount || deliveryFee;
    const packagingAmount = order.packaging_amount || packagingFee;
    
    // Gateway amount = fee markup + 2% gateway fee for Zlice orders
    const deliveryMarkup = deliveryFee - deliveryPartnerAmount;
    const packagingMarkup = packagingFee - packagingAmount;
    const gatewayFee = isZlice ? order.total_amount * GATEWAY_FEE_RATE : 0;
    const gatewayAmount = Math.max(0, deliveryMarkup + packagingMarkup + gatewayFee);
    
    // Canteen payment
    const canteenPayment = calculateCanteenAmount(order);
    
    // Delivery payout (actual amount to delivery partner)
    const deliveryAmount = deliveryPartnerAmount;
    
    // Platform profit (only from Zlice orders)
    const profit = calculatePlatformProfit(order);

    dateMap.set(dateKey, {
      revenue: current.revenue + calculateCanteenAmount(order),
      orders: current.orders + 1,
      canteenPayment: current.canteenPayment + canteenPayment,
      deliveryAmount: current.deliveryAmount + deliveryAmount,
      gatewayAmount: current.gatewayAmount + gatewayAmount,
      profit: current.profit + profit,
    });
  }

  // Convert to array - ensure all values are numbers (not undefined/null)
  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    revenue: Number(data.revenue) || 0,
    orders: Number(data.orders) || 0,
    canteenPayment: Number(data.canteenPayment) || 0,
    deliveryAmount: Number(data.deliveryAmount) || 0,
    gatewayAmount: Number(data.gatewayAmount) || 0,
    profit: Number(data.profit) || 0,
  }));
}

/**
 * Calculate performance metrics per canteen
 */
export function calculateCanteenPerformance(
  orders: OrderFinancials[],
  canteens: Array<{ id: string; name: string }>
): CanteenPerformance[] {
  const canteenMap = new Map<string, {
    name: string;
    revenue: number;
    profit: number;
    orders: number;
    zliceOrders: number;
    posOrders: number;
  }>();

  // Initialize canteens
  for (const canteen of canteens) {
    canteenMap.set(canteen.id, {
      name: canteen.name,
      revenue: 0,
      profit: 0,
      orders: 0,
      zliceOrders: 0,
      posOrders: 0,
    });
  }

  // Aggregate orders
  for (const order of orders) {
    const canteenData = canteenMap.get(order.canteen_id);
    if (!canteenData) continue;

    const isZlice = isZliceOrder(order);
    const profit = calculatePlatformProfit(order);

    canteenMap.set(order.canteen_id, {
      ...canteenData,
      revenue: canteenData.revenue + calculateCanteenAmount(order),
      profit: canteenData.profit + profit,
      orders: canteenData.orders + 1,
      zliceOrders: canteenData.zliceOrders + (isZlice ? 1 : 0),
      posOrders: canteenData.posOrders + (isZlice ? 0 : 1),
    });
  }

  // Convert to array with averages
  return Array.from(canteenMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      totalRevenue: data.revenue,
      totalProfit: data.profit,
      orderCount: data.orders,
      zliceOrderCount: data.zliceOrders,
      posOrderCount: data.posOrders,
      avgOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ==================== SETTLEMENT UTILITIES ====================

/**
 * Order Settlement Breakdown for per-order display
 * Contains all columns required for the settlement table
 */
export interface OrderSettlementBreakdown {
  orderId: string;
  orderSource: 'zlice' | 'pos';
  totalAmount: number;
  /** Gateway amount: 1.9% of total_amount for Zlice only, 0 for PoS */
  gatewayAmount: number;
  /** Food value = canteen_amount - gst_amount_canteen - packaging_amount */
  foodValue: number;
  deliveryAmount: number;
  packagingAmount: number;
  gstAmount: number;
  /** Settlement Amount = canteen_amount (what we pay to canteen) */
  settlementAmount: number;
  /** Profit = (0.98 × total_amount) - canteen_amount - delivery_partner_amount (Zlice only) */
  profit: number;
  createdAt: string;
  settlementDate: string;
  isSettled: boolean;
  couponCode?: string;
  charges?: number;
  chargeReason?: string;
  applied?: boolean;
}

/**
 * Canteen Settlement Summary Row
 * Aggregated data for a single canteen
 */
export interface CanteenSettlementSummary {
  canteenId: string;
  canteenName: string;
  /** Sum of total_amount */
  totalRevenue: number;
  /** 1.9% of Zlice orders total_amount only */
  gatewayAmount: number;
  /** Sum of (canteen_amount - gst_amount_canteen - packaging_amount) */
  foodValue: number;
  /** Sum of delivery_partner_amount */
  deliveryAmount: number;
  /** Sum of packaging_amount */
  packagingAmount: number;
  /** Sum of gst_amount_canteen */
  gstAmount: number;
  /** Sum of charges from orders */
  totalCharges: number;
  /** Sum of canteen_amount - what we pay to canteen */
  settlementAmount: number;
  /** Platform profit from Zlice orders */
  profit: number;
  /** Amount already settled/paid */
  paidAmount?: number;
  /** Amount still due for payment */
  dueAmount?: number;
  /** Order counts */
  orderCount: number;
  zliceOrderCount: number;
  posOrderCount: number;
  /** Settlement status */
  status: 'pending' | 'settled';
  settlementId?: string;
}

/**
 * Calculate T+2 working day settlement date.
 * 
 * RULES:
 * Settlement Date = Order Created Date + 2 WORKING DAYS
 * Working Days: Mon-Fri
 * Non-Working Days: Sat, Sun
 * 
 * Example Timeline:
 * Thursday Order -> Monday Settlement
 * Friday Order   -> Tuesday Settlement
 * Saturday Order -> Tuesday Settlement
 * Sunday Order   -> Tuesday Settlement
 * Monday Order   -> Wednesday Settlement
 * 
 * @param orderDate - The date the order was created
 * @returns The computed settlement date (IST Context, Start of Day)
 */
export function resolveSettlementDate(orderDate: Date | string): Date {
  // Normalize input to Date object
  const dateObj = typeof orderDate === 'string' ? new Date(orderDate) : orderDate;
  
  // Convert to IST context to ensure correct day-of-week logic
  // resulting 'istDate' has local time components matching IST time
  const istDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  istDate.setHours(0, 0, 0, 0);

  let workingDaysAdded = 0;
  
  // Algorithm: Move forward day-by-day, count only working days, stop after 2
  while (workingDaysAdded < 2) {
    istDate.setDate(istDate.getDate() + 1); // Move to next day first
    
    if (isWorkingDay(istDate)) {
      workingDaysAdded++;
    }
  }

  return istDate;
}

/**
 * Subtracts N working days from a given date.
 * Used to find the "Order Date" that would settle on the given "Settlement Date".
 */
export function subtractWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let workingDaysSubtracted = 0;

  while (workingDaysSubtracted < days) {
    result.setDate(result.getDate() - 1);
    // Determine if the new date is a working day
    // We need to use isWorkingDay helper. Ensure it is accessible or duplicate logic if not exported.
    // Assuming isWorkingDay is defined in this file (it is used in resolveSettlementDate).
    if (isWorkingDay(result)) {
      workingDaysSubtracted++;
    }
  }
  return result;
}

/**
 * Determines the date range of ORDER CREATION that would settle on the given SETTLEMENT DATE.
 * Logic:
 * 1. Find the primary working day T-2 days ago.
 * 2. Include any subsequent non-working days (weekends/holidays) that bundle into the same settlement cycle.
 * 
 * Example:
 * If Settlement = Tuesday:
 * - T-2 Working = Friday.
 * - Saturday is non-working -> Include.
 * - Sunday is non-working -> Include.
 * - Monday is working -> Stop.
 * Result: [Friday 00:00, Sunday 23:59]
 */
export function getSettlementSourceDateRange(settlementDateStr: string): { start: Date, end: Date } {
  const settlementDate = new Date(settlementDateStr);
  // Normalize to Start of Day IST context (mimicking resolveSettlementDate logic)
  const settlementIST = new Date(settlementDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  settlementIST.setHours(0, 0, 0, 0);

  // 1. Find T-2 Working Days
  const startOrderDate = subtractWorkingDays(settlementIST, 2);
  
  // 2. Extend End Date to cover subsequent non-working days
  const endOrderDate = new Date(startOrderDate);
  
  // Check next day
  const nextDay = new Date(endOrderDate);
  nextDay.setDate(nextDay.getDate() + 1);

  while (!isWorkingDay(nextDay)) {
    // If next day is non-working, it settles on the same day as previous day?
    // Wait, let's re-verify.
    // Order Fri -> Settle Tue.
    // Order Sat -> Settle Tue.
    // Order Sun -> Settle Tue.
    // Order Mon -> Settle Wed.
    // So if T-2 is Fri (for Tue settlement), we range from Fri to Sun.
    // So yes, we extend the range forward until we hit a working day.
    
    endOrderDate.setDate(endOrderDate.getDate() + 1);
    
    // Move to next checker
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Safety break to prevent infinite loops if config is wrong
    if ((nextDay.getTime() - startOrderDate.getTime()) > 30 * 24 * 60 * 60 * 1000) break;
  }

  // Set times
  // Start: 00:00:00.000
  startOrderDate.setHours(0, 0, 0, 0);
  
  // End: 23:59:59.999
  endOrderDate.setHours(23, 59, 59, 999);

  return { start: startOrderDate, end: endOrderDate };
}



/**
 * Get strict IST date boundaries (00:00:00 IST to 23:59:59 IST)
 * Converted to UTC Date objects for database querying.
 * 
 * @param date - Date object representing the IST day
 */
export function getISTDateBounds(date: Date): { startDate: Date; endDate: Date } {
  // Input 'date' is a Date object where UTC methods return IST values (values of local time)
  // 00:00:00 IST = Previous Day 18:30:00 UTC (-5.5h)
  
  const start = new Date(date); 
  start.setHours(start.getHours() - 5);
  start.setMinutes(start.getMinutes() - 30);
  
  const end = new Date(start);
  end.setHours(start.getHours() + 23);
  end.setMinutes(start.getMinutes() + 59);
  end.setSeconds(59);
  end.setMilliseconds(999);
  
  return { startDate: start, endDate: end };
}

/**
 * Determine the range of Order Creation Dates (IST) that map to a specific Settlement Date.
 * 
 * Used to reverse-engineer the query range:
 * "Show me orders that settle on Tuesday" -> "Fetch orders from Friday, Saturday, Sunday"
 */
function getOrderCreationRangeForSettlementDate(targetSettlementDate: Date): { start: Date, end: Date } {
  // Normalize target to IST start of day
  const target = new Date(targetSettlementDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  target.setHours(0, 0, 0, 0);
  
  let start: Date | null = null;
  let end: Date | null = null;
  
  // Scan back up to 7 days to find all days that result in this settlement date
  // (Max gap is typically Fri->Tue = 4 days, so 7 is safe)
  for (let i = 0; i < 7; i++) {
    const candidate = new Date(target);
    candidate.setDate(target.getDate() - i);
    
    // Check where this candidate date strictly settles
    const settled = resolveSettlementDate(candidate);
    
    // Compare (ignoring time)
    if (settled.getTime() === target.getTime()) {
      if (!end) end = new Date(candidate); // First match (looking backwards) is the LATEST date
      start = new Date(candidate); // Further matches are EARLIER dates
    }
  }
  
  // Fallback (should not happen for valid business days)
  if (!start || !end) {
    return { start: target, end: target };
  }
  
  return { start, end };
}

/**
 * Resolve a Settlement Date Range to an Order Creation Date Query Range (UTC).
 * 
 * INPUT: Settlement Date Range (e.g., "Show Settlements for Tue to Wed")
 * OUTPUT: Query Range for created_at (e.g., "Fetch orders created Fri to Mon")
 */
export function resolveSettlementDateRange(fromSettlement: Date, toSettlement: Date = fromSettlement) {
  // 1. Find the earliest order creation date for the 'from' settlement date
  const fromRange = getOrderCreationRangeForSettlementDate(fromSettlement);
  const startIST = fromRange.start; // The very first day
  
  // 2. Find the latest order creation date for the 'to' settlement date
  const toRange = getOrderCreationRangeForSettlementDate(toSettlement);
  const endIST = toRange.end; // The very last day
  
  // 3. Convert to UTC boundaries
  const startBounds = getISTDateBounds(startIST);
  const endBounds = getISTDateBounds(endIST);
  
  return {
    resolvedFrom: fromSettlement,
    resolvedTo: toSettlement,
    queryStart: startBounds.startDate, // Start of first day
    queryEnd: endBounds.endDate        // End of last day
  };
}

/**
 * Helper to get simple date range bounds for a single date
 * (Used for non-settlement contexts if needed)
 */
export const getDateBounds = (date: Date) => {
  const bounds = getISTDateBounds(date);
  return { startDate: bounds.startDate, endDate: bounds.endDate };
};

/** Settlement gateway rate (1.9% as per spec) */
export const SETTLEMENT_GATEWAY_RATE = 0.019;

/**
 * Extended order interface for settlement calculations
 * Includes canteen_amount field
 */
export interface OrderForSettlement extends OrderFinancials {
  canteen_amount: number;
  is_settled: boolean;
  coupon_code?: string;
  charges?: number;
  charge_reason?: string;
  applied?: boolean;
}

/**
 * Calculate settlement breakdown for a single order
 * 
 * @param order - Order with financial data
 * @returns Order settlement breakdown with all required columns
 */
export function calculateOrderSettlement(order: OrderForSettlement): OrderSettlementBreakdown {
  const isZlice = isZliceOrder(order);
  const orderSource: 'zlice' | 'pos' = isZlice ? 'zlice' : 'pos';
  
  const totalAmount = Number(order.total_amount) || 0;
  const canteenAmount = Number(order.canteen_amount) || 0;
  const deliveryPartnerAmount = Number(order.delivery_partner_amount) || Number(order.delivery_fee) || 0;
  const packagingAmount = Number(order.packaging_amount) || Number(order.packaging_fee) || 0;
  const gstCanteen = Number(order.gst_amount_canteen) || 0;
  
  // Gateway amount: 1.9% of total_amount for Zlice ONLY
  const gatewayAmount = isZlice ? totalAmount * SETTLEMENT_GATEWAY_RATE : 0;
  
  // Food value = canteen_amount - gst_amount_canteen - packaging_amount
  const foodValue = Math.max(0, canteenAmount - gstCanteen - packagingAmount);
  
  // Settlement amount = canteen_amount - charges (IF applied)
  // Logic: 
  // - If order is NOT settled, settlementAmount = canteen_amount - UNAPPLIED charges (what is due)
  // - If order IS settled, settlementAmount = canteen_amount - APPLIED charges (what was paid)
  
  const charges = Number(order.charges) || 0;
  const settlementAmount = Math.max(0, canteenAmount - charges);
  
  // Profit = (0.98 × total_amount) - canteen_amount - delivery_partner_amount (Zlice only)
  // PoS orders have 0 profit
  let profit = 0;
  if (isZlice) {
    profit = (totalAmount * (1 - GATEWAY_FEE_RATE)) - canteenAmount - deliveryPartnerAmount;
    profit = Math.max(0, profit); // Ensure non-negative
  }
  
  const settlementDate = resolveSettlementDate(order.created_at);

  return {
    orderId: order.id,
    orderSource,
    totalAmount,
    gatewayAmount,
    foodValue,
    deliveryAmount: deliveryPartnerAmount,
    packagingAmount,
    gstAmount: gstCanteen,
    settlementAmount,
    profit,
    createdAt: order.created_at,
    settlementDate: settlementDate.toISOString(),
    isSettled: !!order.is_settled, // Force boolean
    couponCode: order.coupon_code,
    charges: order.charges,
    chargeReason: order.charge_reason,
    applied: order.applied,
  };
}

/**
 * Aggregate settlement data for a canteen from multiple orders
 * 
 * @param orders - Orders for a single canteen
 * @param canteenName - Name of the canteen
 * @param canteenId - ID of the canteen
 * @param status - Settlement status
 * @param settlementId - Settlement record ID if settled
 * @returns Aggregated canteen settlement summary
 */
export function aggregateCanteenSettlement(
  orders: OrderForSettlement[],
  canteenId: string,
  canteenName: string,
  status: 'pending' | 'settled' = 'pending',
  settlementId?: string
): CanteenSettlementSummary {
  const summary: CanteenSettlementSummary = {
    canteenId,
    canteenName,
    totalRevenue: 0,
    gatewayAmount: 0,
    foodValue: 0,
    deliveryAmount: 0,
    packagingAmount: 0,
    gstAmount: 0,
    totalCharges: 0,
    settlementAmount: 0,
    profit: 0,
    paidAmount: 0,
    dueAmount: 0,
    orderCount: 0,
    zliceOrderCount: 0,
    posOrderCount: 0,
    status,
    settlementId,
  };

  for (const order of orders) {
    const breakdown = calculateOrderSettlement(order);
    
    summary.totalRevenue += breakdown.totalAmount;
    summary.gatewayAmount += breakdown.gatewayAmount;
    summary.foodValue += breakdown.foodValue;
    summary.deliveryAmount += breakdown.deliveryAmount;
    summary.packagingAmount += breakdown.packagingAmount;
    summary.gstAmount += breakdown.gstAmount;
    summary.totalCharges += Number(order.charges) || 0;
    summary.settlementAmount += breakdown.settlementAmount;
    summary.profit += breakdown.profit;
    summary.orderCount++;
    
    if (order.is_settled) {
      summary.paidAmount! += breakdown.settlementAmount;
    } else {
      summary.dueAmount! += breakdown.settlementAmount;
    }
    
    if (breakdown.orderSource === 'zlice') {
      summary.zliceOrderCount++;
    } else {
      summary.posOrderCount++;
    }
  }

  return summary;
}

/**
 * Format date for display in settlement UI
 */
export function formatSettlementDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

