import React, { useEffect, useState } from 'react';
import { fetchHealthCheck, HealthCheckResponse } from '../services/api';
import { Server, Activity, AlertCircle, RefreshCw } from 'lucide-react';

export const StatusPing: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthCheck();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ Express');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center text-xs px-3 py-1.5 rounded-full border bg-white/95 border-slate-200 shadow-xs text-slate-700">
      <Server className="w-3.5 h-3.5 mr-1.5 text-slate-500 flex-shrink-0" />
      <span className="font-semibold mr-1.5 text-slate-600">Máy chủ API:</span>
      
      {loading && !health ? (
        <span className="flex items-center text-amber-600 font-medium">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Đang kiểm tra...
        </span>
      ) : error ? (
        <span className="flex items-center text-red-600 font-medium">
          <AlertCircle className="w-3 h-3 mr-1" /> Ngoại tuyến (M1 Dev)
        </span>
      ) : health ? (
        <span className="flex items-center text-emerald-700 font-bold">
          <Activity className="w-3 h-3 mr-1 text-emerald-500 animate-pulse" /> Sẵn sàng ({health.database})
        </span>
      ) : null}

      <div className="w-px h-3 bg-slate-300 mx-2" />

      <button
        onClick={checkStatus}
        aria-label="Kiểm tra lại kết nối máy chủ"
        title="Kiểm tra lại kết nối"
        className="p-0.5 text-slate-400 hover:text-[#27A4F2] hover:bg-slate-100 rounded transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-[#27A4F2]' : ''}`} />
      </button>
    </div>
  );
};
