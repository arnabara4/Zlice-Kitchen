-- 045_add_image_url_to_menu_items.sql
-- Adds image_url column to menu_items table for storing food images

-- Add image_url column to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS image_url text;

-- Create index for better query performance when filtering by items with images
CREATE INDEX IF NOT EXISTS idx_menu_items_image_url ON public.menu_items(image_url) WHERE image_url IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.menu_items.image_url IS 'URL of the menu item image, typically hosted on Cloudinary or similar CDN';
