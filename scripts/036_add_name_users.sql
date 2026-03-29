ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name VARCHAR(100);

-- Update existing users with a default name if NULL
UPDATE public.users
SET name = 'Unknown'
WHERE name IS NULL;

-- Create an index on the name column for faster searches
CREATE INDEX IF NOT EXISTS idx_users_name ON public.users(name);

-- Optional: You can add a NOT NULL constraint if you want to enforce that all users must have a name in the future
ALTER TABLE public.users
ALTER COLUMN name SET NOT NULL;