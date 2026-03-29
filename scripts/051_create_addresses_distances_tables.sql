-- Create addresses and distances tables for hardcoded location-based distance management

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_slug VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    name TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Create distances table
CREATE TABLE IF NOT EXISTS public.distances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address_slug_1 VARCHAR(100) NOT NULL REFERENCES public.addresses(address_slug) ON DELETE CASCADE,
    address_slug_2 VARCHAR(100) NOT NULL REFERENCES public.addresses(address_slug) ON DELETE CASCADE,
    distance_meters DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_address_pair UNIQUE (address_slug_1, address_slug_2),
    CONSTRAINT different_addresses CHECK (address_slug_1 != address_slug_2),
    CONSTRAINT ordered_addresses CHECK (address_slug_1 < address_slug_2)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_addresses_slug ON public.addresses(address_slug);
CREATE INDEX IF NOT EXISTS idx_addresses_coordinates ON public.addresses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_distances_slug1 ON public.distances(address_slug_1);
CREATE INDEX IF NOT EXISTS idx_distances_slug2 ON public.distances(address_slug_2);
CREATE INDEX IF NOT EXISTS idx_distances_both_slugs ON public.distances(address_slug_1, address_slug_2);


