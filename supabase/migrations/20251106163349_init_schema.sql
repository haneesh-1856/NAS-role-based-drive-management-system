/*
  # File Management System Schema

  1. New Tables
    - `user_roles` - Define available roles (reader, writer, editor, admin)
    - `user_profiles` - User profile information and role assignments
    - `storage_quota` - Per-user storage quotas and usage tracking
    - `folders` - Folder structure with ownership and visibility
    - `files` - File metadata, ownership, and visibility
    - `backups` - Backup records for audit and restore
    - `system_logs` - System activity and monitoring logs
    - `audit_logs` - User activity audit trail

  2. Security
    - Enable RLS on all tables
    - Create policies for reader, writer, editor, admin roles
    - Enforce storage quotas through policies

  3. Key Features
    - Public/private visibility for files and folders
    - Automatic storage quota tracking
    - Backup versioning with timestamps
    - Role-based access control
*/

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO user_roles (role_name, description) VALUES
  ('reader', 'Can only read public data'),
  ('writer', 'Can add new data, view public and own data'),
  ('editor', 'Can manage public data'),
  ('admin', 'Full access to all data and system functions')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'reader' REFERENCES user_roles(role_name),
  storage_limit_mb int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS storage_quota (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
  used_mb numeric(10,2) DEFAULT 0,
  limit_mb int DEFAULT 100,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE storage_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quota"
  ON storage_quota FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all quotas"
  ON storage_quota FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  folder_name text NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own folders"
  ON folders FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Public folders visible to all authenticated users"
  ON folders FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Editors can manage public folders"
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

CREATE POLICY "Owners can insert folders"
  ON folders FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own folders"
  ON folders FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete own folders"
  ON folders FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size_mb numeric(10,2) NOT NULL,
  file_type text NOT NULL,
  is_public boolean DEFAULT false,
  storage_path text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own files"
  ON files FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Public files visible to all authenticated users"
  ON files FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Editors can manage public files"
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

CREATE POLICY "Writers and higher can insert files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('writer', 'editor', 'admin')
  );

CREATE POLICY "Owners can delete own files"
  ON files FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid REFERENCES files(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  backup_type text NOT NULL,
  backup_path text NOT NULL,
  backup_size_mb numeric(10,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view backups"
  ON backups FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type text NOT NULL,
  log_message text NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view system logs"
  ON system_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_backups_user ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_file ON backups(file_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_quota_user ON storage_quota(user_id);
