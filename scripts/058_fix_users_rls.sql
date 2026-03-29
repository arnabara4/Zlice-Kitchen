-- 058_fix_users_rls.sql
-- Fix RLS for users table to allow reading user data in orders

-- Disable RLS if it's enabled
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS but allow reading for orders, enable it and add a policy
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow reading users for orders and public access"
--   ON public.users FOR SELECT
--   USING (true);

-- Add comment
COMMENT ON TABLE public.users IS 'User accounts table with RLS disabled for public read access';
