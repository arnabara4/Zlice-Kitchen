BEGIN;

-- Add max_quantity field for limited item availability
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS max_quantity integer;

-- Update orders function or trigger logic isn't strictly needed here if we decrement in the API logic,
-- but adding the column is required.

COMMIT;

-- =========================================
-- ✅ MIGRATION COMPLETE: max_quantity added
-- =========================================
