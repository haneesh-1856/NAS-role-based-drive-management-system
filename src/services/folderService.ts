import { supabase } from '../lib/supabase';

export const folderService = {
  async createFolder(name: string, parentId?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('folders')
      .insert({
        owner_id: user.id,
        parent_id: parentId || null,
        folder_name: name,
        is_public: false,
        starred: false,
        trashed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async renameFolder(folderId: string, name: string) {
    const { data, error } = await supabase
      .from('folders')
      .update({ folder_name: name })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteFolder(folderId: string) {
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (error) throw error;
  },

  async getUserFolders(parentId?: string | null) {
    let query = supabase
      .from('folders')
      .select(`
        *,
        owner:user_profiles!owner_id (
          id,
          email
        )
      `)
      .eq('trashed', false);

    if (parentId === null) {
      query = query.is('parent_id', null);
    } else if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getPublicFolders() {
    const { data, error } = await supabase
      .from('folders')
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

  async getStarredFolders() {
    const { data, error } = await supabase
      .from('folders')
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

  async getTrashedFolders() {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('trashed', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getSharedFolders() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: sharedItems, error: shareError } = await supabase
      .from('shared_items')
      .select('item_id, permission')
      .eq('item_type', 'folder')
      .eq('shared_with', user.id);

    if (shareError) throw shareError;

    if (!sharedItems || sharedItems.length === 0) return [];

    const folderIds = sharedItems.map(item => item.item_id);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .in('id', folderIds)
      .eq('trashed', false);

    if (error) throw error;
    return data;
  },

  async getFolderContents(folderId: string) {
    const [foldersResult, filesResult] = await Promise.all([
      supabase
        .from('folders')
        .select('*')
        .eq('parent_id', folderId)
        .eq('trashed', false),
      supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .eq('trashed', false),
    ]);

    if (foldersResult.error) throw foldersResult.error;
    if (filesResult.error) throw filesResult.error;

    return {
      folders: foldersResult.data,
      files: filesResult.data,
    };
  },

  async toggleFolderPublicity(folderId: string, isPublic: boolean) {
    const { data, error } = await supabase
      .from('folders')
      .update({ is_public: isPublic })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async toggleStar(folderId: string, starred: boolean) {
    const { data, error } = await supabase
      .from('folders')
      .update({ starred })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async moveToTrash(folderId: string) {
    const { data, error } = await supabase
      .from('folders')
      .update({ trashed: true, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async restoreFromTrash(folderId: string) {
    const { data, error } = await supabase
      .from('folders')
      .update({ trashed: false, updated_at: new Date().toISOString() })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async moveFolder(folderId: string, parentId: string | null) {
    const { data, error } = await supabase
      .from('folders')
      .update({ parent_id: parentId })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async setFolderColor(folderId: string, color: string | null) {
    const { data, error } = await supabase
      .from('folders')
      .update({ color })
      .eq('id', folderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async shareFolder(folderId: string, userEmail: string, permission: 'viewer' | 'commenter' | 'editor') {
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
        item_type: 'folder',
        item_id: folderId,
        shared_by: user.id,
        shared_with: targetUser.id,
        permission,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFolderShares(folderId: string) {
    const { data, error } = await supabase
      .from('shared_items')
      .select(`
        *,
        user_profiles!shared_items_shared_with_fkey(email)
      `)
      .eq('item_type', 'folder')
      .eq('item_id', folderId);

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

  async getBreadcrumbs(folderId: string) {
    const breadcrumbs: Array<{ id: string; name: string }> = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const { data, error } = await supabase
        .from('folders')
        .select('id, folder_name, parent_id')
        .eq('id', currentId)
        .single();

      if (error || !data) break;

      breadcrumbs.unshift({ id: data.id, name: data.folder_name });
      currentId = data.parent_id;
    }

    return breadcrumbs;
  },
};
