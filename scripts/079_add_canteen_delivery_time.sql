-- Migration 079: Add delivery_time to canteens table

BEGIN;

-- Add delivery_time column to canteens table
ALTER TABLE canteens
ADD COLUMN IF NOT EXISTS delivery_time TEXT DEFAULT '20-25 min';

COMMIT;
