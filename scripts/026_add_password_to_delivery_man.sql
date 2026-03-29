-- 026_add_password_to_delivery_man.sql
-- Add password_hash column to delivery_man table for authentication

-- Add password_hash column to delivery_man table
ALTER TABLE public.delivery_man 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create index for better query performance on phone (for login lookups)
CREATE INDEX IF NOT EXISTS idx_delivery_man_phone_active ON public.delivery_man(phone, is_active);

-- Note: password_hash is nullable to allow gradual migration
-- Set passwords for existing delivery men as needed
-- Example: UPDATE public.delivery_man SET password_hash = '$2a$10$...' WHERE phone = '1234567890';
