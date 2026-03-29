-- 011_update_rls_policies_for_canteens.sql
-- Updates RLS policies to support multi-canteen access control

-- Drop old policies
DROP POLICY IF EXISTS "Allow anyone to read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow anyone to read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anyone to read order items" ON public.order_items;

-- Menu Items RLS Policies
CREATE POLICY "Allow reading menu items for active canteens"
  ON public.menu_items FOR SELECT
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow inserting menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow updating menu items"
  ON public.menu_items FOR UPDATE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow deleting menu items"
  ON public.menu_items FOR DELETE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

-- Orders RLS Policies
CREATE POLICY "Allow reading orders for active canteens"
  ON public.orders FOR SELECT
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow inserting orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow updating orders"
  ON public.orders FOR UPDATE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow deleting orders"
  ON public.orders FOR DELETE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

-- Order Items RLS Policies (through orders relationship)
CREATE POLICY "Allow reading order items for active canteens"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
    )
  );

CREATE POLICY "Allow inserting order items"
  ON public.order_items FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
    )
  );

CREATE POLICY "Allow updating order items"
  ON public.order_items FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
    )
  );

CREATE POLICY "Allow deleting order items"
  ON public.order_items FOR DELETE
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
    )
  );

-- Khata Students RLS Policies
CREATE POLICY "Allow reading khata students for active canteens"
  ON public.khata_students FOR SELECT
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow inserting khata students"
  ON public.khata_students FOR INSERT
  WITH CHECK (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow updating khata students"
  ON public.khata_students FOR UPDATE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow deleting khata students"
  ON public.khata_students FOR DELETE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

-- Khata Entries RLS Policies
CREATE POLICY "Allow reading khata entries for active canteens"
  ON public.khata_entries FOR SELECT
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow inserting khata entries"
  ON public.khata_entries FOR INSERT
  WITH CHECK (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow updating khata entries"
  ON public.khata_entries FOR UPDATE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );

CREATE POLICY "Allow deleting khata entries"
  ON public.khata_entries FOR DELETE
  USING (
    canteen_id IN (SELECT id FROM public.canteens WHERE is_active = true)
  );
