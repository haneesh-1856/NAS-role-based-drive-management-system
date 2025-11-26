import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import { Folder, Trash2, Eye, EyeOff, FolderPlus, Download } from 'lucide-react';

interface File {
  id: string;
  file_name: string;
  file_size_mb: number;
  is_public: boolean;
  created_at: string;
}

interface FolderItem {
  id: string;
  folder_name: string;
  is_public: boolean;
  created_at: string;
}

interface StorageStats {
  used_mb: number;
  limit_mb: number;
}

export function FileManager() {
  const { user, profile } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [userFiles, userFolders, userStats] = await Promise.all([
        fileService.getUserFiles(),
        folderService.getUserFolders(),
        fileService.getStorageQuota(),
      ]);
      setFiles(userFiles || []);
      setFolders(userFolders || []);
      setStats(userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      await fileService.uploadFile(file);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading file');
      console.error('Error uploading file:', err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    setError('');
    try {
      await folderService.createFolder(newFolderName);
      setNewFolderName('');
      setShowNewFolder(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating folder');
      console.error('Error creating folder:', err);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await fileService.deleteFile(fileId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting file');
      console.error('Error deleting file:', err);
    }
  };

  const handleTogglePublicity = async (
    id: string,
    isPublic: boolean,
    resourceType: 'file' | 'folder'
  ) => {
    try {
      if (resourceType === 'file') {
        await fileService.toggleFilePublicity(id, !isPublic);
      } else {
        await folderService.toggleFolderPublicity(id, !isPublic);
      }
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating');
      console.error('Error toggling publicity:', err);
    }
  };

  const handleDownloadFile = async (fileId: string, fileName: string) => {
    try {
      const { data, fileName: originalName } = await fileService.downloadFile(fileId);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error downloading file');
      console.error('Error downloading file:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    );
  }

  const percentageUsed = stats ? (stats.used_mb / stats.limit_mb) * 100 : 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Storage Overview</h2>
        {stats && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Storage Used</span>
              <span>{percentageUsed.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  percentageUsed > 80
                    ? 'bg-red-500'
                    : percentageUsed > 50
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentageUsed, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Used</p>
                <p className="text-lg font-semibold text-blue-600">{stats.used_mb.toFixed(2)} MB</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Available</p>
                <p className="text-lg font-semibold text-green-600">{(stats.limit_mb - stats.used_mb).toFixed(2)} MB</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Limit</p>
                <p className="text-lg font-semibold text-gray-600">{stats.limit_mb} MB</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {(profile?.role === 'writer' || profile?.role === 'editor' || profile?.role === 'admin') && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Upload File</h3>
          <input
            type="file"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
      )}

      {(profile?.role === 'writer' || profile?.role === 'editor' || profile?.role === 'admin') && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Create Folder</h3>
            <button
              onClick={() => setShowNewFolder(!showNewFolder)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
          </div>
          {showNewFolder && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Create
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {folders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Folders</h3>
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-800">{folder.folder_name}</span>
                  </div>
                  {profile?.role !== 'reader' && (
                    <button
                      onClick={() => handleTogglePublicity(folder.id, folder.is_public, 'folder')}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title={folder.is_public ? 'Make private' : 'Make public'}
                    >
                      {folder.is_public ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {files.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Files</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {file.file_size_mb.toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadFile(file.id, file.file_name)}
                      className="p-2 hover:bg-gray-200 rounded transition"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-blue-600" />
                    </button>
                    {profile?.role !== 'reader' && (
                      <>
                        <button
                          onClick={() => handleTogglePublicity(file.id, file.is_public, 'file')}
                          className="p-2 hover:bg-gray-200 rounded transition"
                          title={file.is_public ? 'Make private' : 'Make public'}
                        >
                          {file.is_public ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-2 hover:bg-red-100 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {files.length === 0 && folders.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No files or folders yet</p>
        </div>
      )}
    </div>
  );
}
