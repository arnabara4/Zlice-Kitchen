-- Kitchen Partner Verification System Schema
-- Created on 2026-03-28

-- 1. Add verification fields to canteens table
ALTER TABLE public.canteens 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS verification_video_url TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS undertaking_accepted_at TIMESTAMPTZ;

-- 2. Add index for admin review performance
CREATE INDEX IF NOT EXISTS idx_canteens_verification_status ON public.canteens(verification_status);
