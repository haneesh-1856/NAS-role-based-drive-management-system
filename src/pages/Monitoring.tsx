import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Cpu, HardDrive, Activity, Network, Clock, RefreshCw } from 'lucide-react';
import { monitoringService } from '../services/monitoringService';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    usage: number;
    total: number;
    used: number;
    free: number;
  };
  disk: {
    usage: number;
    total: number;
    used: number;
    free: number;
  };
  network: {
    in: number;
    out: number;
  };
  uptime: number;
  timestamp: string;
}

interface SystemLog {
  id: string;
  log_type: string;
  log_message: string;
  user_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export function Monitoring() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [metricsData, logsData] = await Promise.all([
        monitoringService.getSystemMetrics(),
        monitoringService.getUserLogs(20),
      ]);
      setMetrics(metricsData);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return 'text-red-600 bg-red-100';
    if (usage >= 70) return 'text-orange-600 bg-orange-100';
    return 'text-green-600 bg-green-100';
  };

  const getUsageBarColor = (usage: number) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/drive')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Drive
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Auto-refresh (5s)
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Monitoring</h1>

        {metrics && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Cpu className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CPU Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.cpu.usage}%</p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageBarColor(metrics.cpu.usage)}`}
                    style={{ width: `${metrics.cpu.usage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{metrics.cpu.cores} cores</p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Memory</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.memory.usage}%</p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageBarColor(metrics.memory.usage)}`}
                    style={{ width: `${metrics.memory.usage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {metrics.memory.used.toFixed(0)} MB / {metrics.memory.total} MB
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <HardDrive className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Disk Usage</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.disk.usage}%</p>
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getUsageBarColor(metrics.disk.usage)}`}
                    style={{ width: `${metrics.disk.usage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {(metrics.disk.used / 1024).toFixed(1)} GB / {(metrics.disk.total / 1024).toFixed(0)} GB
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Network className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Network</p>
                      <p className="text-lg font-bold text-gray-900">
                        {metrics.network.in.toFixed(1)} MB/s
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>↓ In:</span>
                    <span className="font-medium">{metrics.network.in.toFixed(2)} MB/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>↑ Out:</span>
                    <span className="font-medium">{metrics.network.out.toFixed(2)} MB/s</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-lg font-medium text-gray-900">{formatUptime(metrics.uptime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Load Average</p>
                  <p className="text-lg font-medium text-gray-900">
                    {metrics.cpu.loadAverage.map(v => v.toFixed(2)).join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(metrics.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Activity Logs</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        log.log_type === 'error' ? 'bg-red-100 text-red-800' :
                        log.log_type === 'warning' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.log_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800">{log.log_message}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="p-8 text-center text-gray-500">No logs available</div>
          )}
        </div>
      </div>
    </div>
  );
}
