import { supabase } from '../lib/supabase';

export const monitoringService = {
  async getSystemMetrics() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_system_metrics`;
    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
      throw new Error('Failed to fetch system metrics');
    }

    return await response.json();
  },

  async getSystemLogs(limit = 100) {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getUserLogs(limit = 50) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getStorageMetrics() {
    const { data, error } = await supabase
      .from('storage_quota')
      .select('*')
      .order('used_mb', { ascending: false });

    if (error) throw error;
    return data;
  },
};
