-- 038_create_categories_table.sql
-- Creates categories table for canteen classification

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access"
  ON public.categories FOR SELECT
  USING (true);

-- Insert default categories
INSERT INTO public.categories (name, image_url) VALUES
('North Indian', 'https://images.unsplash.com/photo-1585937421612-70a008356f36?w=500&auto=format&fit=crop&q=60'),
('South Indian', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60'),
('Chinese', 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500&auto=format&fit=crop&q=60'),
('Cafe & Snacks', 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=60'),
('Beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=60'),
('Desserts', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60')
ON CONFLICT (name) DO NOTHING;
