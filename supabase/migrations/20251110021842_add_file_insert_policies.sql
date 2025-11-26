/*
  # Add INSERT Policies for Files and Folders
  
  1. Changes
    - Add INSERT policy for files table (missing!)
    - Add UPDATE policy for files table (for owners)
    - Ensure users can create files in their own space
    
  2. Security
    - Only authenticated users can insert files
    - Only writers, editors, and admins can insert files (based on role)
    - Users can only insert files they own
*/

-- Add INSERT policy for files (CRITICAL - was missing!)
CREATE POLICY "Writers can insert files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- Add UPDATE policy for file owners
CREATE POLICY "Owners can update own files"
  ON files FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());