-- Create user_addresses table for storing multiple addresses per user

CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    label VARCHAR(50), -- e.g., 'Home', 'Work', 'Hostel', etc.
    phone VARCHAR(15),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_coordinates ON public.user_addresses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE public.user_addresses IS 'Stores multiple delivery addresses for users';
COMMENT ON COLUMN public.user_addresses.address IS 'User delivery address';
COMMENT ON COLUMN public.user_addresses.latitude IS 'Latitude coordinate for address location';
COMMENT ON COLUMN public.user_addresses.longitude IS 'Longitude coordinate for address location';
COMMENT ON COLUMN public.user_addresses.label IS 'Address label like Home, Work, Hostel, etc.';
COMMENT ON COLUMN public.user_addresses.phone IS 'Phone number associated with the address';




