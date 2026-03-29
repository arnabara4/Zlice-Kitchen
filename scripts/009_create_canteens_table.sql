-- 009_create_canteens_table.sql
-- Creates canteens table for multi-canteen support

-- Create canteens table
CREATE TABLE IF NOT EXISTS public.canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on canteens table
ALTER TABLE public.canteens ENABLE ROW LEVEL SECURITY;

-- RLS policies for canteens (anyone can read active canteens)
CREATE POLICY "Allow anyone to read active canteens"
  ON public.canteens FOR SELECT
  USING (is_active = true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_canteens_email ON public.canteens(email);
CREATE INDEX IF NOT EXISTS idx_canteens_is_active ON public.canteens(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_canteens_updated_at BEFORE UPDATE ON public.canteens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
