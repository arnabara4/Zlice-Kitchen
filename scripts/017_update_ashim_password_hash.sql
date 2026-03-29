-- 017_update_ashim_password_hash.sql
-- Update Ashim canteen with correct bcrypt hash for password: 12345678

UPDATE public.canteens 
SET password_hash = '$2b$10$JoWPY63Uw/t4lhjzgUkI5eeB6zbJvSr/UITqyc47TQbjXjgUgMJ1m' 
WHERE email = 'ashim@canteen.com';

-- Verify the update
SELECT 
  id, 
  name, 
  email, 
  password_hash, 
  is_active 
FROM public.canteens 
WHERE email = 'ashim@canteen.com';
