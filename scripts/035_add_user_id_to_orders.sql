ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_id UUID;

ALTER TABLE public.orders
ADD CONSTRAINT fk_orders_user
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);