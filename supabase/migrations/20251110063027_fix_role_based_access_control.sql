/*
  # Fix Role-Based Access Control - CRITICAL SECURITY UPDATE

  ## Problem Summary
  The current RLS policies have major security vulnerabilities:
  1. No role-based enforcement (reader, writer, editor roles ignored)
  2. Overly permissive policies allowing all users to view/update everything
  3. Duplicate and conflicting policies
  4. Missing admin management capabilities

  ## Changes Made

  ### 1. User Profiles & Storage Quota
  - **REMOVED**: Overly permissive "Service role" policies (USING true)
  - **ADDED**: Proper admin-only policies for viewing all profiles/quotas
  - **ADDED**: Admin can update user profiles (for role management)

  ### 2. Files Table
  - **REMOVED**: Duplicate UPDATE policies
  - **REMOVED**: Old "Users can view own files or public files" policy
  - **FIXED**: INSERT requires writer, editor, or admin role
  - **ADDED**: Admin can delete any file
  - **ADDED**: Admin can update any file
  - **ADDED**: Editors can delete/update public files

  ### 3. Folders Table
  - **FIXED**: INSERT requires writer, editor, or admin role
  - **ADDED**: Admin can view/delete/update any folder
  - **ADDED**: Editors can update/delete public folders
  - **ADDED**: Shared editors can update shared folders

  ### 4. Role Enforcement
  - Reader: Can only view public/shared items (no create/edit)
  - Writer: Can create/manage own content
  - Editor: Can manage public content + own content
  - Admin: Full access to everything

  ## Security Impact
  - Fixes data breach where any user could view all profiles/quotas
  - Prevents readers from creating content
  - Enables proper role-based access control
  - Allows admins to manage the system
*/

-- ============================================================================
-- STEP 1: Clean up duplicate and problematic policies
-- ============================================================================

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Service role can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can view all quotas" ON storage_quota;
DROP POLICY IF EXISTS "System can update quota" ON storage_quota;

-- Remove duplicate policies on files
DROP POLICY IF EXISTS "Users can update own files" ON files;
DROP POLICY IF EXISTS "Users can view own files or public files" ON files;

-- Remove old folder policies that we'll replace
DROP POLICY IF EXISTS "Users can view own files" ON files;

-- ============================================================================
-- STEP 2: Add proper admin policies for user management
-- ============================================================================

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update any user profile (for role management)
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can view all storage quotas
CREATE POLICY "Admins can view all quotas"
  ON storage_quota FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update any storage quota
CREATE POLICY "Admins can update quotas"
  ON storage_quota FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- STEP 3: Fix FILES table policies with role enforcement
-- ============================================================================

-- Drop and recreate INSERT policy with role check
DROP POLICY IF EXISTS "Writers can insert files" ON files;

CREATE POLICY "Writers and above can insert files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('writer', 'editor', 'admin')
  );

-- Add proper SELECT policy for own files
CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() AND trashed = false
  );

-- Admins can delete any file
CREATE POLICY "Admins can delete any file"
  ON files FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update any file
CREATE POLICY "Admins can update any file"
  ON files FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Editors can update public files
CREATE POLICY "Editors can update public files"
  ON files FOR UPDATE
  TO authenticated
  USING (
    is_public = true AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('editor', 'admin')
  )
  WITH CHECK (
    is_public = true AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('editor', 'admin')
  );

-- Editors can delete public files
CREATE POLICY "Editors can delete public files"
  ON files FOR DELETE
  TO authenticated
  USING (
    is_public = true AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('editor', 'admin')
  );

-- ============================================================================
-- STEP 4: Fix FOLDERS table policies with role enforcement
-- ============================================================================

-- Drop and recreate INSERT policy with role check
DROP POLICY IF EXISTS "Owners can insert folders" ON folders;

CREATE POLICY "Writers and above can insert folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('writer', 'editor', 'admin')
  );

-- Admins can view all folders
CREATE POLICY "Admins can view all folders"
  ON folders FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can delete any folder
CREATE POLICY "Admins can delete any folder"
  ON folders FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update any folder
CREATE POLICY "Admins can update any folder"
  ON folders FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Editors can update public folders
CREATE POLICY "Editors can update public folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (
    is_public = true AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('editor', 'admin')
  )
  WITH CHECK (
    is_public = true AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('editor', 'admin')
  );

-- Editors can delete public folders
CREATE POLICY "Editors can delete public folders"
  ON folders FOR DELETE
  TO authenticated
  USING (
    is_public = true AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('editor', 'admin')
  );

-- Shared editors can update shared folders
CREATE POLICY "Shared editors can update folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.item_type = 'folder'
      AND shared_items.item_id = folders.id
      AND shared_items.shared_with = auth.uid()
      AND shared_items.permission = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.item_type = 'folder'
      AND shared_items.item_id = folders.id
      AND shared_items.shared_with = auth.uid()
      AND shared_items.permission = 'editor'
    )
  );

-- ============================================================================
-- STEP 5: Add admin policies for backups management
-- ============================================================================

-- Admins can delete backups
CREATE POLICY "Admins can delete backups"
  ON backups FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update backups
CREATE POLICY "Admins can update backups"
  ON backups FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
