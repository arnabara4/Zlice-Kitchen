-- 082_fix_user_addresses_write_rls.sql
-- Fixes missing RLS INSERT/UPDATE/DELETE policies on user_addresses table
-- Issue: Script 080 enabled RLS with only a SELECT policy, implicitly denying users from adding/editing/deleting their addresses.

-- 1. Insert Policy
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.user_addresses;
CREATE POLICY "Users can insert their own addresses"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Update Policy
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.user_addresses;
CREATE POLICY "Users can update their own addresses"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Delete Policy
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.user_addresses;
CREATE POLICY "Users can delete their own addresses"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);
