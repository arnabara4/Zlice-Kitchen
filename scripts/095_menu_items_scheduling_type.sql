-- Migration to alter menu_items.supports_scheduled from boolean to text ('on-demand', 'scheduling', 'both')

-- 1. Add new text column
ALTER TABLE menu_items ADD COLUMN scheduling_type text DEFAULT 'both';

-- 2. Migrate existing data
-- If it was true, let's assume it supports both for backward compatibility (or 'scheduling' if you strictly want).
-- The requirement stated: "if it is true then it will be both, else on-demand" (implied based on original logic where true meant schedulable).
UPDATE menu_items 
SET scheduling_type = CASE 
  WHEN supports_scheduled = true THEN 'both' 
  ELSE 'on-demand' 
END;

-- 3. Drop the old boolean column
ALTER TABLE menu_items DROP COLUMN supports_scheduled;

-- 4. Rename the new text column to match the original name
ALTER TABLE menu_items RENAME COLUMN scheduling_type TO supports_scheduled;
