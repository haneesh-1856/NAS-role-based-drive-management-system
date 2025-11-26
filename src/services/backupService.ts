import { supabase } from '../lib/supabase';

export const backupService = {
  async createBackup(backupName: string) {
    const { data, error } = await supabase.rpc('create_user_backup', {
      backup_name_param: backupName,
    });

    if (error) throw error;
    return data;
  },

  async getLatestBackup() {
    const { data, error } = await supabase.rpc('get_latest_user_backup');

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  },

  async getAllBackups() {
    const { data, error } = await supabase
      .from('user_backups')
      .select('id, backup_name, file_count, folder_count, total_size_mb, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async restoreBackup(backupId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/restore_backup`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ backupId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to restore backup');
    }

    return await response.json();
  },

  async deleteBackup(backupId: string) {
    const { error } = await supabase
      .from('user_backups')
      .delete()
      .eq('id', backupId);

    if (error) throw error;
  },
};
