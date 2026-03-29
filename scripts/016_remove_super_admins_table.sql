-- 016_remove_super_admins_table.sql
-- Remove super_admins table since authentication is now handled via .env

-- Drop policies first
DROP POLICY IF EXISTS "Allow authentication queries for super_admins" ON public.super_admins;
DROP POLICY IF EXISTS "Allow super admin updates" ON public.super_admins;
DROP POLICY IF EXISTS "Only super admins can read super_admins" ON public.super_admins;

-- Drop the table
DROP TABLE IF EXISTS public.super_admins CASCADE;

-- Update auth_sessions to handle super admin without foreign key
-- (No changes needed since user_id is just a text field)

-- Note: Super admin credentials are now in .env:
-- SUPER_ADMIN_EMAIL=admin@canteen.com
-- SUPER_ADMIN_PASSWORD=admin123
