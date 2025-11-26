import { useEffect, useState } from 'react';
import { HardDrive } from 'lucide-react';
import { storageService } from '../../services/storageService';

export function StorageIndicator() {
  const [storage, setStorage] = useState({ used: 0, limit: 500 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageUsage();
  }, []);

  const loadStorageUsage = async () => {
    try {
      const data = await storageService.getStorageUsage();
      setStorage(data);
    } catch (error) {
      console.error('Error loading storage usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const percentage = (storage.used / storage.limit) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className="px-4 py-3 border-t border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <HardDrive className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Storage</span>
      </div>

      {loading ? (
        <div className="h-2 bg-gray-200 rounded-full animate-pulse" />
      ) : (
        <>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`absolute top-0 left-0 h-full transition-all duration-300 ${
                isNearLimit ? 'bg-red-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-xs ${isNearLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {storage.used.toFixed(2)} MB used
            </span>
            <span className="text-xs text-gray-500">
              {storage.limit} MB
            </span>
          </div>
        </>
      )}
    </div>
  );
}
