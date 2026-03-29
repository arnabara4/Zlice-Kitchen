-- 052_add_dashboard_index.sql
-- Adds composite index for the "Orders Dashboard" query to eliminate Bitmap Scans
-- Query Pattern: WHERE canteen_id = ? AND status IN (...) ORDER BY created_at DESC

-- Composite Index for Orders Dashboard
CREATE INDEX IF NOT EXISTS idx_orders_dashboard_composite
ON public.orders(canteen_id, status, created_at DESC);

-- Composite Index for "My Orders" (Delivery Man)
-- Query Pattern: WHERE delivery_man_id = ? AND delivery_status != 'delivered'
CREATE INDEX IF NOT EXISTS idx_orders_delivery_active
ON public.orders(delivery_man_id, delivery_status)
WHERE delivery_status != 'delivered';
