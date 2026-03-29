-- Add order_type column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type TEXT;

-- Optional: Add a comment to describe the column
COMMENT ON COLUMN orders.order_type IS 'Type of order (e.g., dine-in, takeaway, delivery)';
