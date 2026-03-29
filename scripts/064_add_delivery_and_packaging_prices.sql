-- 064_add_delivery_and_packaging_prices.sql
-- Add separate delivery and packaging prices to orders
-- Pattern: price (customer pays) vs canteen_price (canteen receives)
-- Similarly: delivery_fee (customer pays) vs delivery_partner_amount (partner receives)
--           packaging_fee (customer pays) vs packaging_amount (actual cost)

-- ---------------------------------------------------------
-- 1. Update 'orders' table
-- ---------------------------------------------------------

-- Step A: Add the columns for delivery and packaging amounts
-- These represent what actually gets paid to delivery partners and packaging costs
-- (may differ from what customer pays due to commissions, margins, etc.)
ALTER TABLE orders
ADD COLUMN delivery_partner_amount DECIMAL(10, 2),
ADD COLUMN packaging_amount DECIMAL(10, 2);

-- Step B: Backfill with existing delivery_fee and packaging_fee values
-- Initially set them equal (can be adjusted later by admin/business logic)
UPDATE orders
SET 
  delivery_partner_amount = COALESCE(delivery_fee, 0),
  packaging_amount = COALESCE(packaging_fee, 0);

-- ---------------------------------------------------------
-- 2. Update 'order_requests' table
-- ---------------------------------------------------------

-- Step A: Add the columns
ALTER TABLE order_requests
ADD COLUMN delivery_partner_amount DECIMAL(10, 2),
ADD COLUMN packaging_amount DECIMAL(10, 2);

-- Step B: Backfill with existing data
UPDATE order_requests
SET 
  delivery_partner_amount = COALESCE(delivery_fee, 0),
  packaging_amount = COALESCE(packaging_fee, 0);

-- ---------------------------------------------------------
-- 3. Set NOT NULL constraints after backfilling
-- ---------------------------------------------------------

-- Set NOT NULL for orders table
ALTER TABLE orders
ALTER COLUMN delivery_partner_amount SET NOT NULL,
ALTER COLUMN packaging_amount SET NOT NULL;

-- Set NOT NULL for order_requests table
ALTER TABLE order_requests
ALTER COLUMN delivery_partner_amount SET NOT NULL,
ALTER COLUMN packaging_amount SET NOT NULL;

-- ---------------------------------------------------------
-- 4. Set default values to 0 for future inserts
-- ---------------------------------------------------------

-- Set defaults for orders table
ALTER TABLE orders
ALTER COLUMN delivery_partner_amount SET DEFAULT 0,
ALTER COLUMN packaging_amount SET DEFAULT 0;

-- Set defaults for order_requests table
ALTER TABLE order_requests
ALTER COLUMN delivery_partner_amount SET DEFAULT 0,
ALTER COLUMN packaging_amount SET DEFAULT 0;

-- ---------------------------------------------------------
-- 5. Add comments for clarity
-- ---------------------------------------------------------

-- Orders table comments
-- COMMENT ON COLUMN orders.delivery_fee IS 'Delivery fee charged to customer';
-- COMMENT ON COLUMN orders.packaging_fee IS 'Packaging fee charged to customer';
-- COMMENT ON COLUMN orders.delivery_partner_amount IS 'Amount paid to delivery partner (may differ from delivery_fee due to commission/margin)';
-- COMMENT ON COLUMN orders.packaging_amount IS 'Actual packaging cost allocated (may differ from packaging_fee charged to customer)';

-- -- Order requests table comments
-- COMMENT ON COLUMN order_requests.delivery_fee IS 'Delivery fee charged to customer';
-- COMMENT ON COLUMN order_requests.packaging_fee IS 'Packaging fee charged to customer';
-- COMMENT ON COLUMN order_requests.delivery_partner_amount IS 'Amount paid to delivery partner (may differ from delivery_fee due to commission/margin)';
-- COMMENT ON COLUMN order_requests.packaging_amount IS 'Actual packaging cost allocated (may differ from packaging_fee charged to customer)';

-- ---------------------------------------------------------
-- 6. Create indexes for better query performance
-- ---------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_amount 
  ON orders(delivery_partner_amount);
  
CREATE INDEX IF NOT EXISTS idx_orders_packaging_amount 
  ON orders(packaging_amount);

CREATE INDEX IF NOT EXISTS idx_order_requests_delivery_partner_amount 
  ON order_requests(delivery_partner_amount);
  
CREATE INDEX IF NOT EXISTS idx_order_requests_packaging_amount 
  ON order_requests(packaging_amount);

