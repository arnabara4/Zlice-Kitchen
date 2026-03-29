CREATE TABLE IF NOT EXISTS public.canteen_coupons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  canteen_id uuid NOT NULL
    REFERENCES public.canteens(id) ON DELETE CASCADE,

  code text NOT NULL,
  name text NOT NULL,

  type text NOT NULL CHECK (type IN (
    'flat',
    'percentage',
    'free_delivery',
    'free_item'
  )),

  description text,
  tagline text,

  aura_cost integer DEFAULT 0,

  valid_from timestamptz NOT NULL,
  valid_until timestamptz NOT NULL,

  is_active boolean DEFAULT false,

  -- Embedded rule engine
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  rewards jsonb NOT NULL DEFAULT '[]'::jsonb,

  created_at timestamptz DEFAULT now(),

  -- Per-canteen uniqueness
  UNIQUE (canteen_id, code)
);
