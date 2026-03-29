
ALTER TABLE public.orders
DROP COLUMN IF EXISTS otp_hash;

CREATE TABLE IF NOT EXISTS public.otp_codes
(
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() + INTERVAL '1 day') NOT NULL,
    CONSTRAINT uq_otp_order_id UNIQUE (order_id)
);

-- Index for fast lookup during OTP verification and expiry checks
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_codes(expires_at);

-- Index for cleanup queries (finding expired OTPs)
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON public.otp_codes(created_at);