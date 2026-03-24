import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import TierBreakdownBar from '../components/TierBreakdownBar';
import TierMini from '../components/TierMini';
import ImportUniversitiesModal from '../components/ImportUniversitiesModal';
import { toast } from 'sonner';

const fetchDashboardStats = (universities: any[]) => {
  const top1Count = universities.filter(u => u.koreanData?.topTier === 'Top1').length;
  const top2Count = universities.filter(u => u.koreanData?.topTier === 'Top2').length;
  const top3Count = universities.filter(u => u.koreanData?.topTier === 'Top3').length;
  const configuredCount = universities.filter(u =>
    u.visa_systems && Object.values(u.visa_systems).some((s: any) => s?.available === true && (s?.invoice_krw ?? 0) > 0)
  ).length;
  const pendingConfig = universities.filter(u =>
    !u.visa_systems || !Object.values(u.visa_systems).some((s: any) => s?.available === true)
  ).length;
  return { totalUniversities: universities.length, top1Count, top2Count, top3Count, activeStudents: 0, configuredCount, pendingConfig, pendingUpdates: 0, recentActivity: [] };
};

export default function AdminDashboard() {
  const { universities, addUniversities } = useApp();
  const navigate = useNavigate();
  const [showImportModal, setShowImportModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const stats = useMemo(() => fetchDashboardStats(universities), [universities]);
  React.useEffect(() => { setIsLoading(false); }, [universities]);

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
          <div style={{ textAlign: 'center', padding: '32px 0', color: palette.textMuted, fontSize: 13 }}>
            Chưa có hoạt động nào
          </div>
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
