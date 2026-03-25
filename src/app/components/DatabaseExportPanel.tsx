import React, { useState, useEffect } from 'react';
import { exportDatabaseToFile, importDatabaseFromFile, runQuery, initDatabase, getDatabase } from '../services/sqliteDatabase';
import { syncUniversitiesToDatabase, getDatabaseStats } from '../services/dataSyncService';

export default function DatabaseExportPanel() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{totalUniversities: number, top1Count: number, top2Count: number, top3Count: number} | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      try {
        await initDatabase();
        const db = getDatabase();
        if (db) {
          setIsReady(true);
          setError(null);
          const stats = await getDatabaseStats();
          setDbStats(stats);
        }
      } catch (err: any) {
        console.error('Database init error:', err);
        setError('Database not initialized: ' + err.message);
      }
    };
    checkDb();
  }, []);

  const handleExport = async () => {
    try {
      setError(null);
      await initDatabase();
      const db = getDatabase();
      if (!db) {
        throw new Error('Database is null - not initialized');
      }
      exportDatabaseToFile('sacma_database.db');
      alert('Database exported successfully! Check your Downloads folder.');
    } catch (error: any) {
      console.error('Export failed:', error);
      setError(error.message || 'Unknown error');
      alert('Export failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      await importDatabaseFromFile(file);
      alert('Database imported successfully! Reload the page to see changes.');
      window.location.reload();
    } catch (error: any) {
      console.error('Import failed:', error);
      setError(error.message || 'Import failed');
      alert('Failed to import: ' + (error.message || 'Unknown error'));
    }
  };

  const handleViewData = () => {
    try {
      const universities = runQuery('SELECT name, top_tier FROM universities LIMIT 10');
      console.table(universities);
      alert(`Found ${universities.length} universities. Check browser console (F12)!`);
    } catch (error: any) {
      console.error('Query failed:', error);
      setError(error.message);
      alert('Database error: ' + error.message);
    }
  };

  const handleSyncData = async () => {
    try {
      setSyncStatus('Syncing...');
      setError(null);
      
      const result = await syncUniversitiesToDatabase();
      
      if (result.errors.length > 0) {
        setError(`Sync completed with ${result.errors.length} errors`);
        console.error('Sync errors:', result.errors);
      } else {
        setSyncStatus(`✅ Synced! Inserted: ${result.inserted}, Updated: ${result.updated}`);
      }
      
      // Refresh stats
      const stats = await getDatabaseStats();
      setDbStats(stats);
      
      alert(`Sync complete!\nTotal: ${result.totalUniversities}\nInserted: ${result.inserted}\nUpdated: ${result.updated}`);
    } catch (error: any) {
      console.error('Sync failed:', error);
      setError('Sync failed: ' + error.message);
      setSyncStatus(null);
      alert('Sync failed: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px', margin: '20px 0' }}>
      <h3 style={{ margin: '0 0 15px 0' }}>SQLite Database Manager {isReady ? '✅' : '⏳'}</h3>
      
      {dbStats && (
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          <strong>Database Stats:</strong> {dbStats.totalUniversities} universities 
          (Top1: {dbStats.top1Count}, Top2: {dbStats.top2Count}, Top3: {dbStats.top3Count})
        </div>
      )}
      
      {error && (
        <div style={{ color: '#d32f2f', marginBottom: '10px', fontSize: '14px' }}>
          ⚠️ Error: {error}
        </div>
      )}

      {syncStatus && !error && (
        <div style={{ color: '#2D8C4E', marginBottom: '10px', fontSize: '14px' }}>
          {syncStatus}
        </div>
      )}

      {!isReady && (
        <div style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
          ⏳ Initializing database...
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={handleExport}
          disabled={!isReady}
          style={{
            padding: '10px 20px',
            background: isReady ? '#2D8C4E' : '#999',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isReady ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          📥 Export sacma.db
        </button>

        <label
          style={{
            padding: '10px 20px',
            background: '#1976D2',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'inline-block'
          }}
        >
          📤 Import .db File
          <input
            type="file"
            accept=".db"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>

        <button
          onClick={handleViewData}
          disabled={!isReady}
          style={{
            padding: '10px 20px',
            background: isReady ? '#F5A623' : '#999',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isReady ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          👁️ View Data
        </button>

        <button
          onClick={handleSyncData}
          disabled={!isReady}
          style={{
            padding: '10px 20px',
            background: isReady ? '#9C27B0' : '#999',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isReady ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          🔄 Sync Data
        </button>
      </div>

      <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        💡 <strong>Sync Data:</strong> Imports all university data from project files into the SQLite database.<br/>
        💡 After exporting, you can open <code>sacma_database.db</code> in any SQLite client.
      </p>
    </div>
  );
}
