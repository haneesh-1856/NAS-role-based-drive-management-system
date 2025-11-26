import React, { useEffect, useState } from 'react';
import { DriveView } from '../../pages/Drive';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import { FileGrid } from './FileGrid';
import { Breadcrumbs } from './Breadcrumbs';
import { UploadButton } from './UploadButton';
import { CreateFolderButton } from './CreateFolderButton';
import { useAuth } from '../../contexts/AuthContext';

interface DriveContentProps {
  view: DriveView;
  folderId: string | null;
  onFolderChange: (id: string | null) => void;
  searchTerm: string;
}

export function DriveContent({
  view,
  folderId,
  onFolderChange,
  searchTerm,
}: DriveContentProps) {
  const { profile } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContent();
  }, [view, folderId, searchTerm]);

  useEffect(() => {
    if (folderId && view === 'my-drive') {
      loadBreadcrumbs();
    } else {
      setBreadcrumbs([]);
    }
  }, [folderId, view]);

  const loadBreadcrumbs = async () => {
    if (!folderId) return;
    try {
      const crumbs = await folderService.getBreadcrumbs(folderId);
      setBreadcrumbs(crumbs);
    } catch (error) {
      console.error('Error loading breadcrumbs:', error);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    setError('');
    try {
      if (searchTerm) {
        const searchResults = await fileService.searchFiles(searchTerm);
        setFiles(searchResults);
        setFolders([]);
      } else {
        switch (view) {
          case 'my-drive':
            const [myFiles, myFolders] = await Promise.all([
              fileService.getUserFiles(folderId),
              folderService.getUserFolders(folderId),
            ]);
            setFiles(myFiles);
            setFolders(myFolders);
            break;

          case 'recent':
            const recentFiles = await fileService.getRecentFiles();
            setFiles(recentFiles);
            setFolders([]);
            break;

          case 'starred':
            const [starredFiles, starredFolders] = await Promise.all([
              fileService.getStarredFiles(),
              folderService.getStarredFolders(),
            ]);
            setFiles(starredFiles);
            setFolders(starredFolders);
            break;

          case 'trash':
            const [trashedFiles, trashedFolders] = await Promise.all([
              fileService.getTrashedFiles(),
              folderService.getTrashedFolders(),
            ]);
            setFiles(trashedFiles);
            setFolders(trashedFolders);
            break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading content');
      console.error('Error loading content:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (id: string) => {
    if (view === 'my-drive' && !searchTerm) {
      onFolderChange(id);
    }
  };

  const canUpload = profile?.role !== 'reader' && view === 'my-drive' && !searchTerm;

  const getViewTitle = () => {
    if (searchTerm) return `Search results for "${searchTerm}"`;
    switch (view) {
      case 'my-drive':
        return 'My Drive';
      case 'recent':
        return 'Recent';
      case 'starred':
        return 'Starred';
      case 'trash':
        return 'Trash';
      default:
        return '';
    }
  };

  return (
    <div className="p-6">
      {view === 'my-drive' && folderId && breadcrumbs.length > 0 && (
        <Breadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigate={onFolderChange}
          onHome={() => onFolderChange(null)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{getViewTitle()}</h2>
        {canUpload && (
          <div className="flex gap-2">
            <CreateFolderButton
              parentId={folderId}
              onCreated={loadContent}
            />
            <UploadButton
              folderId={folderId}
              onUploaded={loadContent}
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <FileGrid
          files={files}
          folders={folders}
          onFolderClick={handleFolderClick}
          onRefresh={loadContent}
          view={view}
        />
      )}
    </div>
  );
}
