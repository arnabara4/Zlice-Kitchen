-- 015_fix_authentication_rls.sql
-- Update RLS policies to allow authentication queries

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Only super admins can read super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Only authenticated can read sessions" ON public.auth_sessions;

-- Super Admins: Allow read for authentication (password verification happens in app)
CREATE POLICY "Allow authentication queries for super_admins"
  ON public.super_admins FOR SELECT
  USING (true);

CREATE POLICY "Allow super admin updates"
  ON public.super_admins FOR UPDATE
  USING (true);

-- Auth Sessions: Allow all operations for session management
CREATE POLICY "Allow session creation"
  ON public.auth_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow session read"
  ON public.auth_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow session delete"
  ON public.auth_sessions FOR DELETE
  USING (true);

-- Update canteens RLS for authentication
-- Drop and recreate read policy to allow authentication
DROP POLICY IF EXISTS "Allow reading menu items for active canteens" ON public.canteens;

CREATE POLICY "Allow reading active canteens"
  ON public.canteens FOR SELECT
  USING (is_active = true);
