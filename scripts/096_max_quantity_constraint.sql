BEGIN;

-- Add CHECK constraint to ensure max_quantity never drops below 0
ALTER TABLE public.menu_items
ADD CONSTRAINT max_quantity_check CHECK (max_quantity >= 0);

COMMIT;

-- =========================================
-- ✅ MIGRATION COMPLETE: max_quantity >= 0 constraint added
-- =========================================
