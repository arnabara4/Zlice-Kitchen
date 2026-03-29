-- 059_create_delivery_payments_table.sql
-- Simple table to track payments made to delivery men by admin

CREATE TABLE IF NOT EXISTS public.delivery_man_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Delivery man reference
  delivery_man_id UUID NOT NULL REFERENCES public.delivery_man(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Payment method and reference
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'other')),
  transaction_reference TEXT, -- Transaction ID, cheque number, UPI reference, etc.
  
  -- Optional: link to orders this payment covers (comma-separated order IDs or period description)
  covered_period TEXT, -- e.g., "Week of Jan 15-21" or "Orders #101, #102, #103"
  
  -- Notes and remarks
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_delivery_man_payments_delivery_man_id 
  ON public.delivery_man_payments(delivery_man_id);
  
CREATE INDEX IF NOT EXISTS idx_delivery_man_payments_paid_at 
  ON public.delivery_man_payments(paid_at DESC);
  