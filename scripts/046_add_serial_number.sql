ALTER TABLE orders
ADD COLUMN serial_number INTEGER;

UPDATE orders
SET serial_number = 0
WHERE serial_number IS NULL;

ALTER TABLE orders
ALTER COLUMN serial_number SET NOT NULL;