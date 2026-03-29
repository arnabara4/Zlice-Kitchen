
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
      if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
      } else {
        console.log('No orders found, cannot inspect columns from data.');
      }
  }
}

inspect();
