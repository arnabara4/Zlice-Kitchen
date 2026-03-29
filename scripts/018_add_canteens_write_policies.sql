-- 018_add_canteens_write_policies.sql
-- Add INSERT, UPDATE, DELETE policies for canteens table

-- Allow inserting new canteens (for super admin adding canteens)
CREATE POLICY "Allow inserting canteens"
  ON public.canteens FOR INSERT
  WITH CHECK (true);

-- Allow updating canteens
CREATE POLICY "Allow updating canteens"
  ON public.canteens FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deleting canteens
CREATE POLICY "Allow deleting canteens"
  ON public.canteens FOR DELETE
  USING (true);

-- Note: In a production environment, you would want to restrict these policies
-- to only super admin users. For now, we allow all operations since authentication
-- is handled at the application level.
