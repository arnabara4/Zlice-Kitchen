require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("Fetching kitchens from DB...");
  const { data, error } = await supabaseAdmin
    .from('canteens')
    .select('id, name, email, verification_status, home_cook')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("DB records:", JSON.stringify(data, null, 2));
  }
}

check();
