
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedQuery() {
  console.log("Testing fixed query with nested join...");
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_items (
        quantity,
        menu_items (
          name
        )
      )
    `)
    .limit(1)
    .single();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Fixed Query Data:", JSON.stringify(data, null, 2));
    
    // Simulate mapping logic
    const itemsList = (data.order_items || []).map((item: any) => {
        const itemName = item.menu_items?.name || "Unknown Item";
        return `${item.quantity}x ${itemName}`;
    }).join(", ");
    
    console.log("Formatted Items String:", itemsList);
  }
}

testFixedQuery();
