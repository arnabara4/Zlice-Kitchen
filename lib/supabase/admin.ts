import { createClient } from "@supabase/supabase-js";

/**
 * Super Admin Supabase Client
 *
 * Uses the Service Role Key to bypass Row Level Security.
 * This client MUST NEVER be exposed to the frontend browser bundle.
 * Only use this within secure Next.js API Routes (/app/api/*) after
 * authenticating the user via cookies.
 *
 * SECURITY: Service Role Key MUST be set. No fallback to anon key.
 */
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "FATAL: SUPABASE_SERVICE_ROLE_KEY is not configured. This is required for secure API operations.",
  );
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
