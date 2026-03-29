-- 081: Add WELCOME_BONUS to aura_ledger type check constraint
-- Required for the onboarding welcome bonus flow

ALTER TABLE aura_ledger DROP CONSTRAINT aura_ledger_type_check;
ALTER TABLE aura_ledger ADD CONSTRAINT aura_ledger_type_check 
  CHECK (type IN ('EARN_ORDER', 'SPEND_COUPON', 'REFUND', 'ADMIN_ADJUSTMENT', 'WELCOME_BONUS'));
