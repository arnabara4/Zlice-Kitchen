ALTER TABLE orders
ADD COLUMN order_request_id UUID UNIQUE;

--foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT orders_order_request_id_fkey
FOREIGN KEY (order_request_id)
REFERENCES public.order_requests(id)
ON DELETE SET NULL;