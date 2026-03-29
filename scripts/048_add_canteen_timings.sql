-- Add opening and closing time columns to canteens table
ALTER TABLE canteens
ADD COLUMN opening_time TIME,
ADD COLUMN closing_time TIME;

-- Set default opening time to 8:00 AM
UPDATE canteens
SET opening_time = '04:00:00'
WHERE opening_time IS NULL;

-- Set default closing time to 10:00 PM
UPDATE canteens
SET closing_time = '23:59:00'
WHERE closing_time IS NULL;
