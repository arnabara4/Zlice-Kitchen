-- Add INSERT policy for menu_items to allow adding new items
CREATE POLICY "Allow anyone to insert menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policy for menu_items to allow editing items
CREATE POLICY "Allow anyone to update menu items"
  ON public.menu_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for menu_items to allow deleting items
CREATE POLICY "Allow anyone to delete menu items"
  ON public.menu_items FOR DELETE
  USING (true);

-- Add INSERT policy for orders to allow creating new orders
CREATE POLICY "Allow anyone to insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policy for orders to allow updating order status
CREATE POLICY "Allow anyone to update orders"
  ON public.orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add INSERT policy for order_items
CREATE POLICY "Allow anyone to insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);
