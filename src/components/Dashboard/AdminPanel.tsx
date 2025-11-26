import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { Users, HardDrive, FileText, Database, Trash2, Edit2, X, Save } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'reader' | 'writer' | 'editor' | 'admin';
  created_at: string;
}

interface StorageStats {
  totalUsers: number;
  totalFiles: number;
  totalFolders: number;
  totalStorage: number;
}

interface Backup {
  id: string;
  user_id: string;
  backup_type: string;
  backup_path: string;
  backup_size_mb: number;
  created_at: string;
}

interface FileWithOwner {
  id: string;
  file_name: string;
  file_size_mb: number;
  file_type: string;
  is_public: boolean;
  created_at: string;
  owner: {
    id: string;
    email: string;
  };
}

export function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [files, setFiles] = useState<FileWithOwner[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'files' | 'backups'>('overview');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editStorageLimit, setEditStorageLimit] = useState<number>(500);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allBackups, allFiles, systemStats] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllBackups(),
        adminService.getAllFilesWithUsers(),
        adminService.getSystemStats(),
      ]);
      setUsers(allUsers || []);
      setBackups(allBackups || []);
      setFiles(allFiles || []);
      setStats(systemStats);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      loadData();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userEmail}"? This will permanently delete all their files and folders.`)) return;
    try {
      await adminService.deleteUser(userId);
      alert('User deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditEmail(user.email);
    const userProfile = users.find(u => u.id === user.id);
    setEditStorageLimit(500);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditEmail('');
    setEditStorageLimit(500);
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      await adminService.updateUserEmail(userId, editEmail);
      await adminService.updateStorageLimit(userId, editStorageLimit);
      alert('User updated successfully');
      setEditingUserId(null);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!window.confirm('Are you sure you want to delete this backup?')) return;
    try {
      await adminService.deleteBackup(backupId);
      loadData();
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200">
        {(['overview', 'users', 'files', 'backups'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              selectedTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Files</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats.totalFiles}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Folders</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats.totalFolders}
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Storage</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">
                      {stats.totalStorage.toFixed(2)} MB
                    </p>
                  </div>
                  <HardDrive className="w-8 h-8 text-red-600 opacity-50" />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {selectedTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Storage Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-800">
                      {editingUserId === user.id ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        disabled={editingUserId === user.id}
                        className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="reader">Reader</option>
                        <option value="writer">Writer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editStorageLimit}
                            onChange={(e) => setEditStorageLimit(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 w-20"
                          />
                          <span>MB</span>
                        </div>
                      ) : (
                        '500 MB'
                      )}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSaveEdit(user.id)}
                            className="text-green-600 hover:text-green-800 flex items-center gap-1"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'files' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Visibility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-800">{file.file_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{file.owner.email}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {file.file_size_mb.toFixed(2)} MB
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">{file.file_type}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        file.is_public
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {file.is_public ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {files.length === 0 && (
            <div className="p-8 text-center text-gray-500">No files found</div>
          )}
        </div>
      )}

      {selectedTab === 'backups' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-800">{backup.backup_type}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 truncate max-w-xs">{backup.backup_path}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {backup.backup_size_mb?.toFixed(2) || 0} MB
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(backup.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {backups.length === 0 && (
            <div className="p-8 text-center text-gray-500">No backups found</div>
          )}
        </div>
      )}
    </div>
  );
}
