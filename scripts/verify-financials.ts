
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

// Initialize Supabase Client (Verify env vars are present)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Business Logic Verification
function verifyOrder(order: any) {
  const issues: string[] = [];
  const isZlice = order.user_id !== null;
  const isPos = !isZlice;

  // Rule: total_amount = canteen_amount + delivery_fee + (for Zlice maybe gateway logic, but let's stick to base rule)
  // Actually, for POS: total_amount = canteen_amount + delivery_fee
  // For Zlice: total_amount includes markup, so canteen_amount < total_amount - delivery_fee

  const total = Number(order.total_amount);
  const canteenAmt = Number(order.canteen_amount);
  const delivery = Number(order.delivery_fee);
  const packaging = Number(order.packaging_fee);

  if (isPos) {
    const expectedCanteenAmount = total - delivery;
    // Allow small float diff
    if (Math.abs(canteenAmt - expectedCanteenAmount) > 0.05) {
      issues.push(`POS Order Mismatch: Canteen Amount is ${canteenAmt}, expected ${expectedCanteenAmount} (Total ${total} - Delivery ${delivery})`);
    }
  } else {
    // Zlice logic is more complex, but canteen amount should definitely be less than total
    if (canteenAmt >= total) {
       issues.push(`Zlice Order Warning: Canteen Amount (${canteenAmt}) >= Total Amount (${total}). Expected markup margin.`);
    }
  }

  return issues;
}

async function runVerification() {
  console.log("Starting Financial Verification...");
  
  // Fetch last 50 orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch orders", error);
    return;
  }

  console.log(`Verifying ${orders.length} orders...`);
  
  let issueCount = 0;
  
  for (const order of orders) {
    const issues = verifyOrder(order);
    if (issues.length > 0) {
      console.error(`[Order ${order.order_number}] Issues:`);
      issues.forEach(i => console.error(`  - ${i}`));
      issueCount++;
    }
  }

  if (issueCount === 0) {
    console.log("✅ All orders passed verification!");
  } else {
    console.error(`❌ Found issues in ${issueCount} orders.`);
  }
}

runVerification();
