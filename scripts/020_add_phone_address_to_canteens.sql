-- 020_add_phone_address_to_canteens.sql
-- Add phone and address columns to canteens table

ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add some comments for documentation
COMMENT ON COLUMN public.canteens.phone IS 'Contact phone number for the canteen';
COMMENT ON COLUMN public.canteens.address IS 'Physical address of the canteen';

-- Update existing canteen with example data (optional - can be removed)
UPDATE public.canteens 
SET 
  phone = '9593450555',
  address = 'NEHRU HALL OF RESIDENCE, IIT KHARAGPUR'
WHERE email = 'ashim@canteen.com' AND phone IS NULL;
