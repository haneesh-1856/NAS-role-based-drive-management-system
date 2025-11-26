import { supabase } from '../lib/supabase';

export const fileService = {
  async uploadFile(file: File, folderId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from('files')
      .insert({
        owner_id: user.id,
        folder_id: folderId || null,
        file_name: file.name,
        file_size_mb: file.size / (1024 * 1024),
        file_type: file.type || 'application/octet-stream',
        mime_type: file.type || 'application/octet-stream',
        storage_path: filePath,
        is_public: false,
        starred: false,
        trashed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async downloadFile(fileId: string) {
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('storage_path, file_name')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    await supabase
      .from('files')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', fileId);

    const { data, error } = await supabase.storage
      .from('files')
      .download(fileData.storage_path);

    if (error) throw error;
    return { data, fileName: fileData.file_name };
  },

  async deleteFile(fileId: string) {
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (fileError) throw fileError;

    await supabase.storage.from('files').remove([fileData.storage_path]);

    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
  },

  async getUserFiles(folderId?: string | null) {
    let query = supabase
      .from('files')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .eq('trashed', false);

    if (folderId === null) {
      query = query.is('folder_id', null);
    } else if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPublicFiles() {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .eq('is_public', true)
      .eq('trashed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getStarredFiles() {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .eq('starred', true)
      .eq('trashed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getRecentFiles(limit = 20) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .eq('trashed', false)
      .order('last_accessed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async getTrashedFiles() {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('trashed', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getSharedFiles() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: sharedItems, error: shareError } = await supabase
      .from('shared_items')
      .select('item_id, permission')
      .eq('item_type', 'file')
      .eq('shared_with', user.id);

    if (shareError) throw shareError;

    if (!sharedItems || sharedItems.length === 0) return [];

    const fileIds = sharedItems.map(item => item.item_id);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .in('id', fileIds)
      .eq('trashed', false);

    if (error) throw error;
    return data;
  },

  async searchFiles(searchTerm: string) {
    const { data, error } = await supabase
      .from('files')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .ilike('file_name', `%${searchTerm}%`)
      .eq('trashed', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async toggleFilePublicity(fileId: string, isPublic: boolean) {
    const { data, error } = await supabase
      .from('files')
      .update({ is_public: isPublic })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleStar(fileId: string, starred: boolean) {
    const { data, error } = await supabase
      .from('files')
      .update({ starred })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async moveToTrash(fileId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ trashed: true, updated_at: new Date().toISOString() })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async restoreFromTrash(fileId: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ trashed: false, updated_at: new Date().toISOString() })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async moveFile(fileId: string, folderId: string | null) {
    const { data, error } = await supabase
      .from('files')
      .update({ folder_id: folderId })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async renameFile(fileId: string, newName: string) {
    const { data, error } = await supabase
      .from('files')
      .update({ file_name: newName })
      .eq('id', fileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async shareFile(fileId: string, userEmail: string, permission: 'viewer' | 'commenter' | 'editor') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) throw new Error('User not found');

    const { data, error } = await supabase
      .from('shared_items')
      .insert({
        item_type: 'file',
        item_id: fileId,
        shared_by: user.id,
        shared_with: targetUser.id,
        permission,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFileShares(fileId: string) {
    const { data, error } = await supabase
      .from('shared_items')
      .select(`
        *,
        user_profiles!shared_items_shared_with_fkey(email)
      `)
      .eq('item_type', 'file')
      .eq('item_id', fileId);

    if (error) throw error;
    return data;
  },

  async removeShare(shareId: string) {
    const { error } = await supabase
      .from('shared_items')
      .delete()
      .eq('id', shareId);

    if (error) throw error;
  },

  async getStorageQuota() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('storage_quota')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
