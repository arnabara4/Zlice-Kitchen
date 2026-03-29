-- 021_add_slideshow_settings.sql
-- Add slideshow settings to canteens table

-- Add columns for slideshow settings
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS slideshow_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS slideshow_interval INTEGER DEFAULT 5000,
ADD COLUMN IF NOT EXISTS slideshow_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS orders_display_interval INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS orders_display_duration INTEGER DEFAULT 15000;

-- Add comments explaining the slideshow structure
COMMENT ON COLUMN public.canteens.slideshow_interval IS 
'Duration in milliseconds for each slideshow item (default: 5000ms = 5 seconds)';

COMMENT ON COLUMN public.canteens.slideshow_items IS 
'Array of slideshow items. Each item has: {type: "image" | "youtube" | "youtube-playlist", url: string, title?: string, duration?: number}. If duration is specified for an item, it overrides slideshow_interval for that item. Playlists play continuously without duration.';

COMMENT ON COLUMN public.canteens.orders_display_interval IS 
'Time in milliseconds between showing orders during slideshow rotation (default: 10000ms = 10 seconds)';

COMMENT ON COLUMN public.canteens.orders_display_duration IS 
'Duration in milliseconds to show orders display before returning to slideshow (default: 15000ms = 15 seconds)';

-- Example of slideshow_items structure:
-- [
--   {"type": "image", "url": "https://example.com/image1.jpg", "title": "Welcome", "duration": 7000},
--   {"type": "youtube", "url": "https://www.youtube.com/watch?v=VIDEO_ID", "title": "Promo Video", "duration": 30000},
--   {"type": "youtube-playlist", "url": "https://www.youtube.com/playlist?list=PLAYLIST_ID", "title": "Video Series"}
-- ]
