import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { getMaxScholarship } from '../../utils/universityPerks';
import UniversityForm from './UniversityForm';
import EditUniversityModal from './EditUniversityModal';
import QuickInfoModal from './QuickInfoModal';
import ImportUniversitiesModal from './ImportUniversitiesModal';
import type { University } from '../context/AppContext';
import { getAllUniversities } from '../services/universityService';

interface UniversityRowProps {
  university: University;
  onEdit?: (uni: University) => void;
  onQuickInfo?: (uni: University) => void;
  palette: any;
}

function UniversityRow({ university, onEdit, onQuickInfo, palette }: UniversityRowProps) {
  const navigate = useNavigate();
  
  const formatKRW = (amount?: number | null) => Number(amount ?? 0).toLocaleString('vi-VN');
  const formatVND = (amount?: number | null) => Number(amount ?? 0).toLocaleString('vi-VN');
  
  const visaSystems = university?.koreanData?.visaSystemsDetail || {};
  const d41Data = visaSystems['D4-1'];
  const hasD41 = d41Data?.available;
  
  // Calculate Tổng (Total) for D4-1 system
  const calculateTotal = () => {
    // Fixed VND fees (common across all systems)
    const commonFees = university?.koreanData?.commonFeesVND || [];
    const hocTieng = commonFees.find((f: any) => f.id === 'hoc_tieng')?.amount || 13000000;
    const phiTuVan = commonFees.find((f: any) => f.id === 'phi_tu_van')?.amount || 39000000;
    const phiTrungTam = commonFees.find((f: any) => f.id === 'phi_trung_tam')?.amount || 11000000;
    const veMayBay = commonFees.find((f: any) => f.id === 've_may_bay')?.amount || 8000000;
    
    // Total VND (base fixed costs)
    const totalVND = hocTieng + phiTuVan + phiTrungTam + veMayBay;
    
    // KRW costs from D4-1
    if (hasD41 && d41Data) {
      const applyFee = d41Data.applyFeeKRW || 0;
      const enrollmentFee = d41Data.enrollmentFeeKRW || 0;
      const invoice = d41Data.invoiceKRWPerYear || 0;
      
      // Get cheapest KTX option
      const ktxOptions = d41Data.ktxOptions || [];
      const cheapestKTX = ktxOptions.length > 0 
        ? Math.min(...ktxOptions.map((k: any) => k.priceKRWPerKy || 0))
        : 0;
      
      const totalKRW = applyFee + enrollmentFee + invoice + cheapestKTX;
      
      return { totalVND, totalKRW, hasData: true };
    }
    
    return { totalVND, totalKRW: 0, hasData: false };
  };
  
  const { totalVND, totalKRW, hasData } = calculateTotal();
  
  const availableVisas = Object.entries(visaSystems)
    .filter(([_, data]: [string, any]) => data?.available)
    .map(([key, _]) => key);
  
  const scholarships = d41Data?.scholarships || [];
  const bestScholarship = scholarships.reduce((max: any, s: any) => 
    (s?.discountPct || 0) > (max?.discountPct || 0) ? s : max, null
  );
  
  const ktxOptions = d41Data?.ktxOptions || [];
  const bestKtx = ktxOptions[0];
  
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
      onClick={() => navigate(`/admin/university/${university.id}`)}
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
            
            {/* Visa Tags */}
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

      {/* Column 2: Tổng chi phí ước tính */}
      <div style={{ width: 180, flexShrink: 0, textAlign: 'right' }}>
        {hasData ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 700, color: palette.text }}>
              {formatVND(totalVND)}đ
            </div>
            <div style={{ fontSize: 11, color: palette.textMuted }}>
              + {formatKRW(totalKRW)} KRW
            </div>
            <div style={{ fontSize: 10, color: '#2D8C4E', marginTop: 2 }}>
              D4-1 ước tính
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

      {/* Column 5: Actions */}
      <div style={{ flex: 1, textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {onQuickInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickInfo(university);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${palette.border}`,
                background: '#fff',
                color: palette.text,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              TT
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(university);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${palette.accent}`,
                background: palette.accent,
                color: '#fff',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Sửa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface UniversitiesListEnhancedProps {
  onUniversitySelect?: (university: University) => void;
}

export default function UniversitiesListEnhancedRedesigned() {
  const { universities, setUniversities, updateUniversity, addUniversities } = useApp();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  // Debug logging
  console.log('UniversitiesListEnhancedRedesigned - isAdmin:', isAdmin, 'user:', user);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<string>('all');
  const [activePerk, setActivePerk] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [quickInfoUniversity, setQuickInfoUniversity] = useState<University | null>(null);

  const palette = {
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
  };

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

  // Reload universities from SQLite on mount to get latest updates
  useEffect(() => {
    const reloadUniversities = async () => {
      try {
        const dbUniversities = await getAllUniversities();
        if (dbUniversities.length > 0) {
          // Parse the universities to match the expected format
          const parsedUniversities = dbUniversities.map((u: any) => ({
            ...u,
            koreanData: typeof u.korean_data === 'string' 
              ? JSON.parse(u.korean_data) 
              : u.koreanData || u.korean_data || {}
          }));
          setUniversities(() => parsedUniversities);
        }
      } catch (error) {
        console.error('Failed to reload universities:', error);
      } finally {
        setLoading(false);
      }
    };

    reloadUniversities();
  }, []);

  useEffect(() => {
    setLoading(false);
  }, [filteredUniversities]);

  return (
    <div style={{ padding: '24px 28px 32px', background: 'linear-gradient(180deg, #FBF7F2 0%, #F4EEE7 100%)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: palette.text, marginBottom: 6 }}>Danh sách trường</h1>
          <p style={{ fontSize: 13, color: palette.textMuted }}>
            {filteredUniversities.length} trường · Lọc theo ưu đãi
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  background: palette.cardBg,
                  color: palette.text,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Import CSV
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 10,
                  border: '1px solid transparent',
                  background: palette.accent,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} />
                Thêm trường
              </button>
            </>
          )}
        </div>
      </div>

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
          <span style={{ flex: 1, textAlign: 'right' }}>Thao tác</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: palette.textMuted, fontSize: 14 }}>Đang tải...</div>
      ) : filteredUniversities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: palette.textMuted, fontSize: 14 }}>Không tìm thấy trường nào</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortedUniversities.map((university) => (
            <UniversityRow
              key={university.id}
              university={university}
              onEdit={isAdmin ? (uni) => setEditingUniversity(uni) : undefined}
              onQuickInfo={isAdmin ? (uni) => setQuickInfoUniversity(uni) : undefined}
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

      {showAddModal && (
        <UniversityForm
          onClose={() => setShowAddModal(false)}
          onSave={(data) => {
            // Cast data to access form fields
            const formData = data as any;
            // Create complete university object
            const newUniversity: University = {
              id: `uni-${Date.now()}`,
              name: formData.name || '',
              koreanName: formData.koreanName,
              country: formData.country || 'South Korea',
              countryCode: '🇰🇷',
              region: formData.region,
              ranking: formData.ranking,
              top_tier: formData.topTier,
              description: formData.overview,
              systems: [] as any[],
              majors: formData.majors || [],
              overview: formData.overview,
              galleryImages: formData.galleryImages,
              generalTuition: formData.generalTuition,
              visaFee: formData.visaFee,
              accommodationFee: formData.accommodationFee,
              insuranceFee: formData.insuranceFee,
              additionalFees: formData.additionalFees,
              koreanData: {
                isKoreanUniversity: true,
                topTier: formData.topTier || 'Top2',
                address: formData.region,
                koreanRanking: formData.ranking,
                majors: formData.majors || [],
                jobOpportunities: formData.partTimeInfo,
                workOpportunity: formData.partTimeInfo,
                supportPolicies: formData.supportPolicies || [],
                refundPolicy: formData.refundPolicy,
                admissionsType: formData.admissionsType
              } as any
            };
            addUniversities([newUniversity]);
            toast.success('Thêm trường thành công!');
            setShowAddModal(false);
          }}
        />
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

      {editingUniversity && (
        <EditUniversityModal
          university={editingUniversity}
          onClose={() => setEditingUniversity(null)}
          onSave={async (data) => {
            await updateUniversity(editingUniversity.id, data);
            toast.success('Cập nhật trường thành công!');
            setEditingUniversity(null);
          }}
        />
      )}

      {isAdmin && quickInfoUniversity && (
        <QuickInfoModal
          university={quickInfoUniversity}
          onClose={() => setQuickInfoUniversity(null)}
          onSaved={(payload) => {
            updateUniversity(quickInfoUniversity.id, payload);
            toast.success('Đã lưu thông tin hiển thị!');
          }}
        />
      )}
    </div>
  );
}
