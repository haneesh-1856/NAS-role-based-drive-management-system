/*
  # Add Username Field to User Profiles

  ## Changes
  1. Add username column to user_profiles table
  2. Set default username based on email
  
  ## Details
  - Adds username field as text
  - Makes username unique
  - Sets default value for existing users
*/

-- Add username column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text UNIQUE;
  END IF;
END $$;

-- Set default username for existing users (first part of email)
UPDATE user_profiles 
SET username = split_part(email, '@', 1)
WHERE username IS NULL;
