ALTER TABLE orders
ADD COLUMN address_id UUID REFERENCES public.user_addresses(id) ON DELETE SET NULL;

ALTER TABLE orders
ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0;