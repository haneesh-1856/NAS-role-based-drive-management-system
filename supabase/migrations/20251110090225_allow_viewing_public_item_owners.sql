/*
  # Allow Viewing Public Item Owners

  ## Changes
  1. Add policy to allow all authenticated users to view user profiles for public content owners
  2. This enables displaying owner email on public files and folders

  ## Security
  - Only basic profile info (id, email) is exposed
  - Only for owners of public items
  - All authenticated users can read this info to see who owns public content
*/

-- ============================================================================
-- Allow users to view profiles of public content owners
-- ============================================================================

CREATE POLICY "Users can view profiles of public content owners"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view profiles of users who own public files or folders
    EXISTS (
      SELECT 1 FROM files 
      WHERE files.owner_id = user_profiles.id 
      AND files.is_public = true
    )
    OR EXISTS (
      SELECT 1 FROM folders 
      WHERE folders.owner_id = user_profiles.id 
      AND folders.is_public = true
    )
  );
