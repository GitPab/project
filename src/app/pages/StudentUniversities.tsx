import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { getMaxScholarship } from '../../utils/universityPerks';
import { Search } from 'lucide-react';
import type { University } from '../context/AppContext';

// Read-only Student version matching Admin layout
const StudentUniversityRow = React.memo(function StudentUniversityRow({ university, palette }: { university: University; palette: any }) {
  const navigate = useNavigate();
  
  const formatKRW = (amount?: number | null) => Number(amount ?? 0).toLocaleString('vi-VN');
  
  const visaSystemsDetail = university?.koreanData?.visaSystemsDetail || {};
  const visaSystems = (university as any)?.visa_systems || {};
  
  const getVisaSystem = (key: string) => {
    const detail = visaSystemsDetail[key];
    if (detail?.available) return detail;
    const system = visaSystems[key];
    if (!system?.available) return null;
    return {
      available: system.available,
      invoiceKRWPerYear: system.invoice_krw,
      applyFeeKRW: system.apply_fee_krw,
      enrollmentFeeKRW: system.enrollment_fee_krw,
      scholarships: (system.scholarships || []).map((s: any) => ({
        topikLevel: s.topik_level,
        discountPct: s.discount_pct
      })),
      ktxOptions: (system.ktx_options || []).map((k: any) => ({
        name: k.name,
        priceKRWPerKy: k.price_krw
      }))
    };
  };
  
  const d41Data = getVisaSystem('D4-1');
  const hasD41 = d41Data?.available;
  
  const calculateTotal = () => {
    const commonFees = university?.koreanData?.commonFeesVND || [];
    const hocTieng = commonFees.find((f: any) => f.id === 'hoc_tieng')?.amount || 13000000;
    const phiTuVan = commonFees.find((f: any) => f.id === 'phi_tu_van')?.amount || 39000000;
    const phiTrungTam = commonFees.find((f: any) => f.id === 'phi_trung_tam')?.amount || 11000000;
    const veMayBay = commonFees.find((f: any) => f.id === 've_may_bay')?.amount || 8000000;
    const totalVND = hocTieng + phiTuVan + phiTrungTam + veMayBay;
    
    if (hasD41 && d41Data) {
      const applyFee = d41Data.applyFeeKRW || 0;
      const enrollmentFee = d41Data.enrollmentFeeKRW || 0;
      const invoice = d41Data.invoiceKRWPerYear || 0;
      const ktxOptions = d41Data.ktxOptions || [];
      const cheapestKTX = ktxOptions.length > 0 
        ? Math.min(...ktxOptions.map((k: any) => k.priceKRWPerKy || 0))
        : 0;
      const totalKRW = applyFee + enrollmentFee + invoice + cheapestKTX;
      return { totalVND, totalKRW, hasData: true, tuitionOnly: invoice };
    }
    return { totalVND, totalKRW: 0, hasData: false, tuitionOnly: 0 };
  };
  
  const { totalVND, totalKRW, hasData, tuitionOnly } = calculateTotal();
  
  const getAvailableVisas = () => {
    const visas: string[] = [];
    Object.entries(visaSystemsDetail).forEach(([key, data]: [string, any]) => {
      if (data?.available) visas.push(key);
    });
    Object.entries(visaSystems).forEach(([key, data]: [string, any]) => {
      if (data?.available && !visas.includes(key)) visas.push(key);
    });
    return visas;
  };
  
  const availableVisas = getAvailableVisas();
  const scholarships = d41Data?.scholarships || [];
  const bestScholarship = scholarships.reduce((max: any, s: any) => 
    (s?.discountPct || 0) > (max?.discountPct || 0) ? s : max, null
  );
  const bestKtx = (d41Data?.ktxOptions || [])[0];
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 16px',
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        cursor: 'pointer',
      }}
      onClick={() => navigate(`/student/university/${university.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Column 1: School Info */}
      <div style={{ width: 340, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            background: university?.koreanData?.listLogo || university?.thumbnail 
              ? 'transparent' 
              : 'linear-gradient(135deg, #F4EEE7 0%, #E7DFD6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {university?.koreanData?.listLogo || university?.thumbnail ? (
              <img 
                src={university?.koreanData?.listLogo || university?.thumbnail} 
                alt={university.name}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.parentElement as HTMLElement).textContent = '🏫';
                }}
              />
            ) : '🏫'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: palette.text, margin: 0 }}>
                {university.name}
              </h3>
              {university.top_tier && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#fff',
                  background: university.top_tier === 'Top1' ? '#2D8C4E' : university.top_tier === 'Top2' ? '#F5A623' : '#E53935',
                  padding: '2px 8px',
                  borderRadius: 20,
                  flexShrink: 0,
                }}>
                  {university.top_tier === 'Top1' ? '1' : university.top_tier === 'Top2' ? '2' : '3'}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: palette.textMuted, margin: '0 0 2px 0' }}>
              {university.koreanName}
            </p>
            <p style={{ fontSize: 10, color: '#999', margin: 0 }}>
              {(university as any).region || 'Hàn Quốc'}
            </p>
            
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {availableVisas.slice(0, 4).map((visa) => (
                <span key={visa} style={{
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  background: visa === 'D4-1' ? '#E3F2FD' : visa.startsWith('D2') ? '#E8F5E9' : '#FFF3E0',
                  color: visa === 'D4-1' ? '#1976D2' : visa.startsWith('D2') ? '#388E3C' : '#F57C00',
                  fontWeight: 500,
                }}>
                  {visa}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Tuition and Total Cost */}
      <div style={{ width: 180, flexShrink: 0, textAlign: 'right' }}>
        {hasData ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1976D2' }}>
              {formatKRW(tuitionOnly)} KRW
            </div>
            <div style={{ fontSize: 10, color: '#666', marginBottom: 4 }}>
              D4-1 · mỗi kỳ
            </div>
            <div style={{ borderTop: '1px dashed #ddd', margin: '6px 0' }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: palette.text }}>
              +{formatKRW(totalKRW)} KRW
            </div>
            <div style={{ fontSize: 10, color: '#2D8C4E' }}>
              Tổng ước tính
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>Chưa cập nhật</span>
        )}
      </div>

      {/* Column 3: Features */}
      <div style={{ width: 180, flexShrink: 0, paddingLeft: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {bestScholarship && (
            <span style={{
              padding: '3px 8px',
              borderRadius: 12,
              fontSize: 11,
              background: '#E8F5E9',
              color: '#2E7D32',
              fontWeight: 600,
              width: 'fit-content',
            }}>
              HB đến {bestScholarship.discountPct}%
            </span>
          )}
          {bestKtx && (
            <span style={{ fontSize: 11, color: palette.textMuted }}>
              KTX từ {formatKRW(bestKtx.priceKRWPerKy)} KRW
            </span>
          )}
          {university.koreanData?.jobOpportunities && (
            <span style={{ fontSize: 11, color: palette.textMuted }}>
              Việc làm: {university.koreanData.jobOpportunities}
            </span>
          )}
        </div>
      </div>

      {/* Column 4: Scholarship Bar */}
      <div style={{ width: 160, flexShrink: 0, paddingLeft: 20 }}>
        {bestScholarship ? (
          <>
            <div style={{ fontSize: 11, color: palette.textMuted, marginBottom: 4 }}>
              TOPIK {bestScholarship.topikLevel || 6}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                flex: 1,
                height: 6,
                background: '#E0E0E0',
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${bestScholarship.discountPct}%`,
                  height: '100%',
                  background: bestScholarship.discountPct >= 70 ? '#4CAF50' : 
                             bestScholarship.discountPct >= 40 ? '#8BC34A' : '#FFC107',
                  borderRadius: 3,
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: bestScholarship.discountPct >= 70 ? '#4CAF50' : '#666', minWidth: 30 }}>
                {bestScholarship.discountPct}%
              </span>
            </div>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#999' }}>—</span>
        )}
      </div>

      {/* Column 5: View link (read-only) */}
      <div style={{ flex: 1, textAlign: 'right' }}>
        <span style={{ fontSize: 12, color: palette.accent, fontWeight: 500 }}>
          Xem chi tiết →
        </span>
      </div>
    </div>
  );
});

