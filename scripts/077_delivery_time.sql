-- Add timestamp columns for all statuses
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS cooking_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ready_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_assigned_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS picked_up_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS in_transit_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_time TIMESTAMPTZ;

-- Function to update timestamps on status change
CREATE OR REPLACE FUNCTION update_order_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Kitchen status changes
    IF (NEW.status = 'cooking' AND (OLD.status IS DISTINCT FROM 'cooking')) THEN
        NEW.cooking_time := NOW();
    END IF;
    IF (NEW.status = 'ready' AND (OLD.status IS DISTINCT FROM 'ready')) THEN
        NEW.ready_time := NOW();
    END IF;
    IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
        NEW.completed_time := NOW();
    END IF;

    -- Delivery status changes
    IF (NEW.delivery_status = 'assigned' AND (OLD.delivery_status IS DISTINCT FROM 'assigned')) THEN
        NEW.delivery_assigned_time := NOW();
    END IF;
    IF (NEW.delivery_status = 'picked_up' AND (OLD.delivery_status IS DISTINCT FROM 'picked_up')) THEN
        NEW.picked_up_time := NOW();
    END IF;
    IF (NEW.delivery_status = 'in_transit' AND (OLD.delivery_status IS DISTINCT FROM 'in_transit')) THEN
        NEW.in_transit_time := NOW();
    END IF;
    IF (NEW.delivery_status = 'delivered' AND (OLD.delivery_status IS DISTINCT FROM 'delivered')) THEN
        NEW.delivery_time := NOW();
    END IF;
    IF (NEW.delivery_status = 'cancelled' AND (OLD.delivery_status IS DISTINCT FROM 'cancelled')) THEN
        NEW.cancelled_time := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function before update
DROP TRIGGER IF EXISTS trigger_update_order_status_timestamps ON orders;
CREATE TRIGGER trigger_update_order_status_timestamps
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_order_status_timestamps();