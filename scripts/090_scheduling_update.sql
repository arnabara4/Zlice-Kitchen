BEGIN;

ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS order_start_time time,
ADD COLUMN IF NOT EXISTS order_cutoff_time time;

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS order_start_time time,
ADD COLUMN IF NOT EXISTS order_cutoff_time time,
ADD COLUMN IF NOT EXISTS supports_scheduled boolean DEFAULT true;

-- =========================================
-- 3. ADD ORDER MODE + SCHEDULING FIELDS (ORDERS)
-- =========================================
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_mode text DEFAULT 'instant',
ADD COLUMN IF NOT EXISTS scheduled_date date,
ADD COLUMN IF NOT EXISTS scheduled_category_id uuid;

-- Add FK safely
DO $$
BEGIN
IF NOT EXISTS (
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'orders_scheduled_category_fkey'
) THEN
ALTER TABLE public.orders
ADD CONSTRAINT orders_scheduled_category_fkey
FOREIGN KEY (scheduled_category_id)
REFERENCES public.categories(id);
END IF;
END$$;

-- =========================================
-- 4. ADD ORDER MODE + SCHEDULING FIELDS (ORDER REQUESTS)
-- =========================================
ALTER TABLE public.order_requests
ADD COLUMN IF NOT EXISTS order_mode text DEFAULT 'instant',
ADD COLUMN IF NOT EXISTS scheduled_date date,
ADD COLUMN IF NOT EXISTS scheduled_category_id uuid;

-- Add FK safely
DO $$
BEGIN
IF NOT EXISTS (
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'order_requests_scheduled_category_fkey'
) THEN
ALTER TABLE public.order_requests
ADD CONSTRAINT order_requests_scheduled_category_fkey
FOREIGN KEY (scheduled_category_id)
REFERENCES public.categories(id);
END IF;
END$$;

-- =========================================
-- 5. BACKFILL EXISTING DATA
-- =========================================
UPDATE public.orders
SET order_mode = 'instant'
WHERE order_mode IS NULL;

UPDATE public.order_requests
SET order_mode = 'instant'
WHERE order_mode IS NULL;

-- =========================================
-- 6. ENFORCE NOT NULL + DEFAULTS
-- =========================================
ALTER TABLE public.orders
ALTER COLUMN order_mode SET DEFAULT 'instant',
ALTER COLUMN order_mode SET NOT NULL;

ALTER TABLE public.order_requests
ALTER COLUMN order_mode SET DEFAULT 'instant',
ALTER COLUMN order_mode SET NOT NULL;

-- =========================================
-- 7. ADD CONSISTENCY CONSTRAINTS
-- =========================================

-- Orders constraint
DO $$
BEGIN
IF NOT EXISTS (
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'orders_mode_consistency'
) THEN
ALTER TABLE public.orders
ADD CONSTRAINT orders_mode_consistency CHECK (
(order_mode = 'instant' AND scheduled_date IS NULL AND scheduled_category_id IS NULL)
OR
(order_mode = 'scheduled' AND scheduled_date IS NOT NULL AND scheduled_category_id IS NOT NULL)
);
END IF;
END$$;

-- Order Requests constraint
DO $$
BEGIN
IF NOT EXISTS (
SELECT 1 FROM information_schema.table_constraints
WHERE constraint_name = 'order_requests_mode_consistency'
) THEN
ALTER TABLE public.order_requests
ADD CONSTRAINT order_requests_mode_consistency CHECK (
(order_mode = 'instant' AND scheduled_date IS NULL AND scheduled_category_id IS NULL)
OR
(order_mode = 'scheduled' AND scheduled_date IS NOT NULL AND scheduled_category_id IS NOT NULL)
);
END IF;
END$$;

-- =========================================
-- 8. ADD PERFORMANCE INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date
ON public.orders (scheduled_date);

CREATE INDEX IF NOT EXISTS idx_orders_mode_date
ON public.orders (order_mode, scheduled_date);

CREATE INDEX IF NOT EXISTS idx_order_requests_scheduled_date
ON public.order_requests (scheduled_date);

CREATE INDEX IF NOT EXISTS idx_categories_cutoff
ON public.categories (order_cutoff_time);

-- =========================================
-- 9. OPTIONAL: KITCHEN CAPABILITY FLAGS
-- =========================================
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS supports_instant_orders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS supports_scheduled_orders boolean DEFAULT false;

COMMIT;

-- =========================================
-- ✅ MIGRATION COMPLETE
-- =========================================
