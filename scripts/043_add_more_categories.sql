-- 043_add_more_categories.sql
-- Adds more default categories

INSERT INTO public.categories (name, image_url) VALUES
('Thali', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60'),
('Biryani', 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&auto=format&fit=crop&q=60'),
('Wraps', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&auto=format&fit=crop&q=60'),
('Salads', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=60'),
('Ice Cream', 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&auto=format&fit=crop&q=60'),
('Rolls', 'https://images.unsplash.com/photo-1541592393394-550302b1897d?w=500&auto=format&fit=crop&q=60'),
('Sandwich', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60'),
('Pizza', 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500&auto=format&fit=crop&q=60'),
('Burger', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60')
ON CONFLICT (name) DO NOTHING;
