ALTER TABLE canteens
ADD COLUMN total_packaging_fee DECIMAL(10, 2) DEFAULT 10.00;
ALTER TABLE canteens
ADD COLUMN packaging_fee_per_item DECIMAL(10, 2) DEFAULT 2.00;
ALTER TABLE canteens
ADD COLUMN packaging_fee_type VARCHAR(10) DEFAULT 'fixed'