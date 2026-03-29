-- 039_link_canteens_to_categories.sql
-- Adds category_id to canteens table

ALTER TABLE public.canteens 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

CREATE INDEX IF NOT EXISTS idx_canteens_category_id ON public.canteens(category_id);

-- Optional: Update existing canteens to a default category if needed
DO $$
DECLARE
    default_cat_id UUID;
BEGIN
    SELECT id INTO default_cat_id FROM public.categories WHERE name = 'Cafe & Snacks' LIMIT 1;
    
    IF default_cat_id IS NOT NULL THEN
        UPDATE public.canteens 
        SET category_id = default_cat_id 
        WHERE category_id IS NULL;
    END IF;
END $$;