export default function StudentUniversities() {
  const { universities } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<string>('all');
  const [activePerk, setActivePerk] = useState<string>('all');

  const palette = useMemo(() => ({
    pageBg: '#FBF7F2',
    cardBg: '#FFFFFF',
    border: '#E7DFD6',
    borderSoft: '#EFE6DB',
    text: '#3F3730',
    textMuted: '#7B7267',
    accent: '#2C6DB4',
    accentSoft: '#E6F1FB',
    chipBg: '#FFFFFF',
    chipActiveBg: '#F1F6FF',
    chipActiveBorder: '#2C6DB4'
  }), []);

  const getCheapestKTXSafe = (university: University): number | null => {
    const commonFees = university?.koreanData?.commonFeesVND ?? [];
    const ktxFees = commonFees.filter(fee => {
      const name = String(fee.name ?? '').toLowerCase();
      return name.includes('ktx') || name.includes('ký túc xá') || name.includes('ki tuc xa');
    });
    if (ktxFees.length === 0) return null;
    const amounts = ktxFees.map(fee => fee.amount ?? 0).filter(a => a > 0);
    return amounts.length ? Math.min(...amounts) : null;
  };

  const getMinGPASafe = (university: University): number | null => {
    const admission = university?.koreanData?.admission ?? {};
    const gpas = Object.values(admission)
      .map(a => {
        const g = parseFloat(String((a as any)?.gpaMin ?? '0'));
        return isFinite(g) && g > 0 ? g : null;
      })
      .filter(g => g !== null);
    return gpas.length ? Math.min(...gpas) : null;
  };

  const getMaxScholarshipSafe = (university: University): number => {
    try {
      return getMaxScholarship(university as any) ?? 0;
    } catch {
      return 0;
    }
  };

  const PERK_FILTERS = [
    { key: 'all', label: 'Tất cả' },
    { key: 'hb100', label: 'HB 100%', match: (u: University) => getMaxScholarshipSafe(u) === 100 },
    { key: 'hb50', label: 'HB 50%+', match: (u: University) => getMaxScholarshipSafe(u) >= 50 },
    { key: 'gpa65', label: 'GPA ≤ 6.5', match: (u: University) => {
      const minGpa = getMinGPASafe(u);
      return minGpa !== null && minGpa <= 6.5;
    }},
    { key: 'ktx', label: 'Có KTX', match: (u: University) => getCheapestKTXSafe(u) !== null },
    { key: 'vl', label: 'Việc làm', match: (u: University) => !!u.koreanData?.jobOpportunities || !!(u?.koreanData?.workOpportunity) }
  ];

  const filteredUniversities = useMemo(() => {
    const safeUniversities = (universities ?? []).filter(u => u && u.id && u.name && u.koreanData);

    return safeUniversities.filter(university => {
      if (university.is_active === false) return false;
      if (!university.koreanData?.isKoreanUniversity) return false;

      if (activeTier !== 'all') {
        const tierMatch =
          (activeTier === '1' && university.koreanData?.topTier === 'Top1') ||
          (activeTier === '2' && university.koreanData?.topTier === 'Top2') ||
          (activeTier === '3' && university.koreanData?.topTier === 'Top3');
        if (!tierMatch) return false;
      }

      if (activePerk !== 'all') {
        const perkDef = PERK_FILTERS.find(p => p.key === activePerk);
        if (perkDef?.match && !perkDef.match(university)) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const searchable = [university.name, university.koreanName, university.koreanData?.address]
          .join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [universities, activeTier, activePerk, searchTerm]);

  const sortedUniversities = useMemo(() => {
    return [...filteredUniversities].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredUniversities]);

  const tierCounts = useMemo(() => {
    const koreanUnis = universities.filter(u => u.koreanData?.isKoreanUniversity);
    const counts = { all: koreanUnis.length, '1': 0, '2': 0, '3': 0 } as Record<string, number>;
    koreanUnis.forEach(uni => {
      if (uni.koreanData?.topTier === 'Top1') counts['1']++;
      else if (uni.koreanData?.topTier === 'Top2') counts['2']++;
      else if (uni.koreanData?.topTier === 'Top3') counts['3']++;
    });
    return counts;
  }, [universities]);

  useEffect(() => {
    setLoading(false);
  }, [filteredUniversities]);

  const tierFilters = [
    { key: 'all', label: 'Tất cả', count: tierCounts.all },
    { key: '1', label: 'Top 1', count: tierCounts['1'] },
    { key: '2', label: 'Top 2', count: tierCounts['2'] },
    { key: '3', label: 'Top 3', count: tierCounts['3'] }
  ];

  return (
    <div style={{ padding: '24px 28px 32px', background: 'linear-gradient(180deg, #FBF7F2 0%, #F4EEE7 100%)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: palette.text, marginBottom: 6 }}>Danh sách trường đại học</h1>
          <p style={{ fontSize: 13, color: palette.textMuted }}>
            {filteredUniversities.length} trường · Lọc theo ưu đãi
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ flex: '1 1 260px', minWidth: 240 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: palette.textMuted }} />
            <input
              type="text"
              placeholder="Tìm tên trường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: 38,
                paddingRight: 16,
                paddingTop: 9,
                paddingBottom: 9,
                borderRadius: 12,
                border: `1px solid ${palette.border}`,
                fontSize: 13,
                background: palette.cardBg,
                color: palette.text,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', flex: '1 1 320px' }}>
          {PERK_FILTERS.map(perk => {
            const active = activePerk === perk.key;
            return (
              <button
                key={perk.key}
                onClick={() => setActivePerk(perk.key)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: `1px solid ${active ? palette.chipActiveBorder : palette.border}`,
                  background: active ? palette.chipActiveBg : palette.chipBg,
                  color: active ? palette.accent : palette.textMuted,
                  fontWeight: active ? 600 : 500
                }}
              >
                {perk.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: palette.textMuted }}>Visa</span>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: 2,
          borderRadius: 999,
          border: `1px solid ${palette.border}`,
          background: palette.cardBg
        }}>
          {tierFilters.map(filter => {
            const active = activeTier === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setActiveTier(filter.key)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  border: 'none',
                  background: active ? palette.accentSoft : 'transparent',
                  color: active ? palette.accent : palette.textMuted,
                  fontWeight: active ? 600 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {filter.label}
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 999,
                  fontSize: 10,
                  background: active ? palette.accent : '#EEE6DD',
                  color: active ? '#fff' : palette.textMuted,
                  fontWeight: 600
                }}>
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Header */}
      {!loading && filteredUniversities.length > 0 && (
        <div style={{
          display: 'flex',
          padding: '10px 16px',
          fontSize: 11,
          fontWeight: 600,
          color: palette.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          marginBottom: 6,
          background: '#F4EFE8',
          border: `1px solid ${palette.border}`,
          borderRadius: 10,
        }}>
          <span style={{ width: 340 }}>Trường</span>
          <span style={{ width: 180, textAlign: 'right' }}>Tổng chi phí (D4-1)</span>
          <span style={{ width: 180, paddingLeft: 20 }}>Ưu đãi nổi bật</span>
          <span style={{ width: 160, paddingLeft: 20 }}>Học bổng tốt nhất</span>
          <span style={{ flex: 1, textAlign: 'right' }}></span>
        </div>
      )}

      {/* University List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: palette.textMuted, fontSize: 14 }}>Đang tải...</div>
      ) : filteredUniversities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: palette.textMuted, fontSize: 14 }}>Không tìm thấy trường nào</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedUniversities.map((university) => (
            <StudentUniversityRow
              key={university.id}
              university={university}
              palette={palette}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{
        marginTop: 12,
        padding: '10px 12px',
        background: '#F4EFE8',
        borderRadius: 10,
        fontSize: 11,
        color: palette.textMuted,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        border: `1px solid ${palette.border}`
      }}>
        <span>HB = Học bổng giảm học phí theo TOPIK</span>
        <span>KTX = Ký túc xá trong trường</span>
        <span>Việc làm = Khu vực có việc làm thêm</span>
        <span>GPA = Điều kiện xét tuyển</span>
      </div>
    </div>
  );
}
