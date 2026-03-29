-- Step 1: Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    paid_by_admin UUID
);

-- Step 2: Add essential indexing to support heavy queries
CREATE INDEX IF NOT EXISTS idx_transactions_canteen_id ON public.transactions(canteen_id);
CREATE INDEX IF NOT EXISTS idx_transactions_requested_at ON public.transactions(requested_at);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id_is_settled_created_at ON public.orders(canteen_id, is_settled, created_at);

-- Step 3: Atomic Stored Procedure for Processing Settlements safely
CREATE OR REPLACE FUNCTION public.process_transaction_settlement(
    p_transaction_id UUID,
    p_admin_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    settled_count INTEGER,
    settled_amount NUMERIC
) AS $$
DECLARE
    v_transaction RECORD;
    v_settled_count INTEGER;
    v_settled_amount NUMERIC;
BEGIN
    -- 1. Fetch transaction and lock the row to prevent concurrent evaluations
    SELECT * INTO v_transaction
    FROM public.transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

    -- If transaction not found
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Transaction not found.'::TEXT, 0, 0::NUMERIC;
        RETURN;
    END IF;

    -- 2. Verify it has not been paid
    IF v_transaction.paid = TRUE THEN
        RETURN QUERY SELECT FALSE, 'Transaction already processed.'::TEXT, 0, 0::NUMERIC;
        RETURN;
    END IF;

    -- 3. Calculate exactly what we are about to settle (purely for returning the math to the edge client)
    SELECT COUNT(*), COALESCE(SUM(canteen_amount), 0) INTO v_settled_count, v_settled_amount
    FROM public.orders
    WHERE canteen_id = v_transaction.canteen_id
      AND is_settled = FALSE
      AND created_at <= v_transaction.requested_at;

    IF v_settled_count = 0 THEN
        -- Mark transaction as paid regardless if there were ghost orders that had already been settled separately by an older flow
        UPDATE public.transactions
        SET paid = TRUE,
            paid_at = NOW(),
            paid_by_admin = p_admin_id
        WHERE id = p_transaction_id;
        
        RETURN QUERY SELECT TRUE, 'Transaction processed, but no pending orders met the requested_at threshold.'::TEXT, 0, 0::NUMERIC;
        RETURN;
    END IF;

    -- 4. Execute atomic settlement update on orders
    UPDATE public.orders
    SET is_settled = TRUE,
        updated_at = NOW()
    WHERE canteen_id = v_transaction.canteen_id
      AND is_settled = FALSE
      AND created_at <= v_transaction.requested_at;

    -- 5. Mark transaction paid
    UPDATE public.transactions
    SET paid = TRUE,
        paid_at = NOW(),
        paid_by_admin = p_admin_id
    WHERE id = p_transaction_id;

    -- 6. Done. Commit will happen automatically when exiting the function.
    RETURN QUERY SELECT TRUE, 'Successfully deposited ' || v_settled_amount::TEXT || ' across ' || v_settled_count::TEXT || ' orders.', v_settled_count, v_settled_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: RLS Configuration
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on transactions" 
ON public.transactions FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on transactions" 
ON public.transactions FOR UPDATE
USING (true);
