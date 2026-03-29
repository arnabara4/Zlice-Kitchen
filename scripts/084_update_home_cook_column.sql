-- 084_update_home_cook_column.sql
-- Changes the `home_cook` column in public.canteens from boolean to a text column
-- allowed values: 'on-demand', 'scheduling', 'both', or NULL.

BEGIN;

-- 1. Rename the old boolean column so we can migrate data
ALTER TABLE public.canteens RENAME COLUMN home_cook TO home_cook_old;

-- 2. Create the new text column with the CHECK constraint
ALTER TABLE public.canteens
ADD COLUMN home_cook text CHECK (home_cook IN ('on-demand', 'scheduling', 'both'));

-- 3. Migrate existing data
-- Set previously true values to 'both' as a default for existing home kitchens
UPDATE public.canteens
SET home_cook = 'both'
WHERE home_cook_old = true;

-- The canteens where home_cook_old was false will simply be NULL now

-- 4. Drop the old boolean column
ALTER TABLE public.canteens DROP COLUMN home_cook_old;

COMMIT;
