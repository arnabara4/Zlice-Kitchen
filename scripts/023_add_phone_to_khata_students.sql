-- 023_add_phone_to_khata_students.sql
-- Add phone_number field to khata_students table

-- Add phone_number column to khata_students
ALTER TABLE public.khata_students 
ADD COLUMN IF NOT EXISTS phone_number text;

-- Create index for phone number searches
CREATE INDEX IF NOT EXISTS idx_khata_students_phone_number ON public.khata_students(phone_number);
