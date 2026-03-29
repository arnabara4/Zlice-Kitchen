-- Add latitude and longitude columns to canteens table

-- Add coordinates columns (latitude and longitude)
ALTER TABLE public.canteens 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index on coordinates for efficient location-based queries
CREATE INDEX IF NOT EXISTS idx_canteens_coordinates 
ON public.canteens(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.canteens.latitude IS 'Latitude coordinate for canteen location';
COMMENT ON COLUMN public.canteens.longitude IS 'Longitude coordinate for canteen location';
