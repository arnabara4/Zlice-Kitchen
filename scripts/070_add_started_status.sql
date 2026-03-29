-- 1. Drop the existing restriction
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_status_check;

-- 2. Add the new restriction with 'started' included
-- Current valid statuses: 'not_started', 'started', 'cooking', 'ready', 'completed', 'cancelled'
ALTER TABLE orders
ADD CONSTRAINT orders_status_check
CHECK (status = ANY (ARRAY['not_started'::text, 'started'::text, 'cooking'::text, 'ready'::text, 'completed'::text, 'cancelled'::text]));
