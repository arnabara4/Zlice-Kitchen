-- Create Enum for charge type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE charge_type AS ENUM ('CANTEEN_DISTRIBUTED', 'ORDER_SPECIFIC', 'GLOBAL_MISC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create charges table
CREATE TABLE IF NOT EXISTS charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canteen_id UUID REFERENCES canteens(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    charge_amount NUMERIC NOT NULL,
    charge_reason TEXT NOT NULL,
    charge_type charge_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by_admin UUID NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_charges_canteen_id ON charges(canteen_id);
CREATE INDEX IF NOT EXISTS idx_charges_order_id ON charges(order_id);
CREATE INDEX IF NOT EXISTS idx_charges_created_at ON charges(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_canteen_id ON orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Add RLS policies
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;

ALTER TABLE charges ADD COLUMN applied BOOLEAN DEFAULT false;
-- Index for performance on queries filtering by applied status
CREATE INDEX IF NOT EXISTS idx_charges_applied ON charges(applied);
-- Optionally, mark existing charges as applied if they are tied to settled orders
-- This is a one-time cleanup to align existing data
-- End of migration


