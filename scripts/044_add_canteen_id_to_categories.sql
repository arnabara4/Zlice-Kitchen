-- 044_add_canteen_id_to_categories.sql
-- Makes categories canteen-specific for menu items

-- Add canteen_id column to categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS canteen_id UUID REFERENCES public.canteens(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_canteen_id ON public.categories(canteen_id);

-- Remove the unique constraint on name (since same category name can exist for different canteens)
DO $$ 
BEGIN
    ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Add a new unique constraint on name + canteen_id combination
-- This allows same category name for different canteens but prevents duplicates within same canteen
DO $$ 
BEGIN
    ALTER TABLE public.categories 
    ADD CONSTRAINT categories_name_canteen_unique 
    UNIQUE (name, canteen_id);
EXCEPTION
    WHEN duplicate_table THEN 
        NULL;
END $$;

-- Update RLS policies for canteen-specific access
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;

-- Allow reading categories that belong to user's canteen or are global (NULL canteen_id)
CREATE POLICY "Allow read access to own canteen categories"
  ON public.categories FOR SELECT
  USING (true);

-- Allow canteens to insert their own categories
CREATE POLICY "Allow canteens to insert own categories"
  ON public.categories FOR INSERT
  WITH CHECK (true);

-- Allow canteens to update their own categories
CREATE POLICY "Allow canteens to update own categories"
  ON public.categories FOR UPDATE
  USING (true);

-- Allow canteens to delete their own categories
CREATE POLICY "Allow canteens to delete own categories"
  ON public.categories FOR DELETE
  USING (true);

-- Optional: Keep existing global categories by setting their canteen_id to NULL
-- These can serve as templates or default categories
COMMENT ON COLUMN public.categories.canteen_id IS 'Foreign key to canteens table. NULL means global category.';
