import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          role: 'reader' | 'writer' | 'editor' | 'admin';
          storage_limit_mb: number;
          created_at: string;
          updated_at: string;
        };
      };
      storage_quota: {
        Row: {
          id: string;
          user_id: string;
          used_mb: number;
          limit_mb: number;
          created_at: string;
          updated_at: string;
        };
      };
      folders: {
        Row: {
          id: string;
          owner_id: string;
          parent_id: string | null;
          folder_name: string;
          is_public: boolean;
          starred: boolean;
          trashed: boolean;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      files: {
        Row: {
          id: string;
          owner_id: string;
          folder_id: string | null;
          file_name: string;
          file_size_mb: number;
          file_type: string;
          is_public: boolean;
          storage_path: string;
          starred: boolean;
          trashed: boolean;
          mime_type: string;
          last_accessed_at: string;
          created_at: string;
          updated_at: string;
        };
      };
      shared_items: {
        Row: {
          id: string;
          item_type: 'file' | 'folder';
          item_id: string;
          shared_by: string;
          shared_with: string;
          permission: 'viewer' | 'commenter' | 'editor';
          created_at: string;
        };
      };
      backups: {
        Row: {
          id: string;
          file_id: string | null;
          folder_id: string | null;
          user_id: string;
          backup_type: string;
          backup_path: string;
          backup_size_mb: number | null;
          created_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          details: Record<string, any> | null;
          created_at: string;
        };
      };
    };
  };
};
