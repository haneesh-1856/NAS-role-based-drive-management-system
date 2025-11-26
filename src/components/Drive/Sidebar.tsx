import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  HardDrive,
  Users,
  Clock,
  Star,
  Trash2,
  Plus,
  Cloud,
} from 'lucide-react';
import { DriveView } from '../../pages/Drive';
import { storageService } from '../../services/storageService';

interface SidebarProps {
  currentView: DriveView;
  onViewChange: (view: DriveView) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, profile, logout } = useAuth();
  const [stats, setStats] = React.useState<{ used: number; limit: number } | null>(null);

  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await storageService.getStorageUsage();
      setStats(data);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const navItems: Array<{
    view: DriveView;
    icon: React.ReactNode;
    label: string;
  }> = [
    { view: 'my-drive', icon: <HardDrive className="w-5 h-5" />, label: 'My Drive' },
    { view: 'shared', icon: <Users className="w-5 h-5" />, label: 'Shared with me' },
    { view: 'recent', icon: <Clock className="w-5 h-5" />, label: 'Recent' },
    { view: 'starred', icon: <Star className="w-5 h-5" />, label: 'Starred' },
    { view: 'trash', icon: <Trash2 className="w-5 h-5" />, label: 'Trash' },
  ];

  const percentageUsed = stats ? (stats.used / stats.limit) * 100 : 0;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col py-2">
      <div className="px-3 mb-4">
        <button className="w-full flex items-center gap-4 px-6 py-3 bg-white hover:bg-gray-50 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-200">
          <Plus className="w-6 h-6 text-gray-700" />
          <span className="text-[15px] font-medium text-gray-700">New</span>
        </button>
      </div>

      <nav className="flex-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onViewChange(item.view)}
            className={`w-full flex items-center gap-4 px-6 py-3 rounded-full text-[14px] font-medium transition-colors ${
              currentView === item.view
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {stats && (
        <div className="px-5 py-4 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-gray-600" />
            <span className="text-[13px] text-gray-600 font-medium">Storage</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden mb-2">
            <div
              className={`h-full transition-all ${
                percentageUsed > 90
                  ? 'bg-red-500'
                  : percentageUsed > 75
                    ? 'bg-yellow-500'
                    : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
          <p className="text-[12px] text-gray-600">
            {stats.used.toFixed(2)} MB of {stats.limit} MB used
          </p>
        </div>
      )}
    </aside>
  );
}
