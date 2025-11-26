/*
  # Update Storage Limit and Add Usage Tracking

  ## Changes
  1. Update storage limit from 100MB to 500MB for all users
  2. Add helper function to calculate user storage usage
  3. Add helper function to check if user has available storage

  ## Details
  - Updates default storage limit in user_profiles table
  - Creates function to sum file sizes for storage tracking
  - Creates function to validate storage before uploads
*/

-- ============================================================================
-- Update storage limit to 500MB
-- ============================================================================

ALTER TABLE user_profiles 
ALTER COLUMN storage_limit_mb SET DEFAULT 500;

-- Update existing users to have 500MB limit
UPDATE user_profiles 
SET storage_limit_mb = 500 
WHERE storage_limit_mb = 100;

-- ============================================================================
-- Function to calculate user's current storage usage
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_storage_usage(user_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(file_size_mb) 
     FROM files 
     WHERE owner_id = user_id 
     AND trashed = false),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to check if user has available storage
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_storage_available(user_id uuid, file_size numeric)
RETURNS boolean AS $$
DECLARE
  current_usage numeric;
  storage_limit numeric;
BEGIN
  SELECT get_user_storage_usage(user_id) INTO current_usage;
  SELECT storage_limit_mb INTO storage_limit 
  FROM user_profiles 
  WHERE id = user_id;
  
  RETURN (current_usage + file_size) <= storage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
