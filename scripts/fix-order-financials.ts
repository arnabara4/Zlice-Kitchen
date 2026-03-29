
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFinancials() {
  console.log("Scanning for financial discrepancies...");

  // Fetch all POS orders (user_id is null)
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .is('user_id', null);

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  let fixedCount = 0;

  for (const order of orders) {
    const total = Number(order.total_amount);
    const canteenAmt = Number(order.canteen_amount);
    const delivery = Number(order.delivery_fee);
    
    // Logic: canteen_amount should be total - delivery
    const expectedCanteenAmount = total - delivery;

    if (Math.abs(canteenAmt - expectedCanteenAmount) > 0.05) {
      console.log(`Fixing Order ${order.order_number} (${order.id}):`);
      console.log(`  Current: ${canteenAmt}, Expected: ${expectedCanteenAmount}`);
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ canteen_amount: expectedCanteenAmount })
        .eq('id', order.id);

      if (updateError) {
        console.error(`  Failed to fix: ${updateError.message}`);
      } else {
        console.log(`  ✅ Fixed.`);
        fixedCount++;
      }
    }
  }

  console.log(`\nCompleted. Fixed ${fixedCount} orders.`);
}

fixFinancials();
