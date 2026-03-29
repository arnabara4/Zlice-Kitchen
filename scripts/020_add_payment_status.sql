-- 020_add_payment_status.sql
-- Add payment_status field to orders table

-- Add payment_status column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid' 
CHECK (payment_status IN ('paid', 'unpaid'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Update existing orders to have paid status by default (if needed)
-- Uncomment the line below if you want existing orders to be marked as paid
-- UPDATE public.orders SET payment_status = 'paid' WHERE payment_status IS NULL;
