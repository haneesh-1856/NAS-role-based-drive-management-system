import React from 'react';
import { Search, LogOut, Cloud, Database, Settings, Shield, Activity } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  currentView: string;
  onBackupClick: () => void;
  onAdminClick?: () => void;
}

export function TopBar({ searchTerm, onSearchChange, currentView, onBackupClick, onAdminClick }: TopBarProps) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-8 py-4 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-teal-500 p-2.5 rounded-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FileVault</h1>
            <p className="text-xs text-gray-500">Storage</p>
          </div>
        </div>

        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && onAdminClick && (
            <button
              onClick={onAdminClick}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Admin</span>
            </button>
          )}
          <button
            onClick={onBackupClick}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Backup</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
              </div>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-12 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[240px]">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/monitoring');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Activity className="w-4 h-4" />
                    System Monitoring
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
