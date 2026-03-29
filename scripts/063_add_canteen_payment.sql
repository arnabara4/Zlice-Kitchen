-- ---------------------------------------------------------
-- 1. Update 'orders' table
-- ---------------------------------------------------------

-- Step A: Add the columns (initialize canteen_amount as NULL or 0 first)
ALTER TABLE orders
ADD COLUMN canteen_amount DECIMAL(10, 2),
ADD COLUMN is_gst_enabled BOOLEAN DEFAULT FALSE;

-- Step B: Backfill 'canteen_amount' with values from 'total_amount'
UPDATE orders
SET canteen_amount = total_amount;

-- ---------------------------------------------------------
-- 2. Update 'order_requests' table
-- ---------------------------------------------------------

-- Step A: Add the columns
ALTER TABLE order_requests
ADD COLUMN canteen_amount DECIMAL(10, 2),
ADD COLUMN is_gst_enabled BOOLEAN DEFAULT FALSE;

-- Step B: Backfill 'canteen_amount' with values from 'total_amount'
UPDATE order_requests
SET canteen_amount = total_amount;


ALTER TABLE order_request_items
ADD COLUMN canteen_price DECIMAL(10, 2);


ALTER TABLE order_items
ADD COLUMN canteen_price DECIMAL(10, 2);

UPDATE order_request_items
SET canteen_price = price;

UPDATE order_items
SET canteen_price = price;

-- ---------------------------------------------------------
-- 3. Set NOT NULL constraints after backfilling
-- ---------------------------------------------------------

-- Set NOT NULL for orders table
ALTER TABLE orders
ALTER COLUMN canteen_amount SET NOT NULL,
ALTER COLUMN is_gst_enabled SET NOT NULL;

-- Set NOT NULL for order_requests table
ALTER TABLE order_requests
ALTER COLUMN canteen_amount SET NOT NULL,
ALTER COLUMN is_gst_enabled SET NOT NULL;

-- Set NOT NULL for order_items table
ALTER TABLE order_items
ALTER COLUMN canteen_price SET NOT NULL;

-- Set NOT NULL for order_request_items table
ALTER TABLE order_request_items
ALTER COLUMN canteen_price SET NOT NULL;
