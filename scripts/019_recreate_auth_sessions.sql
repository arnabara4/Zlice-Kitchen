-- 019_recreate_auth_sessions.sql
-- Recreate auth_sessions table if it was deleted

-- Drop table if exists and recreate
DROP TABLE IF EXISTS public.auth_sessions CASCADE;

-- Create auth_sessions table
CREATE TABLE public.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('super_admin', 'canteen')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for auth_sessions
CREATE POLICY "Allow session creation"
  ON public.auth_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow session read"
  ON public.auth_sessions FOR SELECT
  USING (true);

CREATE POLICY "Allow session delete"
  ON public.auth_sessions FOR DELETE
  USING (true);

CREATE POLICY "Allow session update"
  ON public.auth_sessions FOR UPDATE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON public.auth_sessions(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON public.auth_sessions(expires_at);

-- Add comment
COMMENT ON TABLE public.auth_sessions IS 'Stores authentication sessions for super admins and canteen users';
