-- 022_fix_rls_for_anonymous_access.sql
-- Updates RLS policies to allow anonymous read access for active canteens
-- This is needed because the app uses anonymous Supabase access (ANON_KEY)

-- Drop the restrictive policies
DROP POLICY IF EXISTS "Allow reading menu items for active canteens" ON public.menu_items;
DROP POLICY IF EXISTS "Allow reading orders for active canteens" ON public.orders;
DROP POLICY IF EXISTS "Allow reading order items for active canteens" ON public.order_items;

-- Menu Items - Allow anonymous read access for active canteens
CREATE POLICY "Allow anonymous to read menu items"
  ON public.menu_items FOR SELECT
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

-- Orders - Allow anonymous read and write access for active canteens
CREATE POLICY "Allow anonymous to read orders"
  ON public.orders FOR SELECT
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

-- Order Items - Allow anonymous read access
CREATE POLICY "Allow anonymous to read order items"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
    )
  );

-- Note: Write policies (INSERT, UPDATE, DELETE) remain unchanged and still require proper authorization
