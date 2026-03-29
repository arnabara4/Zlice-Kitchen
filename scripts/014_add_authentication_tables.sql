-- 014_add_authentication_tables.sql
-- Creates authentication tables for Super Admin and Canteen users

-- Create users table for super admins
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add session tracking
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('super_admin', 'canteen')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only allow authenticated access
CREATE POLICY "Only super admins can read super_admins"
  ON public.super_admins FOR SELECT
  USING (false); -- Will be handled by application logic

CREATE POLICY "Only authenticated can read sessions"
  ON public.auth_sessions FOR SELECT
  USING (false); -- Will be handled by application logic

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_super_admins_email ON public.super_admins(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON public.auth_sessions(token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON public.auth_sessions(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON public.auth_sessions(expires_at);

-- Insert default super admin (email: admin@canteen.com, password: admin123)
-- Hash for 'admin123': $2a$10$N9qo8uLOickgx2ZMRZoMye3jIMW9Qj3G5l7tJBqF3Z3U5DQZB3FY6
INSERT INTO public.super_admins (email, password_hash, name)
VALUES ('admin@canteen.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3jIMW9Qj3G5l7tJBqF3Z3U5DQZB3FY6', 'Super Admin')
ON CONFLICT (email) DO NOTHING;

-- Add updated_at trigger for super_admins
CREATE TRIGGER update_super_admins_updated_at 
BEFORE UPDATE ON public.super_admins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired sessions function
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.auth_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
