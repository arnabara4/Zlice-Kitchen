-- Availability and Verification Sync Updates
-- Added on 2026-03-29

BEGIN;

-- 1. Add quantity_left to menu_items
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS quantity_left integer DEFAULT 0;

-- 2. Update the decrement trigger to be atomic and use quantity_left
CREATE OR REPLACE FUNCTION decrement_menu_item_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement if max_quantity is set (limited item)
    -- We use GREATEST(0, ...) to ensure it never goes negative
    UPDATE public.menu_items
    SET quantity_left = GREATEST(0, quantity_left - NEW.quantity)
    WHERE id = NEW.menu_item_id 
    AND max_quantity IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-create the trigger to ensure it's up to date
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_menu_item_stock();

-- 4. Ensure is_verified column exists (it's in 100_verification_system.sql but let's be safe if it's new)
-- Actually 100_verification_system.sql added verification_status, let's ensure is_verified is also there or derived.
-- Looking at existing code, is_verified is often used.
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

COMMIT;

-- =========================================
-- ✅ MIGRATION COMPLETE: quantity_left and atomic trigger updated
-- =========================================
