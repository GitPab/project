/**
 * Offline-First Sync Service
 * 
 * Architecture:
 * - Primary: API → MySQL → PostgreSQL (when online)
 * - Fallback: Local SQLite (when offline)
 * - Sync: Background push from SQLite → API when back online
 */

import { initDatabase, runQuery, runExec, saveDatabase } from './sqliteDatabase';
import { getApiUrl, resetServerPort } from './portDetector';

let cachedApiUrl: string | null = null;
let lastApiUrlCheck = 0;

async function getDynamicApiUrl(): Promise<string> {
  const now = Date.now();
  // Cache for 30 seconds
  if (cachedApiUrl && (now - lastApiUrlCheck) < 30000) {
    return cachedApiUrl;
  }
  
  cachedApiUrl = await getApiUrl();
  lastApiUrlCheck = now;
  return cachedApiUrl;
}

interface PendingSyncItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: string;
  retries: number;
}

// Helper to get auth token
function getToken(): string {
  return localStorage.getItem('auth_token') || localStorage.getItem('adminToken') || '';
}

// Check if we're online
export function isOnline(): boolean {
  return navigator.onLine;
}

// API call with offline fallback
export async function apiCallWithOfflineFallback(
  endpoint: string, 
  options: RequestInit = {},
  offlineFallback?: () => Promise<any>
): Promise<any> {
  const API_URL = await getDynamicApiUrl();
  const url = `${API_URL}${endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Try API first
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (apiError: any) {
    // If connection refused, reset port cache to force redetection
    if (apiError.message?.includes('fetch') || apiError.message?.includes('NetworkError')) {
      console.log('[OfflineSync] Connection failed, will retry with port detection');
      resetServerPort();
      cachedApiUrl = null;
    }
    
    // API failed - check if we should use offline fallback
    if (!isOnline() && offlineFallback) {
      console.log(`[OfflineSync] API failed, using offline fallback for ${endpoint}`);
      return offlineFallback();
    }
    
    // We're online but API failed - throw error
    throw apiError;
  }
}

// Initialize pending_syncs table
export async function initOfflineSync(): Promise<void> {
  await initDatabase();
  
  runExec(`
    CREATE TABLE IF NOT EXISTS pending_syncs (
      id TEXT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      data TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      retries INTEGER DEFAULT 0
    )
  `);
  
  runExec(`
    CREATE INDEX IF NOT EXISTS idx_pending_syncs_timestamp 
    ON pending_syncs(timestamp)
  `);
  
  saveDatabase();
}

// Queue data for later sync when offline
export async function queueForSync(
  endpoint: string,
  method: 'POST' | 'PUT' | 'DELETE',
  data: any
): Promise<void> {
  await initOfflineSync();
  
  const id = crypto.randomUUID();
  const stmt = runQuery(
    'INSERT INTO pending_syncs (id, endpoint, method, data) VALUES (?, ?, ?, ?)',
    [id, endpoint, method, JSON.stringify(data)]
  );
  
  saveDatabase();
  console.log(`[OfflineSync] Queued ${method} ${endpoint} for later sync`);
}

// Get all pending syncs
export async function getPendingSyncs(): Promise<PendingSyncItem[]> {
  await initOfflineSync();
  
  const results = runQuery('SELECT * FROM pending_syncs ORDER BY timestamp ASC');
  
  return results.map((row: any) => ({
    id: row.id,
    endpoint: row.endpoint,
    method: row.method,
    data: JSON.parse(row.data || '{}'),
    timestamp: row.timestamp,
    retries: row.retries
  }));
}

// Remove synced item
export async function removePendingSync(id: string): Promise<void> {
  runExec(`DELETE FROM pending_syncs WHERE id = '${id}'`);
  saveDatabase();
}

// Increment retry count
export async function incrementRetry(id: string): Promise<void> {
  runExec(`UPDATE pending_syncs SET retries = retries + 1 WHERE id = '${id}'`);
  saveDatabase();
}

// Clear old failed syncs (after 5 retries)
export async function clearFailedSyncs(): Promise<void> {
  runExec('DELETE FROM pending_syncs WHERE retries >= 5');
  saveDatabase();
}

// Background sync process
export async function processPendingSyncs(): Promise<{
  processed: number;
  failed: number;
  remaining: number;
}> {
  if (!isOnline()) {
    console.log('[OfflineSync] Offline - skipping sync');
    return { processed: 0, failed: 0, remaining: 0 };
  }

  const API_URL = await getDynamicApiUrl();
  const pending = await getPendingSyncs();
  let processed = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const API_URL = await getDynamicApiUrl();
      const url = `${API_URL}${item.endpoint}`;
      const token = getToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };

      const response = await fetch(url, {
        method: item.method,
        headers,
        body: item.method !== 'DELETE' ? JSON.stringify(item.data) : undefined
      });

      if (response.ok) {
        await removePendingSync(item.id);
        processed++;
        console.log(`[OfflineSync] Successfully synced: ${item.endpoint}`);
      } else {
        await incrementRetry(item.id);
        failed++;
        console.error(`[OfflineSync] Failed to sync ${item.endpoint}: ${response.status}`);
      }
    } catch (error) {
      await incrementRetry(item.id);
      failed++;
      console.error(`[OfflineSync] Error syncing ${item.endpoint}:`, error);
    }
  }

  // Clear items that failed too many times
  await clearFailedSyncs();
  
  const remaining = (await getPendingSyncs()).length;
  
  return { processed, failed, remaining };
}

// Auto-start background sync
export function startBackgroundSync(intervalMs = 30000): () => void {
  console.log(`[OfflineSync] Starting background sync every ${intervalMs}ms`);
  
  // Listen for online events
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Back online - triggering sync');
    processPendingSyncs();
  });

  // Periodic sync
  const interval = setInterval(() => {
    if (isOnline()) {
      processPendingSyncs();
    }
  }, intervalMs);

  // Return cleanup function
  return () => clearInterval(interval);
}

// Feature API wrappers with offline support
export const OfflineFeatureAPI = {
  // Generic create with offline fallback
  async create(endpoint: string, data: any): Promise<any> {
    return apiCallWithOfflineFallback(
      endpoint,
      { method: 'POST', body: JSON.stringify(data) },
      async () => {
        // Offline fallback: save to SQLite queue
        await queueForSync(endpoint, 'POST', data);
        return { 
          success: true, 
          offline: true, 
          message: 'Saved locally - will sync when online',
          localId: crypto.randomUUID()
        };
      }
    );
  },

  // Generic update with offline fallback
  async update(endpoint: string, data: any): Promise<any> {
    return apiCallWithOfflineFallback(
      endpoint,
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        await queueForSync(endpoint, 'PUT', data);
        return { 
          success: true, 
          offline: true, 
          message: 'Saved locally - will sync when online'
        };
      }
    );
  },

  // Generic delete with offline fallback
  async remove(endpoint: string): Promise<any> {
    return apiCallWithOfflineFallback(
      endpoint,
      { method: 'DELETE' },
      async () => {
        await queueForSync(endpoint, 'DELETE', {});
        return { 
          success: true, 
          offline: true, 
          message: 'Delete queued - will sync when online'
        };
      }
    );
  },

  // Get all (no offline fallback - must be online)
  async getAll(endpoint: string): Promise<any> {
    return apiCallWithOfflineFallback(endpoint, { method: 'GET' });
  }
};

export default {
  isOnline,
  apiCallWithOfflineFallback,
  initOfflineSync,
  queueForSync,
  getPendingSyncs,
  processPendingSyncs,
  startBackgroundSync,
  OfflineFeatureAPI
};
