/*
  # Fix Backup Function to Include file_type

  ## Changes
  1. Update backup function to include file_type column which is required
  
  ## Details
  - Adds file_type to the backup snapshot
  - Ensures all required columns are captured
*/

CREATE OR REPLACE FUNCTION create_user_backup(backup_name_param text)
RETURNS uuid AS $$
DECLARE
  new_backup_id uuid;
  backup_snapshot jsonb;
  total_files int;
  total_folders int;
  total_size numeric;
BEGIN
  -- Build backup snapshot including ALL files (even trashed)
  backup_snapshot := jsonb_build_object(
    'files', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'file_name', file_name,
          'folder_id', folder_id,
          'file_size_mb', file_size_mb,
          'file_type', file_type,
          'mime_type', mime_type,
          'storage_path', storage_path,
          'is_public', is_public,
          'starred', starred,
          'trashed', trashed,
          'created_at', created_at,
          'updated_at', updated_at,
          'last_accessed_at', last_accessed_at
        )
      ), '[]'::jsonb)
      FROM files
      WHERE owner_id = auth.uid()
    ),
    'folders', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'folder_name', folder_name,
          'parent_id', parent_id,
          'is_public', is_public,
          'starred', starred,
          'trashed', trashed,
          'created_at', created_at,
          'updated_at', updated_at
        )
      ), '[]'::jsonb)
      FROM folders
      WHERE owner_id = auth.uid()
    )
  );

  -- Get counts (only active items)
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
