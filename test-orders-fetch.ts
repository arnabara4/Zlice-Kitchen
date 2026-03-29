import "dotenv/config";
import { supabaseAdmin } from './lib/supabase/admin';

async function testFetch() {
  console.log("Fetching orders with supabaseAdmin...");
  
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, is_settled, user_id, canteen_id, total_amount, canteen_amount")
    .not("canteen_amount", "is", null)
    .not("user_id", "is", null)
    .limit(10);

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log(`Found ${orders?.length || 0} valid settlement orders:`);
  console.log(JSON.stringify(orders, null, 2));
}

testFetch();
