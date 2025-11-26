/*
  # Fix Infinite Recursion in RLS Policies

  ## Problem
  Policies that check user roles by querying user_profiles table cause infinite recursion:
  - When accessing user_profiles, the policy checks the role
  - To check the role, it queries user_profiles again
  - This creates an infinite loop

  ## Solution
  Use a helper function with SECURITY DEFINER that bypasses RLS to get the user's role.
  This breaks the recursion cycle by allowing the role check without triggering policies.

  ## Changes
  1. Create a secure helper function to get user role
  2. Update all policies to use this function instead of subqueries
  3. This fixes recursion in user_profiles, files, folders, storage_quota, and backups policies
*/

-- ============================================================================
-- STEP 1: Create helper function to get user role (bypasses RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM user_profiles WHERE id = user_id;
$$;

-- ============================================================================
-- STEP 2: Fix user_profiles policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;

CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- STEP 3: Fix storage_quota policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all quotas" ON storage_quota;
DROP POLICY IF EXISTS "Admins can update quotas" ON storage_quota;

CREATE POLICY "Admins can view all quotas"
  ON storage_quota FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update quotas"
  ON storage_quota FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- STEP 4: Fix files policies
-- ============================================================================

DROP POLICY IF EXISTS "Admin can view all files" ON files;
DROP POLICY IF EXISTS "Admins can update any file" ON files;
DROP POLICY IF EXISTS "Admins can delete any file" ON files;
DROP POLICY IF EXISTS "Editors can update public files" ON files;
DROP POLICY IF EXISTS "Editors can delete public files" ON files;
DROP POLICY IF EXISTS "Writers and above can insert files" ON files;

CREATE POLICY "Admin can view all files"
  ON files FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update any file"
  ON files FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete any file"
  ON files FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Editors can update public files"
  ON files FOR UPDATE
  TO authenticated
  USING (
    is_public = true AND
    get_user_role(auth.uid()) IN ('editor', 'admin')
  )
  WITH CHECK (
    is_public = true AND
    get_user_role(auth.uid()) IN ('editor', 'admin')
  );

CREATE POLICY "Editors can delete public files"
  ON files FOR DELETE
  TO authenticated
  USING (
    is_public = true AND
    get_user_role(auth.uid()) IN ('editor', 'admin')
  );

CREATE POLICY "Writers and above can insert files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    get_user_role(auth.uid()) IN ('writer', 'editor', 'admin')
  );

-- ============================================================================
-- STEP 5: Fix folders policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all folders" ON folders;
DROP POLICY IF EXISTS "Admins can update any folder" ON folders;
DROP POLICY IF EXISTS "Admins can delete any folder" ON folders;
DROP POLICY IF EXISTS "Editors can update public folders" ON folders;
DROP POLICY IF EXISTS "Editors can delete public folders" ON folders;
DROP POLICY IF EXISTS "Writers and above can insert folders" ON folders;

CREATE POLICY "Admins can view all folders"
  ON folders FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update any folder"
  ON folders FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete any folder"
  ON folders FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Editors can update public folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (
    is_public = true AND
    get_user_role(auth.uid()) IN ('editor', 'admin')
  )
  WITH CHECK (
    is_public = true AND
    get_user_role(auth.uid()) IN ('editor', 'admin')
  );

CREATE POLICY "Editors can delete public folders"
  ON folders FOR DELETE
  TO authenticated
  USING (
    is_public = true AND
    get_user_role(auth.uid()) IN ('editor', 'admin')
  );

CREATE POLICY "Writers and above can insert folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    get_user_role(auth.uid()) IN ('writer', 'editor', 'admin')
  );

-- ============================================================================
-- STEP 6: Fix backups policies
-- ============================================================================

DROP POLICY IF EXISTS "Only admins can view backups" ON backups;
DROP POLICY IF EXISTS "Admins can delete backups" ON backups;
DROP POLICY IF EXISTS "Admins can update backups" ON backups;

CREATE POLICY "Only admins can view backups"
  ON backups FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can delete backups"
  ON backups FOR DELETE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update backups"
  ON backups FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin')
  WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- STEP 7: Fix audit_logs and system_logs policies
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Only admins can view system logs" ON system_logs;

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can view system logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');
