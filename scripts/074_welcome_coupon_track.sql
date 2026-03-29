ALTER TABLE users 
ADD COLUMN IF NOT EXISTS welcome_bonus_claimed BOOLEAN DEFAULT false NOT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN users.welcome_bonus_claimed IS 'Tracks whether the user has claimed their one-time welcome bonus of 100 aura points';
