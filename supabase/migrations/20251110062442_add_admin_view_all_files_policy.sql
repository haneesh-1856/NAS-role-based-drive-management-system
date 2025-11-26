/*
  # Add Admin Policy to View All Files

  1. Security Changes
    - Add RLS policy allowing admins to view all files from all users
    - This enables the admin panel to display a comprehensive list of all files with owner information

  2. Policy Details
    - Checks if the current user has 'admin' role in user_profiles table
    - Grants SELECT permission on all files table records
    - Does not modify existing policies for regular users
*/

CREATE POLICY "Admin can view all files"
  ON files FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );
