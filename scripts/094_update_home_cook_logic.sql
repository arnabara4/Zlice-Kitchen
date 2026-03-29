-- Migration to add `is_scheduling` boolean field

-- Add the new boolean field to control scheduling independently
ALTER TABLE canteens ADD COLUMN IF NOT EXISTS is_scheduling boolean DEFAULT false;
