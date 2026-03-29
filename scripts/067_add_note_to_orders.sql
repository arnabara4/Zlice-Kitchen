ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS note TEXT;

COMMENT ON COLUMN public.orders.note IS 'Optional note/instruction for the order from the customer';

ALTER TABLE public.order_requests
ADD COLUMN IF NOT EXISTS note TEXT;

COMMENT ON COLUMN public.order_requests.note IS 'Optional note/instruction for the order request from the customer';
