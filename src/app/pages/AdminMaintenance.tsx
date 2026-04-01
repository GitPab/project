import React from 'react';
import api from '../services/api';
import DatabaseExportPanel from '../components/DatabaseExportPanel';
import { PermissionGuard, PageGuard } from '../components/PermissionGuard';

const palette = {
  pageBg: '#FBF7F2',
  cardBg: '#FFFFFF',
  border: '#E7DFD6',
  text: '#3F3730',
  textMuted: '#7B7267',
  accent: '#2C6DB4',
  accentSoft: '#E6F1FB'
};

const cardStyle: React.CSSProperties = {
  background: palette.cardBg,
  border: `1px solid ${palette.border}`,
  borderRadius: 14,
  padding: 16
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

function AdminMaintenanceContent() {
  const [healthStatus, setHealthStatus] = React.useState<any | null>(null);
  const [healthError, setHealthError] = React.useState<string | null>(null);
  const [healthLoading, setHealthLoading] = React.useState(false);
  const [backups, setBackups] = React.useState<any[]>([]);
  const [backupError, setBackupError] = React.useState<string | null>(null);
  const [backupLoading, setBackupLoading] = React.useState(false);
  const [lastRefresh, setLastRefresh] = React.useState<string | null>(null);

  const fetchHealth = React.useCallback(async () => {
    setHealthLoading(true);
    try {
      const response = await api.get('/health');
      setHealthStatus(response.data);
      setHealthError(null);
    } catch (error: any) {
      setHealthError(error?.message || 'Health check failed');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchBackups = React.useCallback(async () => {
    setBackupLoading(true);
    try {
      const response = await api.get('/admin/db/list-backups');
      if (response.data?.success) {
        setBackups(response.data.backups || []);
        setBackupError(null);
      } else {
        setBackupError('Failed to load backups');
      }
    } catch (error: any) {
      setBackupError(error?.message || 'Failed to load backups');
    } finally {
      setBackupLoading(false);
    }
  }, []);

  const handleRefresh = React.useCallback(async () => {
    await Promise.all([fetchHealth(), fetchBackups()]);
    setLastRefresh(new Date().toLocaleString());
  }, [fetchHealth, fetchBackups]);

  React.useEffect(() => {
    handleRefresh();
  }, [handleRefresh]);

  const backupSummary = React.useMemo(() => {
    if (!backups?.length) {
      return { count: 0, totalSize: '0 MB', newest: null };
    }
    const total = backups.reduce((acc: number, item: any) => acc + (item.size || 0), 0);
    return {
      count: backups.length,
      totalSize: formatBytes(total),
      newest: backups[0]?.created || null
    };
  }, [backups]);

  const alerts = healthStatus?.alerts;

  return (
    <div style={{ padding: '24px 28px 32px', background: 'linear-gradient(180deg, #FBF7F2 0%, #F4EEE7 100%)', minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: palette.text, marginBottom: 6 }}>Bảo trì hệ thống</h1>
        <p style={{ fontSize: 13, color: palette.textMuted }}>Giám sát, sao lưu và cấu hình cảnh báo</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginBottom: 18 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, color: palette.text }}>System Health</span>
            <button
              onClick={fetchHealth}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${palette.border}`,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: palette.text
              }}
            >
              {healthLoading ? 'Checking...' : 'Refresh'}
            </button>
          </div>

          {healthError && (
            <div style={{ fontSize: 12, color: '#B91C1C', marginBottom: 8 }}>{healthError}</div>
          )}

          {healthStatus ? (
            <div style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
              <div><strong>Status:</strong> {healthStatus.status}</div>
              <div><strong>Environment:</strong> {healthStatus.environment}</div>
              <div><strong>Database:</strong> {healthStatus.database?.type} ({healthStatus.database?.connected ? 'connected' : 'disconnected'})</div>
              <div><strong>Redis:</strong> {healthStatus.services?.redis?.connected ? 'connected' : 'disconnected'}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: palette.textMuted }}>Health data not available.</div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, color: palette.text }}>Alert Channels</span>
            <span style={{ fontSize: 11, color: palette.textMuted }}>From /health</span>
          </div>
          <div style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
            <div><strong>Telegram:</strong> {alerts?.telegram?.configured ? 'configured' : 'not configured'}</div>
            <div><strong>Email:</strong> {alerts?.email?.configured ? 'configured' : 'not configured'}</div>
            <div style={{ marginTop: 6 }}>
              <div><strong>Throttle (global):</strong> {alerts?.throttleMinutes?.global ?? 30} min</div>
              <div><strong>Throttle (telegram):</strong> {alerts?.throttleMinutes?.telegram ?? 0} min</div>
              <div><strong>Throttle (email):</strong> {alerts?.throttleMinutes?.email ?? 0} min</div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, color: palette.text }}>Backups</span>
            <button
              onClick={fetchBackups}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: `1px solid ${palette.border}`,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: palette.text
              }}
            >
              {backupLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {backupError && (
            <div style={{ fontSize: 12, color: '#B91C1C', marginBottom: 8 }}>{backupError}</div>
          )}
          <div style={{ fontSize: 12, color: palette.textMuted, lineHeight: 1.6 }}>
            <div><strong>Total:</strong> {backupSummary.count}</div>
            <div><strong>Size:</strong> {backupSummary.totalSize}</div>
            <div><strong>Newest:</strong> {backupSummary.newest || 'N/A'}</div>
          </div>
          {backups.length > 0 && (
            <div style={{ marginTop: 10 }}>
              {backups.slice(0, 5).map((backup, idx) => (
                <div key={`${backup.name || backup.filename}-${idx}`} style={{ fontSize: 11, color: palette.textMuted, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{backup.name || backup.filename || `backup-${idx + 1}`}</span>
                  <span>{formatBytes(backup.size || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {lastRefresh && (
        <div style={{ fontSize: 11, color: palette.textMuted, marginBottom: 12 }}>
          Last refresh: {lastRefresh}
        </div>
      )}

      <PermissionGuard permission="manage:database">
        <div style={{ ...cardStyle }}>
          <DatabaseExportPanel />
        </div>
      </PermissionGuard>
    </div>
  );
}

export default function AdminMaintenance() {
  return (
    <PageGuard permission="view:database">
      <AdminMaintenanceContent />
    </PageGuard>
  );
}
