BEGIN;

-- Relax the order_requests mode consistency constraint to allow scheduled orders without a specific category ID
-- This is necessary for Home Cook meals which are date-based but not slot-based.

ALTER TABLE public.order_requests 
DROP CONSTRAINT IF EXISTS order_requests_mode_consistency;

ALTER TABLE public.order_requests
ADD CONSTRAINT order_requests_mode_consistency CHECK (
  (order_mode = 'instant' AND scheduled_date IS NULL AND scheduled_category_id IS NULL)
  OR
  (order_mode = 'scheduled' AND scheduled_date IS NOT NULL)
);

-- Do the same for the main orders table if it exists
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_mode_consistency;

ALTER TABLE public.orders
ADD CONSTRAINT orders_mode_consistency CHECK (
  (order_mode = 'instant' AND scheduled_date IS NULL AND scheduled_category_id IS NULL)
  OR
  (order_mode = 'scheduled' AND scheduled_date IS NOT NULL)
);

COMMIT;

-- =========================================
-- ✅ MIGRATION COMPLETE: Schema relaxation for Home Cook meals
-- =========================================
