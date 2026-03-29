-- 061_create_canteen_payments_table.sql
-- Track payments made to/from canteens by admin

CREATE TABLE IF NOT EXISTS public.canteen_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Canteen reference
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  paid_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Payment method and reference
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'other')),
  transaction_reference TEXT, -- Transaction ID, cheque number, UPI reference, etc.
  
  -- Optional: link to orders this payment covers (comma-separated order IDs or period description)
  covered_period TEXT, -- e.g., "Week of Jan 15-21" or "Month of January 2026"
  
  -- Notes and remarks
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);
