-- Add address_slug foreign key reference to user_addresses table
-- This links user addresses to predefined addresses from the addresses table

ALTER TABLE public.user_addresses 
ADD COLUMN IF NOT EXISTS address_slug VARCHAR(100) 
REFERENCES public.addresses(address_slug) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_user_addresses_slug ON public.user_addresses(address_slug);

-- Add comment
COMMENT ON COLUMN public.user_addresses.address_slug IS 'Optional reference to predefined address from addresses table';
