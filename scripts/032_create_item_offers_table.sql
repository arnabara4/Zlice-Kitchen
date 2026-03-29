CREATE TABLE IF NOT EXISTS public.item_offers
(
    id SERIAL PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    offer_description TEXT,
    discount_percentage NUMERIC CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    valid_from TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITHOUT TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_item_offers_item_id ON public.item_offers(item_id);
CREATE INDEX IF NOT EXISTS idx_item_offers_is_active ON public.item_offers(is_active);
CREATE INDEX IF NOT EXISTS idx_item_offers_valid_dates ON public.item_offers(valid_from, valid_until);