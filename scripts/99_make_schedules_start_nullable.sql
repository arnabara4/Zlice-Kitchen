-- Migration: Make schedules.start_time nullable
ALTER TABLE public.schedules ALTER COLUMN start_time DROP NOT NULL;

-- Also ensure categories times are explicitly handled as nullable if they aren't already
ALTER TABLE public.categories ALTER COLUMN order_start_time DROP NOT NULL;
ALTER TABLE public.categories ALTER COLUMN order_cutoff_time DROP NOT NULL;

-- Confirming migration
COMMENT ON COLUMN public.schedules.start_time IS 'Opening of the ordering window. Null means immediate opening after previous cutoff.';
