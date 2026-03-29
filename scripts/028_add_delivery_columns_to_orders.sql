-- 028_add_delivery_columns_to_orders.sql
-- Add delivery_man_id and delivery_status columns to orders table

-- Add delivery_man_id column with foreign key reference
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_man_id UUID REFERENCES public.delivery_man(id) ON DELETE SET NULL;

-- Add delivery_status column with constraint
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_status TEXT 
CHECK (delivery_status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_man_id ON public.orders(delivery_man_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);

-- Comment on columns for documentation
COMMENT ON COLUMN public.orders.delivery_man_id IS 'Reference to delivery person assigned to this order (optional)';
COMMENT ON COLUMN public.orders.delivery_status IS 'Current delivery status: assigned, picked_up, in_transit, delivered, cancelled (optional)';
