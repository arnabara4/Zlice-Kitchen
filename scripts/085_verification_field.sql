-- Add is_verified field
ALTER TABLE public.canteens ADD COLUMN is_verified boolean DEFAULT false;

-- Update existing canteens to be verified
UPDATE public.canteens SET is_verified = true;