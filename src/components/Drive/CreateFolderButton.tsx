import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { folderService } from '../../services/folderService';

interface CreateFolderButtonProps {
  parentId: string | null;
  onCreated: () => void;
}

export function CreateFolderButton({ parentId, onCreated }: CreateFolderButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setCreating(true);
    try {
      await folderService.createFolder(folderName, parentId || undefined);
      setFolderName('');
      setShowDialog(false);
      onCreated();
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
      >
        <FolderPlus className="w-4 h-4" />
        New Folder
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Folder</h3>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Folder name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                autoFocus
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDialog(false);
                    setFolderName('');
                  }}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!folderName.trim() || creating}
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
