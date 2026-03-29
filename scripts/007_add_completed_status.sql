-- 007_add_completed_status.sql
-- Add 'completed' status to orders table for taken away orders

-- Drop the existing check constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new check constraint with 'completed' status
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('not_started', 'cooking', 'ready', 'completed'));

-- Update any existing 'taken_away' status to 'completed' (if any)
UPDATE public.orders 
SET status = 'completed' 
WHERE status = 'taken_away';
