/**
 * Hybrid Database Manager - Server + Offline Sync
 * 
 * Shows:
 * - Server database stats (MySQL/PostgreSQL)
 * - Offline sync queue status
 * - Manual sync controls
 */

import React, { useState, useEffect } from 'react';
import { getPendingSyncs, processPendingSyncs, isOnline } from '../services/offlineSyncService';
import { findServerPort, getApiUrl, resetServerPort } from '../services/portDetector';
import { Database, Cloud, HardDrive, RefreshCw, CloudOff, CheckCircle, AlertTriangle } from 'lucide-react';

// Dynamic API URL - will auto-detect server port
let dynamicApiUrl: string | null = null;

async function getDynamicApiUrl(): Promise<string> {
  if (!dynamicApiUrl) {
    dynamicApiUrl = await getApiUrl();
  }
  return dynamicApiUrl;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const API_URL = await getDynamicApiUrl();
  const url = `${API_URL}${endpoint}`;
  const token = localStorage.getItem('auth_token') || '';
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
}

export default function DatabaseManager() {
  const [online, setOnline] = useState(isOnline());
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  
  // Server database stats
  const [serverStats, setServerStats] = useState<{
    totalUniversities: number;
    top1Count: number;
    top2Count: number;
    top3Count: number;
    lastBackup?: string;
  } | null>(null);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [backupStats, setBackupStats] = useState<{
    count: number;
    totalSizeMB: number;
    newest?: string;
  } | null>(null);
  
  // Offline sync stats
  const [offlineStats, setOfflineStats] = useState<{
    pendingCount: number;
    lastSync?: string;
  }>({ pendingCount: 0 });

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load all stats
  const loadStats = async () => {
    if (document.visibilityState !== 'visible') return;
    // Check server health and detect port
    const port = await findServerPort();
    setServerOnline(!!port);
    
    if (port) {
      console.log(`[DatabaseManager] Server detected on port: ${port}`);
      try {
        const API_URL = await getDynamicApiUrl();
        const response = await fetch(`${API_URL}/admin/db/stats`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setServerStats(data.stats);
          }
        }
        const backupsResp = await fetch(`${API_URL}/admin/db/list-backups`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` }
        });
        if (backupsResp.ok) {
          const backupsData = await backupsResp.json();
          if (backupsData.success) {
            const backups = backupsData.backups || [];
            const totalSize = backups.reduce((acc: number, b: any) => acc + (b.size || 0), 0);
            const newest = backups[0]?.created || null;
            setBackupStats({
              count: backups.length,
              totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 10) / 10,
              newest: newest ? new Date(newest).toLocaleString() : undefined
            });
          }
        }
      } catch (err: any) {
        console.log('Server stats not available:', err);
      }
    }
    
    // Offline queue stats (always works)
    try {
      const pending = await getPendingSyncs();
      setOfflineStats({
        pendingCount: pending.length,
        lastSync: localStorage.getItem('last_offline_sync') || undefined
      });
    } catch (err) {
      console.log('Offline stats error:', err);
    }
  };

  useEffect(() => {
    loadStats();
    // Refresh every 60 seconds to reduce UI jank
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  // Server backup
  const handleBackup = async () => {
    try {
      setError(null);
      setSyncStatus('Creating server backup...');
      
      const response = await apiCall('/admin/db/backup', { method: 'POST' });
      
      if (response.success) {
        setSyncStatus(`✅ Backup created: ${response.filename || 'server-backup.sql'}`);
        await loadStats();
      } else {
        throw new Error(response.error || 'Backup failed');
      }
    } catch (error: any) {
      console.error('Backup failed:', error);
      setError(error.message);
      setSyncStatus(null);
      // Reset port on error
      resetServerPort();
      dynamicApiUrl = null;
    }
  };

  // Server sync (MySQL ↔ PostgreSQL)
  const handleServerSync = async () => {
    try {
      setError(null);
      setSyncStatus('Syncing MySQL ↔ PostgreSQL...');
      
      const response = await apiCall('/admin/db/sync', { method: 'POST' });
      
      if (response.success) {
        setSyncStatus(`✅ Server sync complete! ${response.message || ''}`);
        await loadStats();
      } else {
        throw new Error(response.error || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Server sync failed:', error);
      setError(error.message);
      setSyncStatus(null);
      resetServerPort();
      dynamicApiUrl = null;
    }
  };

  // Push offline data to server
  const handlePushOffline = async () => {
    if (!online) {
      setError('You are offline. Cannot sync until connection is restored.');
      return;
    }
    
    try {
      setError(null);
      setSyncStatus('Pushing offline data to server...');
      
      const result = await processPendingSyncs();
      
      localStorage.setItem('last_offline_sync', new Date().toISOString());
      
      if (result.processed > 0) {
        setSyncStatus(`✅ Synced ${result.processed} items! ${result.remaining} remaining`);
      } else if (result.remaining > 0) {
        setSyncStatus(`⚠️ ${result.remaining} items failed to sync`);
      } else {
        setSyncStatus('✅ All offline data synced!');
      }
      
      await loadStats();
    } catch (error: any) {
      console.error('Offline sync failed:', error);
      setError(error.message);
      setSyncStatus(null);
    }
  };

  // View data
  const handleViewData = async () => {
    try {
      const API_URL = await getDynamicApiUrl();
      const response = await fetch(`${API_URL}/universities?limit=10`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.table(data.universities || data);
        alert(`Found ${(data.universities || data).length} universities. Check console!`);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error: any) {
      setError(error.message);
      resetServerPort();
      dynamicApiUrl = null;
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f8f9fa', 
      borderRadius: '12px', 
      margin: '20px 0',
      border: '1px solid #e9ecef'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <Database size={24} color="#003AB7" />
        <h3 style={{ margin: 0, color: '#003AB7' }}>Database Manager</h3>
        <span style={{ 
          marginLeft: 'auto',
          padding: '4px 12px', 
          background: online ? '#d4edda' : '#f8d7da',
          color: online ? '#155724' : '#721c24',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {online ? <><CheckCircle size={12} /> Online</> : <><CloudOff size={12} /> Offline</>}
        </span>
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* Server Database Column */}
        <div style={{ 
          padding: '15px', 
          background: 'white', 
          borderRadius: '8px',
          border: '2px solid #003AB7'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Cloud size={20} color="#003AB7" />
            <h4 style={{ margin: 0, color: '#003AB7' }}>Server Database</h4>
            <span style={{ 
              marginLeft: 'auto',
              fontSize: '11px', 
              padding: '2px 8px', 
              background: '#e3f2fd',
              color: '#003AB7',
              borderRadius: '10px'
            }}>
              MySQL ↔ PostgreSQL
            </span>
          </div>
          
          {serverOnline === false ? (
            <div style={{ fontSize: '14px', color: '#999', textAlign: 'center', padding: '20px 0' }}>
              <CloudOff size={32} color="#ccc" style={{ marginBottom: '10px' }} />
              <div>Server offline</div>
              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                Run: npm run server
              </div>
            </div>
          ) : serverStats ? (
            <div style={{ fontSize: '14px', color: '#666' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Universities:</span>
                <strong>{serverStats.totalUniversities}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span style={{ padding: '2px 8px', background: '#e3f2fd', borderRadius: '4px', fontSize: '12px' }}>
                  Top1: {serverStats.top1Count}
                </span>
                <span style={{ padding: '2px 8px', background: '#e8f5e9', borderRadius: '4px', fontSize: '12px' }}>
                  Top2: {serverStats.top2Count}
                </span>
                <span style={{ padding: '2px 8px', background: '#fff3e0', borderRadius: '4px', fontSize: '12px' }}>
                  Top3: {serverStats.top3Count}
                </span>
              </div>
              {serverStats.lastBackup && (
                <div style={{ fontSize: '11px', color: '#999' }}>
                  Last backup: {new Date(serverStats.lastBackup).toLocaleString()}
                </div>
              )}
              {backupStats && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                  Backups: {backupStats.count} â€¢ Total: {backupStats.totalSizeMB} MB
                  {backupStats.newest && (
                    <div>Newest: {backupStats.newest}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: '#999', fontSize: '14px' }}>Loading stats...</div>
          )}
        </div>

        {/* Offline Cache Column */}
        <div style={{ 
          padding: '15px', 
          background: 'white', 
          borderRadius: '8px',
          border: '2px solid #F5A623'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <HardDrive size={20} color="#F5A623" />
            <h4 style={{ margin: 0, color: '#F5A623' }}>Offline Cache</h4>
            <span style={{ 
              marginLeft: 'auto',
              fontSize: '11px', 
              padding: '2px 8px', 
              background: offlineStats.pendingCount > 0 ? '#fff3e0' : '#e8f5e9',
              color: offlineStats.pendingCount > 0 ? '#F5A623' : '#2e7d32',
              borderRadius: '10px'
            }}>
              {offlineStats.pendingCount > 0 ? `${offlineStats.pendingCount} pending` : 'Up to date'}
            </span>
          </div>
          
          <div style={{ fontSize: '14px', color: '#666' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Queued items:</span>
              <strong style={{ color: offlineStats.pendingCount > 0 ? '#F5A623' : '#666' }}>
                {offlineStats.pendingCount}
              </strong>
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              {offlineStats.lastSync ? (
                <>Last sync: {new Date(offlineStats.lastSync).toLocaleString()}</>
              ) : (
                'Never synced'
              )}
            </div>
            
            {offlineStats.pendingCount > 0 && !online && (
              <div style={{ 
                marginTop: '10px',
                padding: '8px', 
                background: '#fff3e0', 
                borderRadius: '4px',
                fontSize: '12px',
                color: '#F5A623',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <AlertTriangle size={14} />
                Data saved locally. Will sync when online.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{ 
          color: '#d32f2f', 
          marginBottom: '15px', 
          padding: '10px',
          background: '#ffebee',
          borderRadius: '6px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {syncStatus && !error && (
        <div style={{ 
          color: '#2D8C4E', 
          marginBottom: '15px', 
          padding: '10px',
          background: '#e8f5e9',
          borderRadius: '6px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <RefreshCw size={16} />
          {syncStatus}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleBackup}
          style={{
            padding: '10px 16px',
            background: '#003AB7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Cloud size={16} />
          Backup Server
        </button>

        <button
          onClick={handleServerSync}
          style={{
            padding: '10px 16px',
            background: '#2D8C4E',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={16} />
          Sync MySQL↔PostgreSQL
        </button>

        <button
          onClick={handlePushOffline}
          disabled={!online || offlineStats.pendingCount === 0}
          style={{
            padding: '10px 16px',
            background: online && offlineStats.pendingCount > 0 ? '#F5A623' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: online && offlineStats.pendingCount > 0 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <HardDrive size={16} />
          Push Offline Data ({offlineStats.pendingCount})
        </button>

        <button
          onClick={handleViewData}
          style={{
            padding: '10px 16px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Database size={16} />
          View Data
        </button>
      </div>

      <p style={{ marginTop: '15px', fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
        💡 <strong>Server Database:</strong> Primary storage in MySQL with PostgreSQL replica.<br/>
        💡 <strong>Offline Cache:</strong> Local SQLite queue for data saved while offline.<br/>
        💡 Data auto-syncs every 30 seconds when connection is restored.
      </p>
    </div>
  );
}
