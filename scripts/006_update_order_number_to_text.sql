-- 006_update_order_number_to_text.sql
-- Migrate order_number from INTEGER to TEXT (alphanumeric)

-- Step 1: Add a temporary column for the new order_number
ALTER TABLE public.orders ADD COLUMN order_number_new TEXT;

-- Step 2: Convert existing order numbers to text with leading zeros
UPDATE public.orders 
SET order_number_new = LPAD(order_number::TEXT, 4, '0');

-- Step 3: Drop the old column
ALTER TABLE public.orders DROP COLUMN order_number;

-- Step 4: Rename the new column
ALTER TABLE public.orders RENAME COLUMN order_number_new TO order_number;

-- Step 5: Add NOT NULL and UNIQUE constraints
ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE public.orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Step 6: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
