/**
 * Analytics Types for Admin Dashboard
 * 
 * These types define the data structures used across the analytics
 * dashboard, API responses, and chart components.
 */

// ==================== FILTER TYPES ====================

export type OrderSource = 'zlice' | 'pos' | 'all';
export type DateGranularity = 'day' | 'week' | 'month';
export type DatePreset = 'today' | 'yesterday' | '7d' | '30d' | 'custom';

export interface AnalyticsFilters {
  startDate: Date | null;
  endDate: Date | null;
  datePreset: DatePreset;
  orderSource: OrderSource;
  canteenIds: string[];
  granularity: DateGranularity;
}

// ==================== SETTLEMENT TYPES ====================

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

// ==================== KPI TYPES ====================

export interface DashboardStats {
  todayRevenue: number;
  yesterdayRevenue: number;
  todayOrders: number;
  yesterdayOrders: number;
  totalStudents: number;
  activeStudents: number;
  todayKhataCollection: number;
  yesterdayKhataCollection: number;
  avgOrderValue: number;
  previousAvgOrderValue: number;
}

export interface WalletStats {
  /** SUM(canteen_amount) WHERE is_settled = false (Zlice orders only) */
  netBalance: number;
  lifetimeGross: number;
  /** Total Zlice canteen_amount (lifetime) */
  lifetimeNet: number;
  /** SUM(canteen_amount) WHERE is_settled = true */
  lifetimePaid: number;
  /** Global average order value */
  aov: number;
  /** Total value of Zlice-only orders (from_pos = false) */
  zliceRevenue?: number;
}

// ==================== CHART DATA TYPES ====================

export interface RevenueChartData {
  label: string;
  revenue: number;
  orders: number;
  zliceRevenue: number;
  posRevenue: number;
  dineIn: number;
  takeaway: number;
  delivery: number;
  appRevenue: number; // New
  dineInCount: number;
  takeawayCount: number;
  deliveryCount: number;
  posOrderCount: number;
  appOrderCount: number;
}

export interface RevenueTimeSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
  zliceRevenue: number;
  posRevenue: number;
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

export interface HourlySalesPoint {
  hour: number;
  hourLabel: string;
  revenue: number;
  orders: number;
}

export interface HourlySalesByCanteen {
  hour: number;
  hourLabel: string;
  [canteenId: string]: number | string; // Dynamic canteen keys with revenue values
}

// ==================== CANTEEN PERFORMANCE TYPES ====================

export interface CanteenPerformance {
  id: string;
  name: string;
  totalRevenue: number;
  totalProfit: number;
  orderCount: number;
  zliceOrderCount: number;
  posOrderCount: number;
  avgOrderValue: number;
  revenueShare: number; // Percentage of total revenue
}

// ==================== API RESPONSE TYPES ====================

export interface AnalyticsAPIResponse {
  success: boolean;
  filters: {
    startDate: string;
    endDate: string;
    orderSource: OrderSource;
    canteenIds: string[];
    granularity: DateGranularity;
  };
  kpiStats: KPIStats;
  settlementBreakdown: SettlementBreakdown;
  revenueTimeSeries: RevenueTimeSeriesPoint[];
  /** Settlement breakdown per day for stacked bar chart */
  settlementTimeSeries: SettlementTimeSeriesPoint[];
  hourlySales: HourlySalesPoint[];
  hourlySalesByCanteen: HourlySalesByCanteen[];
  canteenPerformance: CanteenPerformance[];
  timestamp: string;
}

export interface CanteenOption {
  id: string;
  name: string;
  isActive: boolean;
}

// ==================== TOOLTIP DATA TYPES ====================

export interface SettlementTooltipData {
  label: string;
  formula: string;
  description: string;
  value: number;
}

// ==================== SETTLEMENT PAGE TYPES ====================

export interface OrderSettlementRow {
  orderId: string;
  orderSource: 'zlice' | 'pos';
  totalAmount: number;
  gatewayAmount: number;
  foodValue: number;
  deliveryAmount: number;
  packagingAmount: number;
  gstAmount: number;
  settlementAmount: number;
  profit: number;
  createdAt: string;
  settlementDate: string;
  isSettled: boolean;
  couponCode?: string;
  charges?: number;
  chargeReason?: string;
}

export interface CanteenSettlementRow {
  canteenId: string;
  canteenName: string;
  totalRevenue: number;
  gatewayAmount: number;
  foodValue: number;
  deliveryAmount: number;
  packagingAmount: number;
  gstAmount: number;
  totalCharges: number;
  settlementAmount: number;
  paidAmount?: number;
  dueAmount?: number;
  profit: number;
  orderCount: number;
  zliceOrderCount: number;
  posOrderCount: number;
  status: 'pending' | 'settled';
  settlementId?: string;
}

export interface SettlementsAPIResponse {
  success: boolean;
  /** User's selected date (what they picked in the date picker) */
  selectedDate: string;
  /** Formatted selected date for display */
  selectedDateFormatted: string;
  canteens: CanteenSettlementRow[];
  totals: {
    totalRevenue: number;
    gatewayAmount: number;
    foodValue: number;
    deliveryAmount: number;
    packagingAmount: number;
    gstAmount: number;
    totalCharges: number;
    settlementAmount: number;
    profit: number;
    orderCount: number;
  };
  /** Debug info */
  debug?: {
    orderCount: number;
    rawTotalRevenue: number;
  };
  timestamp: string;
}

export interface OrderDetailsAPIResponse {
  success: boolean;
  canteenId: string;
  canteenName: string;
  /** User's selected date */
  selectedDate: string;
  /** Formatted selected date for display */
  selectedDateFormatted: string;
  
  resolvedDate?: string;
  resolvedDateFormatted?: string;
  resolvedFrom?: string;
  resolvedTo?: string;

  orders: OrderSettlementRow[];
  standaloneCharges?: Array<{
    amount: number;
    reason: string;
    createdAt: string;
  }>;
  totals: CanteenSettlementRow;
  timestamp: string;
}

export interface SettleActionResponse {
  success: boolean;
  settlementId: string;
  canteenId: string;
  amount: number;
  status: 'settled';
  timestamp: string;
}

