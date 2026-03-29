-- ==========================================
-- add_combo_fields_to_menu_items.sql
-- ==========================================

-- Migration: Add combo-related fields to menu_items
-- Run this in Supabase SQL editor



ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS free_delivery_item boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS strikethrough_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

COMMENT ON COLUMN public.menu_items.free_delivery_item IS
  'If true, any order containing this item will have delivery fee set to 0. Used for Combo Below 149 items.';

COMMENT ON COLUMN public.menu_items.strikethrough_value IS
  'Original/MRP price shown with strikethrough to highlight savings. Used for Combo Below 149 items.';


-- ==========================================
-- secure_architecture_redesign.sql
-- ==========================================

-- =========================================================================
-- SECURE ARCHITECTURE REDESIGN MIGRATION
-- Translates the Zero-Trust Architecture Blueprint into Postgres constraints
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. Idempotency Table (For Webhooks & Event Processing)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processed_events (
    id TEXT PRIMARY KEY,       -- E.g., Webhook signature, Cashfree Payment ID
    source TEXT NOT NULL,      -- E.g., 'CASHFREE_WEBHOOK'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- 2. Append-Only Aura Ledger
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS aura_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INT NOT NULL, 
    type TEXT NOT NULL CHECK (type IN ('EARN_ORDER', 'SPEND_COUPON', 'REFUND', 'ADMIN_ADJUSTMENT')),
    reference_id TEXT NOT NULL, -- e.g., 'ORDER_123', 'COUPON_456'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Strict Idempotency: A single reference + type can only occur once
    CONSTRAINT uq_aura_reference UNIQUE (reference_id, type)
);

CREATE INDEX IF NOT EXISTS idx_aura_ledger_user ON aura_ledger(user_id);

-- -------------------------------------------------------------------------
-- 3. Hardening the Orders Table
-- -------------------------------------------------------------------------
-- Enforce that an order request can only ever spawn ONE actual order
ALTER TABLE orders 
ADD CONSTRAINT uq_orders_order_request UNIQUE (order_request_id);

-- Prevent mathematically impossible financial states
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_total_amount_positive CHECK (total_amount >= 0);

-- Require valid statuses
-- First, drop the old inline constraint if it exists (from 020_add_payment_status.sql)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Second, sanitize existing legacy data to avoid constraint violations
UPDATE orders SET payment_status = 'paid' WHERE payment_status IN ('success', 'completed');
UPDATE orders SET payment_status = 'pending' WHERE payment_status IN ('unpaid', '') OR payment_status IS NULL;

-- IMPORTANT: POS (v0-canteen-management-tool) heavily expects these payment_status values.
-- Any future addition or removal of these string literals must be synced with the POS codebase's PaymentStatus type.
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);

