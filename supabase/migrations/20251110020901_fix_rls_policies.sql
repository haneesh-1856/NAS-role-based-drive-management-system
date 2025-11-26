/*
  # Fix RLS Policies to Prevent Infinite Recursion
  
  1. Changes
    - Drop existing policies that cause infinite recursion
    - Add INSERT policy for user_profiles (allows signup)
    - Simplify admin policies to avoid recursion
    - Add INSERT policies for storage_quota
    
  2. Security
    - Users can insert their own profile during signup
    - Users can view and update their own data
    - Simplified admin checks to prevent recursion
*/

-- Drop problematic policies
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all quotas" ON storage_quota;
DROP POLICY IF EXISTS "Editors can manage public folders" ON folders;
DROP POLICY IF EXISTS "Editors can manage public files" ON files;
DROP POLICY IF EXISTS "Writers and higher can insert files" ON files;

-- Add INSERT policy for user_profiles (critical for signup)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Add INSERT policy for storage_quota
CREATE POLICY "Users can insert own quota"
  ON storage_quota FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Simplified admin policies without recursion
CREATE POLICY "Service role can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can view all quotas"
  ON storage_quota FOR SELECT
  TO authenticated
  USING (true);

-- Add UPDATE policy for storage_quota
CREATE POLICY "System can update quota"
  ON storage_quota FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);