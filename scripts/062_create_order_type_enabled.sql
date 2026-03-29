ALTER table canteens
ADD column is_delivery_enabled BOOLEAN DEFAULT FALSE;

ALTER table canteens
ADD column is_takeaway_enabled BOOLEAN DEFAULT FALSE;

ALTER table canteens
ADD column is_dine_in_enabled BOOLEAN DEFAULT FALSE;