-- 1. Drop the existing restriction
ALTER TABLE orders
DROP CONSTRAINT orders_status_check;

-- 2. Add the new restriction with 'cancelled' included
ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status = ANY (ARRAY['not_started'::text, 'cooking'::text, 'ready'::text, 'completed'::text, 'cancelled'::text]));