import React, { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import TierBreakdownBar from '../components/TierBreakdownBar';
import TierMini from '../components/TierMini';
import ImportUniversitiesModal from '../components/ImportUniversitiesModal';
import DatabaseExportPanel from '../components/DatabaseExportPanel';
import { toast } from 'sonner';
import { getAllUniversities } from '../services/universityService';
import { getAllUsers, getAuditLogs } from '../services/sqliteDatabase';

const fetchDashboardStats = (universities: any[]) => {
  const top1Count = universities.filter(u => u.koreanData?.topTier === 'Top1' || u.top_tier === 'Top1').length;
  const top2Count = universities.filter(u => u.koreanData?.topTier === 'Top2' || u.top_tier === 'Top2').length;
  const top3Count = universities.filter(u => u.koreanData?.topTier === 'Top3' || u.top_tier === 'Top3').length;
  
  // Check if university has visa systems configured (in korean_data)
  const configuredCount = universities.filter(u => {
    const visaSystems = u.koreanData?.visaSystemsDetail || u.visa_systems || {};
    return Object.values(visaSystems).some((s: any) => s?.available === true);
  }).length;
  
  const pendingConfig = universities.length - configuredCount;
  
  // Count universities that need updates (no koreanData or missing key fields)
  const pendingUpdates = universities.filter(u => 
    !u.koreanData || 
    !u.koreanData.visaSystemsDetail ||
    Object.keys(u.koreanData.visaSystemsDetail || {}).length === 0
  ).length;
  
  return { 
    totalUniversities: universities.length, 
    top1Count, 
    top2Count, 
    top3Count, 
    activeStudents: 0, // Will be overridden by actual count
    configuredCount, 
    pendingConfig, 
    pendingUpdates, 
    recentActivity: [] 
  };
};

export default function AdminDashboard() {
  const { universities, setUniversities, addUniversities } = useApp();
  const navigate = useNavigate();
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeStudents, setActiveStudents] = React.useState(0);
  const [recentActivity, setRecentActivity] = React.useState<any[]>([]);
  
  const stats = useMemo(() => {
    const baseStats = fetchDashboardStats(universities);
    return { ...baseStats, activeStudents };
  }, [universities, activeStudents]);

  // Reload universities from SQLite on mount
  useEffect(() => {
    const reloadUniversities = async () => {
      try {
        const [dbUniversities, users] = await Promise.all([
          getAllUniversities(),
          getAllUsers()
        ]);
        
        if (dbUniversities.length > 0) {
          const parsedUniversities = dbUniversities.map((u: any) => ({
            ...u,
            koreanData: typeof u.korean_data === 'string' 
              ? JSON.parse(u.korean_data) 
              : u.koreanData || u.korean_data || {}
          }));
          setUniversities(() => parsedUniversities);
        }
        
        // Count students
        const students = users.filter((u: any) => u.role === 'student');
        setActiveStudents(students.length);
        
        // Load recent activity from audit logs
        const logs = await getAuditLogs(undefined, undefined, undefined, 10);
        const formattedLogs = logs.map((log: any) => ({
          id: log.id,
          action: log.action,
          entityType: log.entity_type,
          entityName: log.new_values ? JSON.parse(log.new_values || '{}').name || log.entity_id : log.entity_id,
          performedBy: log.performed_by_email || log.performed_by || 'System',
          timestamp: new Date(log.created_at).toLocaleString('vi-VN')
        }));
        setRecentActivity(formattedLogs);
      } catch (error) {
        console.error('Failed to reload data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    reloadUniversities();
  }, []);

  const palette = {
    pageBg: '#FBF7F2',
    cardBg: '#FFFFFF',
    border: '#E7DFD6',
    text: '#3F3730',
    textMuted: '#7B7267',
    accent: '#2C6DB4',
    accentSoft: '#E6F1FB',
    warnBg: '#FFF1E0',
    warnBorder: '#F2C38B',
    warnText: '#8A5A16'
  };

  const cardStyle: React.CSSProperties = {
    background: palette.cardBg,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    padding: 16
  };

  return (
    <div style={{ padding: '24px 28px 32px', background: 'linear-gradient(180deg, #FBF7F2 0%, #F4EEE7 100%)', minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: palette.text, marginBottom: 6 }}>Trang chủ</h1>
        <p style={{ fontSize: 13, color: palette.textMuted }}>Quản lý hệ thống Du Học Cost</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Tổng số trường" value={stats.totalUniversities} sub={`Top 1: ${stats.top1Count} · Top 2: ${stats.top2Count} · Top 3: ${stats.top3Count}`} icon="🏫" color="blue" />
        <StatCard label="Học viên đang theo dõi" value={stats.activeStudents} sub="Đã đăng ký tư vấn" icon="👤" color="green" />
        <StatCard label="Trường đã cấu hình phí" value={stats.configuredCount} sub={`${stats.pendingConfig} trường chưa cấu hình`} icon="✓" color="teal" />
        <StatCard label="Cần cập nhật" value={stats.pendingUpdates} sub="Thông tin chờ xem xét" icon="⚠" color={stats.pendingUpdates > 0 ? 'amber' : 'gray'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 18 }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, color: palette.text }}>Danh sách trường</span>
            <span onClick={() => navigate('/admin/universities')} style={{ fontSize: 12, color: palette.accent, cursor: 'pointer' }}>Xem tất cả →</span>
          </div>
          <TierBreakdownBar top1={stats.top1Count} top2={stats.top2Count} top3={stats.top3Count} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
            <TierMini label="Top 1" count={stats.top1Count} color="blue" desc="Dễ visa" />
            <TierMini label="Top 2" count={stats.top2Count} color="green" desc="Trung bình" />
            <TierMini label="Top 3" count={stats.top3Count} color="red" desc="Hạn chế" />
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigate('/admin/universities')}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: `1px solid ${palette.border}`,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                color: palette.text
              }}
            >
              Quản lý trường
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid transparent',
                background: palette.accent,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600
              }}
            >
              Import CSV
            </button>
          </div>
        </div>

        <div style={cardStyle}>
          <span style={{ fontWeight: 600, color: palette.text }}>Hoạt động gần đây</span>
          {recentActivity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: palette.textMuted, fontSize: 13 }}>
              Chưa có hoạt động nào
            </div>
          ) : (
            <div style={{ marginTop: 12, maxHeight: 200, overflowY: 'auto' }}>
              {recentActivity.map((activity, idx) => (
                <div key={idx} style={{ 
                  padding: '8px 0', 
                  borderBottom: idx < recentActivity.length - 1 ? `1px solid ${palette.border}` : 'none',
                  fontSize: 12 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      background: activity.action.includes('CREATE') ? '#10B981' : 
                                  activity.action.includes('UPDATE') ? '#3B82F6' : 
                                  activity.action.includes('DELETE') ? '#EF4444' : '#6B7280'
                    }} />
                    <span style={{ fontWeight: 500, color: palette.text }}>
                      {activity.action}
                    </span>
                    <span style={{ color: palette.textMuted, marginLeft: 'auto' }}>
                      {activity.timestamp}
                    </span>
                  </div>
                  <div style={{ marginLeft: 16, marginTop: 2, color: palette.textMuted }}>
                    {activity.entityType}: {activity.entityName}
                  </div>
                  <div style={{ marginLeft: 16, fontSize: 11, color: palette.textMuted }}>
                    bởi {activity.performedBy}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!isLoading && stats.pendingConfig > 0 && (
        <div style={{ background: palette.warnBg, border: `1px solid ${palette.warnBorder}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 600, color: palette.warnText }}>⚠ {stats.pendingConfig} trường chưa cấu hình chi phí</span>
            <div style={{ fontSize: 12, color: palette.warnText, marginTop: 2 }}>Học viên sẽ thấy chi phí = 0 cho các trường này</div>
          </div>
          <button
            onClick={() => navigate('/admin/universities')}
            style={{
              padding: '7px 14px',
              borderRadius: 10,
              border: `1px solid ${palette.warnBorder}`,
              background: '#fff',
              color: palette.warnText,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            Cấu hình ngay →
          </button>
        </div>
      )}

      <DatabaseExportPanel />

      {showImportModal && (
        <ImportUniversitiesModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={(newUniversities) => {
            addUniversities(newUniversities);
            toast.success('Import trường thành công!');
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );
}
