-- 013_map_existing_data_to_ashim.sql
-- Run this AFTER creating the Ashim canteen via the API or web interface
-- This script maps all existing NULL canteen_id records to Ashim's canteen

-- Update all existing menu_items to belong to Ashim canteen
UPDATE public.menu_items
SET canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com' LIMIT 1)
WHERE canteen_id IS NULL;

-- Update all existing orders to belong to Ashim canteen
UPDATE public.orders
SET canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com' LIMIT 1)
WHERE canteen_id IS NULL;

-- Update all existing khata_students to belong to Ashim canteen
UPDATE public.khata_students
SET canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com' LIMIT 1)
WHERE canteen_id IS NULL;

-- Update all existing khata_entries to belong to Ashim canteen
UPDATE public.khata_entries
SET canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com' LIMIT 1)
WHERE canteen_id IS NULL;

-- Display summary of mapped data
SELECT 
  'Ashim Canteen ID' as info,
  id::text as value
FROM public.canteens 
WHERE email = 'ashim@canteen.com'

UNION ALL

SELECT 
  'Menu Items Mapped' as info,
  COUNT(*)::text as value
FROM public.menu_items
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com')

UNION ALL

SELECT 
  'Orders Mapped' as info,
  COUNT(*)::text as value
FROM public.orders
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com')

UNION ALL

SELECT 
  'Khata Students Mapped' as info,
  COUNT(*)::text as value
FROM public.khata_students
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com')

UNION ALL

SELECT 
  'Khata Entries Mapped' as info,
  COUNT(*)::text as value
FROM public.khata_entries
WHERE canteen_id = (SELECT id FROM public.canteens WHERE email = 'ashim@canteen.com');
