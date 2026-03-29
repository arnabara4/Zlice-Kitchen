-- Add DELETE policy for orders to allow deleting orders
CREATE POLICY "Allow anyone to delete orders"
  ON public.orders FOR DELETE
  USING (true);

-- Add DELETE policy for order_items to allow deleting order items
CREATE POLICY "Allow anyone to delete order items"
  ON public.order_items FOR DELETE
  USING (true);
