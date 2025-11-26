import React, { useState } from 'react';
import { X, Edit } from 'lucide-react';
import { fileService } from '../../services/fileService';
import { folderService } from '../../services/folderService';

interface RenameDialogProps {
  item: any;
  type: 'file' | 'folder';
  onClose: () => void;
  onRenamed: () => void;
}

export function RenameDialog({ item, type, onClose, onRenamed }: RenameDialogProps) {
  const [name, setName] = useState(type === 'file' ? item.file_name : item.folder_name);
  const [renaming, setRenaming] = useState(false);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setRenaming(true);
    try {
      if (type === 'file') {
        await fileService.renameFile(item.id, name);
      } else {
        await folderService.renameFolder(item.id, name);
      }
      onRenamed();
      onClose();
    } catch (error) {
      console.error('Error renaming:', error);
      alert('Failed to rename');
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Rename</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleRename}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || renaming}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition"
            >
              {renaming ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
