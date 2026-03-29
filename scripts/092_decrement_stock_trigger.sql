BEGIN;

-- Function to decrement max_quantity from menu_items when an order_item is inserted
CREATE OR REPLACE FUNCTION decrement_menu_item_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.menu_items
    SET max_quantity = max_quantity - NEW.quantity
    WHERE id = NEW.menu_item_id AND max_quantity IS NOT NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after an order_item is created
DROP TRIGGER IF EXISTS trg_decrement_stock ON public.order_items;
CREATE TRIGGER trg_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_menu_item_stock();

COMMIT;

-- =========================================
-- ✅ MIGRATION COMPLETE: trg_decrement_stock added
-- =========================================
