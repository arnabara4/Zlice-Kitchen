ALTER TABLE public.orders
ADD COLUMN coupon_id UUID REFERENCES public.canteen_coupons(id);

ALTER TABLE public.order_requests
ADD COLUMN coupon_id UUID REFERENCES public.canteen_coupons(id);