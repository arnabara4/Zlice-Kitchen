-- Migration: Create user_push_subscriptions table for storing user device push subscriptions
-- This table stores push notification subscriptions for user devices in the PWA

-- Create user_push_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  endpoint_hash TEXT NOT NULL, -- SHA256 hash of endpoint URL for upsert uniqueness
  last_notified_status TEXT, -- Track last status notified to prevent duplicates
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint_hash)
);

-- Add index for efficient user subscription lookup
CREATE INDEX IF NOT EXISTS idx_user_push_subs_user_id ON public.user_push_subscriptions(user_id);

-- Add index for endpoint hash lookups (for deletion)
CREATE INDEX IF NOT EXISTS idx_user_push_subs_endpoint_hash ON public.user_push_subscriptions(endpoint_hash);

-- Enable RLS
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON public.user_push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

-- RLS policy: Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_push_subscriptions
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- RLS policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions"
  ON public.user_push_subscriptions
  FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- RLS policy: Service role can do everything (for backend notifications)
CREATE POLICY "Service role has full access"
  ON public.user_push_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_push_subscriptions_updated_at ON public.user_push_subscriptions;
CREATE TRIGGER trigger_update_user_push_subscriptions_updated_at
  BEFORE UPDATE ON public.user_push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_push_subscriptions_updated_at();

-- Grant permissions
GRANT ALL ON public.user_push_subscriptions TO authenticated;
GRANT ALL ON public.user_push_subscriptions TO service_role;