-- -------------------------------------------------------------------------
-- 4. Atomic RPC Functions for Safe Mutations
-- -------------------------------------------------------------------------
-- Function to strictly increment/decrement Aura points atomically, 
-- bypassing read-modify-write race conditions in the application layer.
CREATE OR REPLACE FUNCTION process_aura_transaction(
    p_user_id UUID,
    p_amount INT,
    p_type TEXT,
    p_reference_id TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Exceeds RLS temporarily to insert ledgers
AS $$
BEGIN
    -- 1. Record the immutable ledger entry.
    -- This will natively throw a unique constraint violation if p_reference_id + p_type already exists.
    INSERT INTO aura_ledger (user_id, amount, type, reference_id)
    VALUES (p_user_id, p_amount, p_type, p_reference_id);

    -- 2. Update the denormalized aura_points column atomically
    UPDATE users 
    SET aura_points = COALESCE(aura_points, 0) + p_amount 
    WHERE id = p_user_id;

    -- 3. Prevent negative aura balance (for deductions)
    IF (SELECT COALESCE(aura_points, 0) FROM users WHERE id = p_user_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient Aura points for transaction';
    END IF;
END;
$$;

-- -------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- -------------------------------------------------------------------------
-- Ensure that tables are isolated by user unless accessed by Service Role

-- Aura Ledger (Read-Only to users)
ALTER TABLE aura_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own aura ledger" ON aura_ledger;
CREATE POLICY "Users can view own aura ledger" 
ON aura_ledger FOR SELECT 
USING (auth.uid() = user_id);

-- Processed Events (Hidden entirely from users)
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;
-- No user policies defined => Only Service Role can read/write

-- Prevent profile manipulation (Users can only update themselves)
-- Checking if table `users` already has RLS, dropping policy to recreate safe version
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- -------------------------------------------------------------------------
-- 6. Khata Ledger Hardening (Append-Only tracking for debts)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS khata_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- references khata_students
    canteen_id UUID NOT NULL REFERENCES canteens(id),
    amount DECIMAL(10,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
    reference_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_khata_ledger_student ON khata_ledger(student_id);

-- Apply RLS
ALTER TABLE khata_ledger ENABLE ROW LEVEL SECURITY;
-- Only service role / canteen admins can manipulate khata ledger


-- ==========================================
-- backfill_order_items_from_requests.sql
-- ==========================================

-- Backfill order_items for super-app orders that are missing them.
-- This copies items from order_request_items → order_items
-- for all orders that have an order_request_id but no corresponding order_items rows.

INSERT INTO public.order_items (order_id, menu_item_id, quantity, price, canteen_price)
SELECT
  o.id           AS order_id,
  ori.menu_item_id,
  ori.quantity,
  ori.price,
  COALESCE(ori.canteen_price, ori.price) AS canteen_price
FROM public.orders o
JOIN public.order_request_items ori ON ori.order_request_id = o.order_request_id
WHERE o.order_request_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.order_items oi WHERE oi.order_id = o.id
  );

-- Verify: show how many rows were inserted per order
SELECT o.id, o.order_number, o.serial_number, COUNT(oi.id) AS item_count
FROM public.orders o
LEFT JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.order_request_id IS NOT NULL
GROUP BY o.id, o.order_number, o.serial_number
ORDER BY o.created_at DESC
LIMIT 20;


-- ==========================================
-- sre_resiliency_migration.sql
-- ==========================================

-- =========================================================================
-- SRE OPERATIONAL RESILIENCY MIGRATION
-- Atomic Webhook Processor + Dead Letter Queue + Human Error Guards
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. Dead Letter Queue for Failed Webhooks
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS failed_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dead', 'processing'))
);
CREATE INDEX IF NOT EXISTS idx_failed_webhooks_status ON failed_webhooks(status, retry_count);
ALTER TABLE failed_webhooks ENABLE ROW LEVEL SECURITY;
-- No user policies => Only Service Role can access DLQ

-- -------------------------------------------------------------------------
-- 2. Human Admin Error Guardrail (Trigger on users table)
-- -------------------------------------------------------------------------
-- Prevent direct updates to `aura_points` outside of the officially sanctioned RPC.
-- This ensures the ledger never drifts from the aggregated sum.
CREATE OR REPLACE FUNCTION trg_guard_aura_points()
RETURNS trigger AS $$
BEGIN
    -- Only abort if aura_points changed and the session explicitly lacks the aura_lock
    -- (The process_aura_transaction sets current_setting('zlice.aura_lock') = '1' locally)
    IF NEW.aura_points IS DISTINCT FROM OLD.aura_points THEN
        BEGIN
            IF current_setting('zlice.aura_lock', true) IS DISTINCT FROM '1' THEN
                RAISE EXCEPTION 'DIRECT AURA MUTATION BLOCKED. Must use process_aura_transaction RPC or insert into ledger natively.';
            END IF;
        EXCEPTION WHEN undefined_object THEN
             RAISE EXCEPTION 'DIRECT AURA MUTATION BLOCKED. Must use process_aura_transaction RPC or insert into ledger natively.';
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_strict_aura_guard ON users;
CREATE TRIGGER trg_strict_aura_guard
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trg_guard_aura_points();

-- -------------------------------------------------------------------------
-- 3. Update Existing Aura RPC to Request the Local Lock
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_aura_transaction(
    p_user_id UUID,
    p_amount INT,
    p_type TEXT,
    p_reference_id TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Record the immutable ledger entry.
    INSERT INTO aura_ledger (user_id, amount, type, reference_id)
    VALUES (p_user_id, p_amount, p_type, p_reference_id);

    -- 2. Unlock the trigger temporarily for this transaction only
    PERFORM set_config('zlice.aura_lock', '1', true);

    -- 3. Update the denormalized aura_points column atomically
    UPDATE users 
    SET aura_points = COALESCE(aura_points, 0) + p_amount 
    WHERE id = p_user_id;

    -- 4. Prevent negative aura balance (for deductions)
    IF (SELECT COALESCE(aura_points, 0) FROM users WHERE id = p_user_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient Aura points for transaction';
    END IF;
END;
$$;

-- -------------------------------------------------------------------------
-- 4. ATOMIC Webhook Execution RPC
-- -------------------------------------------------------------------------
-- Fulfills an entire order natively inside the DB. 
-- Will rollback natively on any conflict, duplicate index, or application failure.
CREATE OR REPLACE FUNCTION execute_cashfree_fulfillment(
    p_cf_payment_id TEXT,
    p_order_request_id UUID,
    p_payment_amount NUMERIC,
    p_payment_method JSONB,
    p_payment_group TEXT,
    p_bank_reference TEXT,
    p_payment_time TEXT,
    p_serial_number BIGINT,
    p_order_number TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_req RECORD;
    v_order_id UUID;
    v_aura_deducted INT := 0;
    v_aura_earned INT := 0;
    v_coupon RECORD;
    v_reward NUMERIC;
    v_item RECORD;
BEGIN
    -- 0. Set local timezone config assuming GMT mapping
    SET LOCAL timezone To 'GMT';

    -- 1. Idempotency Lock: If it fails here, Node returns 200 OK gracefully
    -- DO NOT USE INSERT IGNORE logic here, let it bubble up as a unique_violation cleanly
    INSERT INTO processed_events (id, source)
    VALUES (p_cf_payment_id, 'CASHFREE_WEBHOOK');

    -- 2. Lock the Order Request Row
    SELECT * INTO v_order_req FROM order_requests WHERE id = p_order_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order Request % not found', p_order_request_id;
    END IF;

    -- Idempotency check 2 (Safeguard)
    IF v_order_req.status = 'confirmed' THEN
         RAISE EXCEPTION 'Order already confirmed manually';
    END IF;

    -- 3. Strict Amount Validation
    IF p_payment_amount < v_order_req.total_amount THEN
        RAISE EXCEPTION 'SECURITY ALERT: Partial Payment Detected (Paid %, Expected %)', p_payment_amount, v_order_req.total_amount;
    END IF;

    -- 4. Process Aura Deductions
    IF v_order_req.coupon_id IS NOT NULL THEN
        SELECT * INTO v_coupon FROM canteen_coupons WHERE id = v_order_req.coupon_id;
        IF FOUND AND COALESCE(v_coupon.aura_cost, 0) > 0 THEN
             -- Call our Aura RPC (it maintains ledger recursively)
             PERFORM process_aura_transaction(
                 v_order_req.user_id,
                 -v_coupon.aura_cost,
                 'SPEND_COUPON',
                 'COUPON_' || v_order_req.coupon_id::TEXT || '_REQ_' || p_order_request_id::TEXT
             );
             v_aura_deducted := v_coupon.aura_cost;
        END IF;
    END IF;

    -- 5. Process Aura Rewards
    v_reward := floor(v_order_req.total_amount * 0.10);
    IF v_reward > 0 THEN
        PERFORM process_aura_transaction(
            v_order_req.user_id,
            v_reward::INT,
            'EARN_ORDER',
            'REQ_' || p_order_request_id::TEXT
        );
        v_aura_earned := v_reward;
    END IF;

    -- 6. Insert Final Order Node
    INSERT INTO orders (
        order_number, serial_number, status, payment_status, order_type,
        total_amount, canteen_amount, delivery_partner_amount, packaging_amount,
        is_gst_enabled, delivery_fee, packaging_fee, canteen_id, user_id, address_id,
        order_request_id, note, coupon_id,
        metadata
    ) VALUES (
        p_order_number, p_serial_number, 'not_started', 'paid', v_order_req.order_type,
        v_order_req.total_amount, v_order_req.canteen_amount, v_order_req.delivery_partner_amount, v_order_req.packaging_amount,
        v_order_req.is_gst_enabled, v_order_req.delivery_fee, v_order_req.packaging_fee, v_order_req.canteen_id, v_order_req.user_id, v_order_req.address_id,
        p_order_request_id, v_order_req.note, v_order_req.coupon_id,
        jsonb_build_object('aura_deducted', v_aura_deducted, 'aura_earned', v_aura_earned)
    ) RETURNING id INTO v_order_id;

    -- 7. Insert Order Items (Bulk map from request items)
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, canteen_price)
    SELECT v_order_id, menu_item_id, quantity, price, COALESCE(canteen_price, price)
    FROM order_request_items
    WHERE order_request_id = p_order_request_id;

    -- 8. Mark Request Confirmed
    UPDATE order_requests 
    SET status = 'confirmed', payment_status = 'completed', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = p_order_request_id;

    -- 9. Complete linking payments table
    UPDATE payments
    SET status = 'success', payment_method = p_payment_method::TEXT, payment_group = p_payment_group,
        cf_payment_id = p_cf_payment_id, bank_reference = p_bank_reference,
        payment_time = p_payment_time, updated_at = NOW(), order_id = v_order_id
    WHERE order_request_id = p_order_request_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;


-- ==========================================
-- revoke_rpc_public_execution.sql
-- ==========================================

-- PostgreSQL automatically grants EXECUTE to PUBLIC on new functions.
-- We must revoke this to prevent malicious frontend clients from calling
-- these financial mutation functions directly.

-- 1. Secure Aura Transaction RPC
REVOKE EXECUTE ON FUNCTION process_aura_transaction(UUID, INT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION process_aura_transaction(UUID, INT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION process_aura_transaction(UUID, INT, TEXT, TEXT) TO service_role;

-- 2. Secure Cashfree Fulfillment RPC
REVOKE EXECUTE ON FUNCTION execute_cashfree_fulfillment(TEXT, UUID, NUMERIC, JSONB, TEXT, TEXT, TEXT, BIGINT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION execute_cashfree_fulfillment(TEXT, UUID, NUMERIC, JSONB, TEXT, TEXT, TEXT, BIGINT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION execute_cashfree_fulfillment(TEXT, UUID, NUMERIC, JSONB, TEXT, TEXT, TEXT, BIGINT, TEXT) TO service_role;


-- ==========================================
-- add_orders_metadata_column.sql
-- ==========================================

-- Add the missing metadata column to the orders table 
-- to store aura_deducted and aura_earned from webhook fulfillment

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;


-- ==========================================
-- fix_rpc_timestamp_cast.sql
-- ==========================================

-- Fixes the 42804 error where text could not be implicitly cast to timestamp with time zone
-- during the UPDATE payments table step.

CREATE OR REPLACE FUNCTION execute_cashfree_fulfillment(
    p_cf_payment_id TEXT,
    p_order_request_id UUID,
    p_payment_amount NUMERIC,
    p_payment_method JSONB,
    p_payment_group TEXT,
    p_bank_reference TEXT,
    p_payment_time TEXT,
    p_serial_number BIGINT,
    p_order_number TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_req RECORD;
    v_order_id UUID;
    v_aura_deducted INT := 0;
    v_aura_earned INT := 0;
    v_coupon RECORD;
    v_reward NUMERIC;
    v_item RECORD;
BEGIN
    -- 0. Set local timezone config assuming GMT mapping
    SET LOCAL timezone To 'GMT';

    -- 1. Idempotency Lock: If it fails here, Node returns 200 OK gracefully
    INSERT INTO processed_events (id, source)
    VALUES (p_cf_payment_id, 'CASHFREE_WEBHOOK');

    -- 2. Lock the Order Request Row
    SELECT * INTO v_order_req FROM order_requests WHERE id = p_order_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order Request % not found', p_order_request_id;
    END IF;

    -- Idempotency check 2 (Safeguard)
    IF v_order_req.status = 'confirmed' THEN
         RAISE EXCEPTION 'Order already confirmed manually';
    END IF;

    -- 3. Strict Amount Validation
    IF p_payment_amount < v_order_req.total_amount THEN
        RAISE EXCEPTION 'SECURITY ALERT: Partial Payment Detected (Paid %, Expected %)', p_payment_amount, v_order_req.total_amount;
    END IF;

    -- 4. Process Aura Deductions
    IF v_order_req.coupon_id IS NOT NULL THEN
        SELECT * INTO v_coupon FROM canteen_coupons WHERE id = v_order_req.coupon_id;
        IF FOUND AND COALESCE(v_coupon.aura_cost, 0) > 0 THEN
             PERFORM process_aura_transaction(
                 v_order_req.user_id,
                 -v_coupon.aura_cost,
                 'SPEND_COUPON',
                 'COUPON_' || v_order_req.coupon_id::TEXT || '_REQ_' || p_order_request_id::TEXT
             );
             v_aura_deducted := v_coupon.aura_cost;
        END IF;
    END IF;

    -- 5. Process Aura Rewards
    v_reward := floor(v_order_req.total_amount * 0.10);
    IF v_reward > 0 THEN
        PERFORM process_aura_transaction(
            v_order_req.user_id,
            v_reward::INT,
            'EARN_ORDER',
            'REQ_' || p_order_request_id::TEXT
        );
        v_aura_earned := v_reward;
    END IF;

    -- 6. Insert Final Order Node
    INSERT INTO orders (
        order_number, serial_number, status, payment_status, order_type,
        total_amount, canteen_amount, delivery_partner_amount, packaging_amount,
        is_gst_enabled, delivery_fee, packaging_fee, canteen_id, user_id, address_id,
        order_request_id, note, coupon_id,
        metadata
    ) VALUES (
        p_order_number, p_serial_number, 'not_started', 'paid', v_order_req.order_type,
        v_order_req.total_amount, v_order_req.canteen_amount, v_order_req.delivery_partner_amount, v_order_req.packaging_amount,
        v_order_req.is_gst_enabled, v_order_req.delivery_fee, v_order_req.packaging_fee, v_order_req.canteen_id, v_order_req.user_id, v_order_req.address_id,
        p_order_request_id, v_order_req.note, v_order_req.coupon_id,
        jsonb_build_object('aura_deducted', v_aura_deducted, 'aura_earned', v_aura_earned)
    ) RETURNING id INTO v_order_id;

    -- 7. Insert Order Items (Bulk map from request items)
    INSERT INTO order_items (order_id, menu_item_id, quantity, price, canteen_price)
    SELECT v_order_id, menu_item_id, quantity, price, COALESCE(canteen_price, price)
    FROM order_request_items
    WHERE order_request_id = p_order_request_id;

    -- 8. Mark Request Confirmed
    UPDATE order_requests 
    SET status = 'confirmed', payment_status = 'completed', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = p_order_request_id;

    -- 9. Complete linking payments table (FIXED TEXT to TIMESTAMP WITH TIME ZONE CAST)
    UPDATE payments
    SET status = 'success', payment_method = p_payment_method::TEXT, payment_group = p_payment_group,
        cf_payment_id = p_cf_payment_id, bank_reference = p_bank_reference,
        payment_time = p_payment_time::TIMESTAMPTZ, updated_at = NOW()
    WHERE order_request_id = p_order_request_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;


