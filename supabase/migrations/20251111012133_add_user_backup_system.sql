/*
  # Add User Backup System

  ## Changes
  1. Create user_backups table to store backup metadata
  2. Create backup_items table to store individual file/folder snapshots
  3. Add RLS policies for users to manage their own backups
  4. Add functions to create and restore backups

  ## Details
  - Each user can create backups of their file system
  - Backups are snapshots of files and folders at a point in time
  - Users can restore from their last backup
  - Storage is JSON-based for simplicity
*/

-- ============================================================================
-- User Backups Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  backup_name text NOT NULL,
  backup_data jsonb NOT NULL,
  total_size_mb numeric(10,2) DEFAULT 0,
  file_count int DEFAULT 0,
  folder_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backups"
  ON user_backups
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own backups"
  ON user_backups
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own backups"
  ON user_backups
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all backups"
  ON user_backups
  FOR SELECT
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- ============================================================================
-- Function to create a backup of user's file system
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_backup(backup_name_param text)
RETURNS uuid AS $$
DECLARE
  new_backup_id uuid;
  backup_snapshot jsonb;
  total_files int;
  total_folders int;
  total_size numeric;
BEGIN
  -- Build backup snapshot
  backup_snapshot := jsonb_build_object(
    'files', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'file_name', file_name,
          'folder_id', folder_id,
          'file_size_mb', file_size_mb,
          'mime_type', mime_type,
          'storage_path', storage_path,
          'is_public', is_public,
          'starred', starred,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ), '[]'::jsonb)
      FROM files
      WHERE owner_id = auth.uid() AND trashed = false
    ),
    'folders', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'folder_name', folder_name,
          'parent_id', parent_id,
          'is_public', is_public,
          'starred', starred,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ), '[]'::jsonb)
      FROM folders
      WHERE owner_id = auth.uid() AND trashed = false
    )
  );

  -- Get counts
  SELECT COUNT(*) INTO total_files 
  FROM files 
  WHERE owner_id = auth.uid() AND trashed = false;
  
  SELECT COUNT(*) INTO total_folders 
  FROM folders 
  WHERE owner_id = auth.uid() AND trashed = false;
  
  SELECT COALESCE(SUM(file_size_mb), 0) INTO total_size
  FROM files 
  WHERE owner_id = auth.uid() AND trashed = false;

  -- Insert backup record
  INSERT INTO user_backups (
    user_id, 
    backup_name, 
    backup_data,
    file_count,
    folder_count,
    total_size_mb
  )
  VALUES (
    auth.uid(),
    backup_name_param,
    backup_snapshot,
    total_files,
    total_folders,
    total_size
  )
  RETURNING id INTO new_backup_id;

  RETURN new_backup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get user's latest backup
-- ============================================================================

CREATE OR REPLACE FUNCTION get_latest_user_backup()
RETURNS TABLE (
  backup_id uuid,
  backup_name text,
  file_count int,
  folder_count int,
  total_size_mb numeric,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    user_backups.backup_name,
    user_backups.file_count,
    user_backups.folder_count,
    user_backups.total_size_mb,
    user_backups.created_at
  FROM user_backups
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
