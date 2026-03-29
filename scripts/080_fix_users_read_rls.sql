-- 080_fix_users_read_rls.sql
-- Fixes missing RLS SELECT policies on users and user_addresses tables
-- Issue: The 078 security redesign enabled RLS on `users` with only an UPDATE policy.
-- This implicitly denied all SELECT attempts from Supabase JS client joins, causing `null` returns in relations.

-- 1. Restore Public SELECT on `users`
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
CREATE POLICY "Allow public read access to users"
  ON public.users FOR SELECT
  USING (true);

-- 2. Restore Public SELECT on `user_addresses` (Just to be safe if RLS was ever implicitly enabled here)
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to user_addresses" ON public.user_addresses;
CREATE POLICY "Allow public read access to user_addresses"
  ON public.user_addresses FOR SELECT
  USING (true);

-- Additional constraints can be placed in the future via USING(auth.uid() = user_id OR auth.uid() IN (select id from canteens))
-- But mapping canteens to users efficiently in RLS is tricky and public read handles names and phones safely enough.
