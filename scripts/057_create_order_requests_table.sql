

-- Create order_requests table
CREATE TABLE IF NOT EXISTS public.order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information (matches orders table)
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Order details (matches orders table)
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  order_type TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  packaging_fee DECIMAL(10, 2) DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Delivery address reference (matches orders table)
  address_id UUID REFERENCES public.user_addresses(id) ON DELETE SET NULL,
  
  -- Payment information
  payment_method TEXT CHECK (payment_method IN ('cash', 'online', 'khata', 'prepaid_balance')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_transaction_id TEXT,
  
  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'expired', 'cancelled')),
  
 
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 minutes'), -- Auto-expire after 30 minutes
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create order_request_items table (similar to order_items)
CREATE TABLE IF NOT EXISTS public.order_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_request_id UUID NOT NULL REFERENCES public.order_requests(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);




-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_requests_user_id ON public.order_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_canteen_id ON public.order_requests(canteen_id);
CREATE INDEX IF NOT EXISTS idx_order_requests_status ON public.order_requests(status);
CREATE INDEX IF NOT EXISTS idx_order_requests_payment_status ON public.order_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_requests_created_at ON public.order_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_requests_expires_at ON public.order_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_order_requests_address_id ON public.order_requests(address_id);
CREATE INDEX IF NOT EXISTS idx_order_request_items_request_id ON public.order_request_items(order_request_id);







-- Optional: Create a function to clean up expired order requests
CREATE OR REPLACE FUNCTION cleanup_expired_order_requests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.order_requests
  WHERE status = 'pending' 
    AND payment_status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;


ALTER TABLE payments
DROP CONSTRAINT payments_order_id_fkey;

ALTER TABLE payments
DROP COLUMN order_id;

ALTER TABLE payments
ADD COLUMN order_request_id UUID,
ADD CONSTRAINT payments_order_request_id_fkey
FOREIGN KEY (order_request_id)
REFERENCES public.order_requests(id)
ON DELETE CASCADE;

