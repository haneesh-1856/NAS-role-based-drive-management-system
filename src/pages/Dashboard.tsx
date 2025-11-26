import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileManager } from '../components/Dashboard/FileManager';
import { PublicLibrary } from '../components/Dashboard/PublicLibrary';
import { AdminPanel } from '../components/Dashboard/AdminPanel';
import { LogOut, Menu, X, BarChart3, FileText, Users } from 'lucide-react';

export function Dashboard() {
  const { user, profile, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'files' | 'public' | 'admin'>('files');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-800">FileVault</h1>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-6">
              <div className="text-sm text-gray-600">
                <p className="font-medium">{user?.email}</p>
                <p className="text-xs uppercase tracking-wider">{profile?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 border-t border-gray-200 pt-4">
              <div className="px-2 py-2 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-800">{user?.email}</p>
                <p className="text-xs uppercase tracking-wider text-gray-600">{profile?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setCurrentView('files')}
            className={`p-4 rounded-lg transition ${
              currentView === 'files'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-800 shadow-md hover:shadow-lg'
            }`}
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">My Files</p>
          </button>

          <button
            onClick={() => setCurrentView('public')}
            className={`p-4 rounded-lg transition ${
              currentView === 'public'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-800 shadow-md hover:shadow-lg'
            }`}
          >
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <p className="font-medium">Public Library</p>
          </button>

          {profile?.role === 'admin' && (
            <button
              onClick={() => setCurrentView('admin')}
              className={`p-4 rounded-lg transition ${
                currentView === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-800 shadow-md hover:shadow-lg'
              }`}
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium">Admin Panel</p>
            </button>
          )}
        </div>

        {currentView === 'files' && <FileManager />}
        {currentView === 'public' && <PublicLibrary />}
        {currentView === 'admin' && profile?.role === 'admin' && <AdminPanel />}
      </div>
    </div>
  );
}
