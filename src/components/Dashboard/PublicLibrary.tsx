import React, { useEffect, useState } from 'react';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import { useAuth } from '../../contexts/AuthContext';
import { FileUp, Folder, Download } from 'lucide-react';

interface File {
  id: string;
  file_name: string;
  file_size_mb: number;
  created_at: string;
  owner_id?: string;
  owner?: {
    id: string;
    email: string;
  };
}

interface FolderItem {
  id: string;
  folder_name: string;
  created_at: string;
  owner_id?: string;
  owner?: {
    id: string;
    email: string;
  };
}

export function PublicLibrary() {
  const [files, setFiles] = useState<File[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    setLoading(true);
    try {
      const [publicFiles, publicFolders] = await Promise.all([
        fileService.getPublicFiles(),
        folderService.getPublicFolders(),
      ]);
      setFiles(publicFiles || []);
      setFolders(publicFolders || []);
    } catch (error) {
      console.error('Error loading public data:', error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFolders = folders.filter((fo) =>
    fo.folder_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading public library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Public Library</h2>
        <input
          type="text"
          placeholder="Search public files and folders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredFolders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Public Folders ({filteredFolders.length})
            </h3>
            <div className="space-y-2">
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Folder className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{folder.folder_name}</p>
                      {folder.owner && (
                        <p className="text-xs text-gray-500">by {folder.owner.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredFiles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Public Files ({filteredFiles.length})
            </h3>
            <div className="space-y-2">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{file.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{file.file_size_mb.toFixed(2)} MB</span>
                      {file.owner && (
                        <>
                          <span>•</span>
                          <span>by {file.owner.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadFile(file.id, file.file_name)}
                    className="p-2 hover:bg-gray-200 rounded transition flex-shrink-0 ml-2"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredFiles.length === 0 && filteredFolders.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? 'No matching public files or folders' : 'No public files or folders yet'}
          </p>
        </div>
      )}
    </div>
  );
}
