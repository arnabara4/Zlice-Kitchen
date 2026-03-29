-- Fixes execute_cashfree_fulfillment to copy scheduling fields from order_requests to orders
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
    -- 0. Set local timezone config
    SET LOCAL timezone To 'GMT';

    -- 1. Idempotency Lock
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

    -- 6. Insert Final Order Node (UPDATED TO INCLUDE SCHEDULING FIELDS)
    INSERT INTO orders (
        order_number, serial_number, status, payment_status, order_type,
        total_amount, canteen_amount, delivery_partner_amount, packaging_amount,
        is_gst_enabled, delivery_fee, packaging_fee, canteen_id, user_id, address_id,
        order_request_id, note, coupon_id, metadata,
        order_mode, scheduled_date, scheduled_category_id
    ) VALUES (
        p_order_number, p_serial_number, 'not_started', 'paid', v_order_req.order_type,
        v_order_req.total_amount, v_order_req.canteen_amount, v_order_req.delivery_partner_amount, v_order_req.packaging_amount,
        v_order_req.is_gst_enabled, v_order_req.delivery_fee, v_order_req.packaging_fee, v_order_req.canteen_id, v_order_req.user_id, v_order_req.address_id,
        p_order_request_id, v_order_req.note, v_order_req.coupon_id,
        jsonb_build_object('aura_deducted', v_aura_deducted, 'aura_earned', v_aura_earned),
        v_order_req.order_mode, v_order_req.scheduled_date, v_order_req.scheduled_category_id
    ) RETURNING id INTO v_order_id;

    -- 7. Insert Order Items
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
        payment_time = p_payment_time::TIMESTAMPTZ, updated_at = NOW()
    WHERE order_request_id = p_order_request_id;

    RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$;
