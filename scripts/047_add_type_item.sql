-- Add item_type column
ALTER TABLE menu_items
ADD COLUMN item_type VARCHAR(10);

-- Populate existing rows with 'non-veg'
UPDATE menu_items
SET item_type = 'non-veg'
WHERE item_type IS NULL;

-- Set NOT NULL constraint
ALTER TABLE menu_items
ALTER COLUMN item_type SET NOT NULL;

-- Add CHECK constraint to allow only 'veg' or 'non-veg'
ALTER TABLE menu_items
ADD CONSTRAINT menu_items_item_type_check CHECK (item_type IN ('veg', 'non-veg')); 