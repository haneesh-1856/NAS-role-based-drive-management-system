import { supabase } from '../lib/supabase';

export const adminService = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateUserRole(userId: string, role: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStorageLimit(userId: string, storageLimit: number) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ storage_limit_mb: storageLimit })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateUserEmail(userId: string, email: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ email })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    const { error: filesError } = await supabase
      .from('files')
      .delete()
      .eq('owner_id', userId);

    if (filesError) throw filesError;

    const { error: foldersError } = await supabase
      .from('folders')
      .delete()
      .eq('owner_id', userId);

    if (foldersError) throw foldersError;

    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) throw authError;
  },

  async getAllBackups() {
    const { data, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async deleteBackup(backupId: string) {
    const { error } = await supabase
      .from('backups')
      .delete()
      .eq('id', backupId);

    if (error) throw error;
  },

  async getSystemStats() {
    const [usersResult, filesResult, foldersResult, storageResult] = await Promise.all([
      supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('files').select('id', { count: 'exact', head: true }),
      supabase.from('folders').select('id', { count: 'exact', head: true }),
      supabase.from('storage_quota').select('used_mb'),
    ]);

    const totalStorage = storageResult.data?.reduce((sum, item) => sum + Number(item.used_mb), 0) || 0;

    return {
      totalUsers: usersResult.count || 0,
      totalFiles: filesResult.count || 0,
      totalFolders: foldersResult.count || 0,
      totalStorage,
    };
  },

  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getUserAuditLogs(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getAllFilesWithUsers() {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
