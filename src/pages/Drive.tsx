import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DriveContent } from '../components/Drive/DriveContent';
import { TopBar } from '../components/Drive/TopBar';
import { BackupDialog } from '../components/Drive/BackupDialog';
import { storageService } from '../services/storageService';
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  Cloud,
} from 'lucide-react';

export type DriveView = 'my-drive' | 'recent' | 'starred' | 'trash';

export function Drive() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<DriveView>('my-drive');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [storage, setStorage] = useState({ used: 0, limit: 500 });

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    try {
      const data = await storageService.getStorageUsage();
      setStorage(data);
    } catch (error) {
      console.error('Error loading storage:', error);
    }
  };

  const navItems: Array<{
    view: DriveView;
    icon: React.ReactNode;
    label: string;
    color: string;
  }> = [
    { view: 'my-drive', icon: <HardDrive className="w-5 h-5" />, label: 'My Files', color: 'bg-teal-500' },
    { view: 'recent', icon: <Clock className="w-5 h-5" />, label: 'Recent', color: 'bg-orange-500' },
    { view: 'starred', icon: <Star className="w-5 h-5" />, label: 'Favorites', color: 'bg-amber-500' },
    { view: 'trash', icon: <Trash2 className="w-5 h-5" />, label: 'Bin', color: 'bg-gray-500' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <TopBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        currentView={currentView}
        onBackupClick={() => setShowBackupDialog(true)}
        onAdminClick={() => navigate('/admin')}
      />

      <nav className="px-8 pt-6 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setCurrentView(item.view);
                  setCurrentFolderId(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  currentView === item.view
                    ? `${item.color} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <Cloud className="w-5 h-5 text-teal-600" />
            <div className="text-right">
              <div className="text-xs text-gray-500">Storage Used</div>
              <div className="text-sm font-semibold text-gray-900">
                {storage.used.toFixed(2)} / {storage.limit} MB
              </div>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (storage.used / storage.limit) * 100 > 80 ? 'bg-red-500' : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min((storage.used / storage.limit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto px-8 py-6">
        <DriveContent
          view={currentView}
          folderId={currentFolderId}
          onFolderChange={setCurrentFolderId}
          searchTerm={searchTerm}
        />
      </main>

      {showBackupDialog && (
        <BackupDialog
          onClose={() => setShowBackupDialog(false)}
          onBackupCreated={() => {
            console.log('Backup created successfully');
          }}
        />
      )}
    </div>
  );
}
