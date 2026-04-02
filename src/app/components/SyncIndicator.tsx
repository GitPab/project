import React from 'react';
import { RefreshCw, CloudOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export function SyncIndicator() {
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    lastSyncAt,
    syncNow 
  } = useOfflineSync();

  // Don't show if online and no pending items and not syncing
  if (isOnline && pendingCount === 0 && !isSyncing && !lastSyncAt) {
    return null;
  }

  const getIcon = () => {
    if (!isOnline) return <CloudOff className="w-4 h-4 text-amber-500" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (pendingCount > 0) return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'Đang đồng bộ...';
    if (pendingCount > 0) return `${pendingCount} chờ đồng bộ`;
    return 'Đã đồng bộ';
  };

  const getBgColor = () => {
    if (!isOnline) return 'bg-amber-50 border-amber-200';
    if (isSyncing) return 'bg-blue-50 border-blue-200';
    if (pendingCount > 0) return 'bg-amber-50 border-amber-200';
    return 'bg-green-50 border-green-200';
  };

  return (
    <button
      onClick={syncNow}
      disabled={!isOnline || isSyncing}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition-all ${
        getBgColor()
      } ${(!isOnline || isSyncing) ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
      title={!isOnline ? 'Offline - sẽ tự động đồng bộ khi có kết nối' : 'Click để đồng bộ ngay'}
    >
      {getIcon()}
      <span className={`text-xs font-medium ${
        !isOnline ? 'text-amber-700' :
        isSyncing ? 'text-blue-700' :
        pendingCount > 0 ? 'text-amber-700' :
        'text-green-700'
      }`}>
        {getStatusText()}
      </span>
    </button>
  );
}

export default SyncIndicator;
