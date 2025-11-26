import { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Trash2, Clock } from 'lucide-react';
import { backupService } from '../../services/backupService';

interface BackupDialogProps {
  onClose: () => void;
  onBackupCreated: () => void;
}

interface Backup {
  id: string;
  backup_id: string;
  backup_name: string;
  file_count: number;
  folder_count: number;
  total_size_mb: number;
  created_at: string;
}

export function BackupDialog({ onClose, onBackupCreated }: BackupDialogProps) {
  const [backupName, setBackupName] = useState('');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(true);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const data = await backupService.getAllBackups();
      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!backupName.trim()) {
      alert('Please enter a backup name');
      return;
    }

    try {
      setLoading(true);
      await backupService.createBackup(backupName.trim());
      setBackupName('');
      await loadBackups();
      onBackupCreated();
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('This will replace your current files and folders with the backup. Continue?')) {
      return;
    }

    try {
      setRestoring(true);
      await backupService.restoreBackup(backupId);
      alert('Backup restored successfully! Please refresh the page to see the changes.');
      onClose();
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    try {
      await backupService.deleteBackup(backupId);
      await loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Failed to delete backup');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Backup & Restore</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Backup</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="Enter backup name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              disabled={loading}
            />
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Backup'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Backups</h3>
          {loadingBackups ? (
            <div className="text-center py-8 text-gray-500">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No backups found</div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-teal-500 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{backup.backup_name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(backup.created_at)}
                      </span>
                      <span>{backup.file_count} files</span>
                      <span>{backup.folder_count} folders</span>
                      <span>{backup.total_size_mb.toFixed(2)} MB</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestoreBackup(backup.id || backup.backup_id)}
                      disabled={restoring}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id || backup.backup_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
