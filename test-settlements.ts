import { calculateOrderSettlement, aggregateCanteenSettlement, OrderForSettlement } from './lib/financial-utils';

// Mock Orders
const mockOrders: OrderForSettlement[] = [
  {
    id: 'order-1',
    user_id: 'user-a',
    canteen_id: 'canteen-a',
    total_amount: 100, // Zlice order
    canteen_amount: 100,
    delivery_fee: 10,
    packaging_fee: 5,
    delivery_partner_amount: 10,
    packaging_amount: 5,
    gst_amount_total: 5,
    gst_amount_canteen: 5,
    is_gst_enabled: false,
    created_at: new Date().toISOString(),
    is_settled: false,
    charges: 10, // Order specific charge
    charge_reason: 'Penalty',
    from_pos: false,
  },
  {
    id: 'order-2',
    user_id: null, // POS order -> should skip gateway fee, etc if calculating platform
    canteen_id: 'canteen-a',
    total_amount: 200, 
    canteen_amount: 200,
    delivery_fee: 0,
    packaging_fee: 0,
    delivery_partner_amount: 0,
    packaging_amount: 0,
    gst_amount_total: 0,
    gst_amount_canteen: 0,
    is_gst_enabled: false,
    created_at: new Date().toISOString(),
    is_settled: false,
    charges: 0, 
    charge_reason: '',
    from_pos: true,
  }
];

// Test 1: Single Order Settlement Calculation
console.log('--- TEST 1: Single Order Settlement (Order Specific Charge) ---');
// Pass a per-order distributed charge of 5 via the order object
mockOrders[0].charges = 5;
const order1Result = calculateOrderSettlement(mockOrders[0]);
console.log(JSON.stringify(order1Result, null, 2));

// Test 2: Aggregate Canteen Settlement
console.log('\n--- TEST 2: Aggregate Canteen Settlement (with Distributed Charge) ---');
// Pass total distributed charge of 20 for Canteen A via order accumulation
mockOrders[1].charges = 15; // 5 from order 1 + 15 from order 2 = 20 total
const aggregateResult = aggregateCanteenSettlement(
  mockOrders,
  'canteen-a',
  'Test Canteen',
  'pending'
);
console.log(JSON.stringify(aggregateResult, null, 2));

