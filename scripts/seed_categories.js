const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const categories = [
  { name: 'Thali', image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Biryani', image_url: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60' },
  { name: 'Wraps', image_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60' },
  { name: 'Salads', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60' },
  { name: 'Ice Cream', image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=60' },
  { name: 'Rolls', image_url: 'https://images.unsplash.com/photo-1541592393394-550302b1897d?w=500&auto=format&fit=crop&q=60' },
  { name: 'Sandwich', image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60' },
  { name: 'Pizza', image_url: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60' },
  { name: 'Burger', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60' }
];

async function seedCategories() {
  console.log('Seeding categories...');
  
  // Use upsert to avoid duplicates
  const { data, error } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'name', ignoreDuplicates: true });

  if (error) {
    console.error('Error seeding categories:', error);
  } else {
    console.log('Categories seeded successfully!');
  }
}

seedCategories();
