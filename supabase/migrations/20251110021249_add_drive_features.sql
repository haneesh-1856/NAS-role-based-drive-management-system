/*
  # Add Google Drive Features
  
  1. New Tables
    - `shared_items` - Track shared files/folders with specific users
    - `starred_items` - User's starred/favorite files and folders
    - `recent_items` - Track recently accessed items
    
  2. Updates to Existing Tables
    - Add `color` to folders for custom folder colors
    - Add `starred`, `trashed`, `mime_type` to files
    - Add `last_accessed_at` for recent files tracking
    
  3. Security
    - RLS policies for shared items
    - Users can only see items shared with them
    - Users can star their own items
*/

-- Add columns to files table
ALTER TABLE files ADD COLUMN IF NOT EXISTS starred boolean DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS trashed boolean DEFAULT false;
ALTER TABLE files ADD COLUMN IF NOT EXISTS mime_type text DEFAULT 'application/octet-stream';
ALTER TABLE files ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz DEFAULT now();

-- Add columns to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS starred boolean DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS trashed boolean DEFAULT false;
ALTER TABLE folders ADD COLUMN IF NOT EXISTS color text DEFAULT NULL;

-- Create shared_items table
CREATE TABLE IF NOT EXISTS shared_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('file', 'folder')),
  item_id uuid NOT NULL,
  shared_by uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('viewer', 'commenter', 'editor')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(item_type, item_id, shared_with)
);

ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items shared with them"
  ON shared_items FOR SELECT
  TO authenticated
  USING (shared_with = auth.uid() OR shared_by = auth.uid());

CREATE POLICY "Users can share their own items"
  ON shared_items FOR INSERT
  TO authenticated
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update share permissions"
  ON shared_items FOR UPDATE
  TO authenticated
  USING (shared_by = auth.uid())
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can revoke shares"
  ON shared_items FOR DELETE
  TO authenticated
  USING (shared_by = auth.uid());

-- Update files policies to include shared files
DROP POLICY IF EXISTS "Public files visible to all authenticated users" ON files;
DROP POLICY IF EXISTS "Owner can view own files" ON files;

CREATE POLICY "Users can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() AND trashed = false
  );

CREATE POLICY "Users can view shared files"
  ON files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.item_type = 'file'
      AND shared_items.item_id = files.id
      AND shared_items.shared_with = auth.uid()
    ) AND trashed = false
  );

CREATE POLICY "Users can view public files"
  ON files FOR SELECT
  TO authenticated
  USING (is_public = true AND trashed = false);

CREATE POLICY "Users can view trashed files"
  ON files FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() AND trashed = true);

-- Update folders policies to include shared folders
DROP POLICY IF EXISTS "Owner can manage own folders" ON folders;
DROP POLICY IF EXISTS "Public folders visible to all authenticated users" ON folders;

CREATE POLICY "Users can view own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() AND trashed = false
  );

CREATE POLICY "Users can view shared folders"
  ON folders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.item_type = 'folder'
      AND shared_items.item_id = folders.id
      AND shared_items.shared_with = auth.uid()
    ) AND trashed = false
  );

CREATE POLICY "Users can view public folders"
  ON folders FOR SELECT
  TO authenticated
  USING (is_public = true AND trashed = false);

CREATE POLICY "Users can view trashed folders"
  ON folders FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() AND trashed = true);

-- Update policies for shared item editors
CREATE POLICY "Shared editors can update files"
  ON files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.item_type = 'file'
      AND shared_items.item_id = files.id
      AND shared_items.shared_with = auth.uid()
      AND shared_items.permission = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shared_items
      WHERE shared_items.item_type = 'file'
      AND shared_items.item_id = files.id
      AND shared_items.shared_with = auth.uid()
      AND shared_items.permission = 'editor'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_items_shared_with ON shared_items(shared_with);
CREATE INDEX IF NOT EXISTS idx_shared_items_item ON shared_items(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_files_starred ON files(owner_id, starred) WHERE starred = true;
CREATE INDEX IF NOT EXISTS idx_files_trashed ON files(owner_id, trashed) WHERE trashed = true;
CREATE INDEX IF NOT EXISTS idx_files_last_accessed ON files(owner_id, last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_folders_starred ON folders(owner_id, starred) WHERE starred = true;
CREATE INDEX IF NOT EXISTS idx_folders_trashed ON folders(owner_id, trashed) WHERE trashed = true;