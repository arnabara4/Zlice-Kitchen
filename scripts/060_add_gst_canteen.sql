ALTER TABLE canteens
ADD column is_gst_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE canteens
ADD column  gst_number VARCHAR(15);