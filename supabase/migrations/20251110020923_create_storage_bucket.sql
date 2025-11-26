/*
  # Create Storage Bucket for Files
  
  1. New Storage
    - Create 'files' bucket for file uploads
    - Set bucket to private (not public by default)
    
  2. Security
    - Enable RLS on storage.objects
    - Users can upload to their own folder
    - Users can read their own files
    - Users can read public files
    - Users can delete their own files
*/

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for files bucket
CREATE POLICY "Users can upload files to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view public files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM files
      WHERE files.storage_path = storage.objects.name
      AND files.is_public = true
    )
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );