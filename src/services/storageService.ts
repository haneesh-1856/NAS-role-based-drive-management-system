import { supabase } from '../lib/supabase';

export const storageService = {
  async getStorageUsage() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('get_user_storage_usage', {
      user_id: user.id,
    });

    if (error) throw error;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('storage_limit_mb')
      .eq('id', user.id)
      .single();

    return {
      used: Number(data) || 0,
      limit: profile?.storage_limit_mb || 500,
    };
  },

  async checkStorageAvailable(fileSizeMb: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('check_user_storage_available', {
      user_id: user.id,
      file_size: fileSizeMb,
    });

    if (error) throw error;
    return data as boolean;
  },
};
