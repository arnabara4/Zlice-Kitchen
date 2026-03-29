-- Migration 083: Add dynamic increment_percentage and is_fitness to canteens
-- 
-- increment_percentage: The price markup percentage applied to menu item base prices.
--   Defaults to 5.00 (5%) for all existing and new canteens unless explicitly changed by a superadmin.
--
-- is_fitness: Boolean flag to classify a canteen as a fitness canteen.
--   Defaults to false.

ALTER TABLE canteens 
  ADD COLUMN IF NOT EXISTS increment_percentage NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS is_fitness BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN canteens.increment_percentage IS 'Price markup percentage applied to menu items before showing to users. Default is 5%.';
COMMENT ON COLUMN canteens.is_fitness IS 'Whether this canteen is classified as a fitness canteen.';
