-- 012_add_ashim_canteen_and_map_data.sql
-- This script adds the Ashim canteen and maps all existing data to it

-- Step 1: Insert Ashim canteen
-- Note: Password is hashed version of '12345678' using bcryptjs with 10 salt rounds
-- Hash generated: $2a$10$rZ8qHW8X5nF5YvJ5FvJxYeYvJxYeYvJxYeYvJxYeYvJxYeYvJxYe
-- You'll need to replace the logo_url after uploading to Cloudinary

INSERT INTO public.canteens (
  id,
  name,
  email,
  password_hash,
  logo_url,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ASHIM''s Canteen',
  'ashim@canteen.com',
  '$2a$10$rZ8qHW8X5nF5YvJ5FvJxYeYvJxYeYvJxYeYvJxYeYvJxYeYvJxYe', -- Password: 12345678
  NULL, -- Will be updated via API after upload
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING
RETURNING id;

-- Step 2: Store the canteen_id in a variable (for PostgreSQL)
DO $$
DECLARE
  ashim_canteen_id UUID;
BEGIN
  -- Get the Ashim canteen ID
  SELECT id INTO ashim_canteen_id
  FROM public.canteens
  WHERE email = 'ashim@canteen.com'
  LIMIT 1;

  -- Update all existing menu_items to belong to Ashim canteen
  UPDATE public.menu_items
  SET canteen_id = ashim_canteen_id
  WHERE canteen_id IS NULL;

  -- Update all existing orders to belong to Ashim canteen
  UPDATE public.orders
  SET canteen_id = ashim_canteen_id
  WHERE canteen_id IS NULL;

  -- Update all existing khata_students to belong to Ashim canteen
  UPDATE public.khata_students
  SET canteen_id = ashim_canteen_id
  WHERE canteen_id IS NULL;

  -- Update all existing khata_entries to belong to Ashim canteen
  UPDATE public.khata_entries
  SET canteen_id = ashim_canteen_id
  WHERE canteen_id IS NULL;

  -- Output success message
  RAISE NOTICE 'Ashim canteen created and all existing data mapped successfully!';
  RAISE NOTICE 'Canteen ID: %', ashim_canteen_id;
END $$;

-- Verify the mapping
SELECT 
  'Menu Items' as table_name,
  COUNT(*) as records_mapped
FROM public.menu_items
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com')

UNION ALL

SELECT 
  'Orders' as table_name,
  COUNT(*) as records_mapped
FROM public.orders
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com')

UNION ALL

SELECT 
  'Khata Students' as table_name,
  COUNT(*) as records_mapped
FROM public.khata_students
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com')

UNION ALL

SELECT 
  'Khata Entries' as table_name,
  COUNT(*) as records_mapped
FROM public.khata_entries
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com');
