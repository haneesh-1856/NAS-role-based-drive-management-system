import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Star,
  Trash2,
  Download,
  MoreVertical,
  Edit,
  Globe,
  RotateCcw,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  File,
  FolderOpen,
} from 'lucide-react';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';
import { DriveView } from '../../pages/Drive';
import { RenameDialog } from './RenameDialog';

interface FileGridProps {
  files: any[];
  folders: any[];
  onFolderClick: (id: string) => void;
  onRefresh: () => void;
  view: DriveView;
}

export function FileGrid({ files, folders, onFolderClick, onRefresh, view }: FileGridProps) {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: any;
    type: 'file' | 'folder';
  } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ item: any; type: 'file' | 'folder' } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, item: any, type: 'file' | 'folder') => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleToggleStar = async (item: any, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await fileService.toggleStar(item.id, !item.starred);
      } else {
        await folderService.toggleStar(item.id, !item.starred);
      }
      onRefresh();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
    closeContextMenu();
  };

  const handleTogglePublic = async (item: any, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await fileService.toggleFilePublicity(item.id, !item.is_public);
      } else {
        await folderService.toggleFolderPublicity(item.id, !item.is_public);
      }
      onRefresh();
    } catch (error) {
      console.error('Error toggling publicity:', error);
    }
    closeContextMenu();
  };

  const handleMoveToTrash = async (item: any, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await fileService.moveToTrash(item.id);
      } else {
        await folderService.moveToTrash(item.id);
      }
      onRefresh();
    } catch (error) {
      console.error('Error moving to trash:', error);
    }
    closeContextMenu();
  };

  const handleRestore = async (item: any, type: 'file' | 'folder') => {
    try {
      if (type === 'file') {
        await fileService.restoreFromTrash(item.id);
      } else {
        await folderService.restoreFromTrash(item.id);
      }
      onRefresh();
    } catch (error) {
      console.error('Error restoring:', error);
    }
    closeContextMenu();
  };

  const handleDelete = async (item: any, type: 'file' | 'folder') => {
    if (!window.confirm('Permanently delete this item? This cannot be undone.')) return;

    try {
      if (type === 'file') {
        await fileService.deleteFile(item.id);
      } else {
        await folderService.deleteFolder(item.id);
      }
      onRefresh();
    } catch (error) {
      console.error('Error deleting:', error);
    }
    closeContextMenu();
  };

  const handleDownload = async (file: any) => {
    try {
      const { data, fileName } = await fileService.downloadFile(file.id);
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
    closeContextMenu();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8" />;
    if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json'))
      return <FileCode className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const getFileColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'bg-pink-100 text-pink-600';
    if (mimeType.startsWith('video/')) return 'bg-red-100 text-red-600';
    if (mimeType.startsWith('audio/')) return 'bg-green-100 text-green-600';
    if (mimeType.includes('pdf')) return 'bg-red-100 text-red-600';
    if (mimeType.includes('code') || mimeType.includes('javascript')) return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  const formatFileSize = (mb: number) => {
    if (mb < 0.01) return '< 1 KB';
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isTrashView = view === 'trash';

  if (files.length === 0 && folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <FolderOpen className="w-20 h-20 text-gray-300 mb-4" />
        <p className="text-lg font-semibold text-gray-600">No items to display</p>
        <p className="text-sm text-gray-400 mt-1">Upload files or create folders to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer"
            onClick={() => !isTrashView && onFolderClick(folder.id)}
            onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
          >
            {folder.starred && (
              <div className="absolute top-2 right-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            )}

            <div className="bg-teal-100 p-3 rounded-lg mb-3 inline-block">
              <Folder className="w-8 h-8 text-teal-600" />
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{folder.folder_name}</h3>
            <div className="space-y-0.5">
              <p className="text-xs text-gray-500">{formatDate(folder.created_at)}</p>
              {folder.is_public && folder.owner && (
                <p className="text-xs text-blue-600 truncate">by {folder.owner.email}</p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, folder, 'folder');
              }}
              className="absolute bottom-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ))}

        {files.map((file) => (
          <div
            key={file.id}
            className="group relative bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
            onContextMenu={(e) => handleContextMenu(e, file, 'file')}
          >
            {file.starred && (
              <div className="absolute top-2 right-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            )}

            <div className={`${getFileColor(file.mime_type)} p-3 rounded-lg mb-3 inline-block`}>
              {getFileIcon(file.mime_type)}
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{file.file_name}</h3>
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatFileSize(file.file_size_mb)}</span>
                <span>{formatDate(file.created_at)}</span>
              </div>
              {file.is_public && file.owner && (
                <p className="text-xs text-blue-600 truncate">by {file.owner.email}</p>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, file, 'file');
              }}
              className="absolute bottom-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        ))}
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={closeContextMenu}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {isTrashView ? (
              <>
                <button
                  onClick={() => handleRestore(contextMenu.item, contextMenu.type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => handleDelete(contextMenu.item, contextMenu.type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete forever
                </button>
              </>
            ) : (
              <>
                {contextMenu.type === 'file' && (
                  <button
                    onClick={() => handleDownload(contextMenu.item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
                <button
                  onClick={() => {
                    setRenameDialog({ item: contextMenu.item, type: contextMenu.type });
                    closeContextMenu();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Rename
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => handleToggleStar(contextMenu.item, contextMenu.type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  {contextMenu.item.starred ? 'Remove star' : 'Add star'}
                </button>
                <button
                  onClick={() => handleTogglePublic(contextMenu.item, contextMenu.type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  {contextMenu.item.is_public ? 'Make private' : 'Make public'}
                </button>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => handleMoveToTrash(contextMenu.item, contextMenu.type)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}

      {renameDialog && (
        <RenameDialog
          item={renameDialog.item}
          type={renameDialog.type}
          onClose={() => setRenameDialog(null)}
          onRenamed={onRefresh}
        />
      )}
    </>
  );
}
