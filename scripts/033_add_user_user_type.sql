-- 027_add_delivery_user_type.sql
-- Update auth_sessions table to support delivery user type

-- Drop existing check constraint on user_type
ALTER TABLE public.auth_sessions 
DROP CONSTRAINT IF EXISTS auth_sessions_user_type_check;

-- Add new check constraint that includes 'delivery' type
ALTER TABLE public.auth_sessions 
ADD CONSTRAINT auth_sessions_user_type_check 
CHECK (user_type IN ('super_admin', 'canteen', 'delivery','user'));