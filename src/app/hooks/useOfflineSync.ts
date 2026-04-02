import { useState, useEffect, useCallback } from 'react';
import { 
  getPendingSyncs, 
  processPendingSyncs, 
  isOnline as checkIsOnline 
} from '../services/offlineSyncService';

interface SyncStatus {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  lastSyncResult: {
    processed: number;
    failed: number;
    remaining: number;
  } | null;
  isOnline: boolean;
}

export function useOfflineSync() {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    isSyncing: false,
    lastSyncAt: null,
    lastSyncResult: null,
    isOnline: checkIsOnline()
  });

  // Update online status
  useEffect(() => {
    const handleOnline = () => setStatus(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setStatus(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch pending sync count
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncs();
      setStatus(prev => ({ ...prev, pendingCount: pending.length }));
    } catch (error) {
      console.error('[useOfflineSync] Failed to get pending syncs:', error);
    }
  }, []);

  // Manual sync trigger
  const syncNow = useCallback(async () => {
    if (!checkIsOnline()) {
      console.log('[useOfflineSync] Offline, skipping sync');
      return;
    }

    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    try {
      const result = await processPendingSyncs();
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncAt: new Date(),
        lastSyncResult: result,
        pendingCount: result.remaining
      }));
      return result;
    } catch (error) {
      console.error('[useOfflineSync] Sync failed:', error);
      setStatus(prev => ({ ...prev, isSyncing: false }));
      throw error;
    }
  }, []);

  // Auto-update pending count periodically
  useEffect(() => {
    updatePendingCount();
    
    const interval = setInterval(() => {
      updatePendingCount();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [updatePendingCount]);

  // Listen for online event to trigger sync
  useEffect(() => {
    const handleOnline = () => {
      console.log('[useOfflineSync] Back online, auto-syncing...');
      syncNow();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncNow]);

  return {
    ...status,
    syncNow,
    refreshPending: updatePendingCount
  };
}

export default useOfflineSync;
