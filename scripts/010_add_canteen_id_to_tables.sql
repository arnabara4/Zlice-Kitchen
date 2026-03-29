-- 010_add_canteen_id_to_tables.sql
-- Adds canteen_id foreign key to existing tables for multi-canteen support

-- Add canteen_id to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;

-- Add canteen_id to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;

-- Add canteen_id to khata_students
ALTER TABLE public.khata_students 
ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;

-- Add canteen_id to khata_entries (for direct access without join)
ALTER TABLE public.khata_entries 
ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_canteen_id ON public.menu_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id ON public.orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_khata_students_canteen_id ON public.khata_students(canteen_id);
CREATE INDEX IF NOT EXISTS idx_khata_entries_canteen_id ON public.khata_entries(canteen_id);

-- Update unique constraint for menu_items to be per canteen
ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_menu_items_name_canteen_unique 
ON public.menu_items(name, canteen_id);

-- Update unique constraint for khata_students roll_number to be per canteen
ALTER TABLE public.khata_students DROP CONSTRAINT IF EXISTS khata_students_roll_number_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_khata_students_roll_canteen_unique 
ON public.khata_students(roll_number, canteen_id);
