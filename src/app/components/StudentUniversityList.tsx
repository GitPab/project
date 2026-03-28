import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Search, MapPin, Home, Briefcase, Award } from 'lucide-react';
import { getMaxScholarship } from '../../utils/universityPerks';
import type { University } from '../context/AppContext';
import { getAllUniversities } from '../services/universityService';

interface StudentUniversityListProps {
  onUniversitySelect?: (university: University) => void;
}

const COLUMN_WIDTHS = {
  school: 300,
  price: 140,
  features: 200,
  scholarship: 200,
  actions: 120
};

export default function StudentUniversityList({ onUniversitySelect }: StudentUniversityListProps) {
  const { universities, setUniversities, user } = useApp();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTier, setActiveTier] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Reload universities from SQLite on mount to get latest updates from admin
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

  const filteredUniversities = useMemo(() => {
    return universities.filter((uni) => {
      const nameMatch = (uni.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ((uni as any).koreanName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const tierMatch = activeTier === 'all' || (uni as any).top_tier === `Top${activeTier}`;
      
      const filterMatch = activeFilter === 'all' || 
        (activeFilter === 'hb100' && getMaxScholarship(uni) === 100) ||
        (activeFilter === 'hb50' && getMaxScholarship(uni) >= 50) ||
        (activeFilter === 'gpa' && ((uni as any).gpa_requirement || 0) <= 6.5) ||
        (activeFilter === 'ktx' && ((uni as any).koreanData?.dormOptions?.length || 0) > 0) ||
        (activeFilter === 'job' && ((uni as any).koreanData?.jobOpportunities));

      return nameMatch && tierMatch && filterMatch;
    });
  }, [universities, searchTerm, activeTier, activeFilter]);

  const sortedUniversities = useMemo(() => {
    const tierOrder: Record<string, number> = { 'Top1': 1, 'Top2': 2, 'Top3': 3 };
    return [...filteredUniversities].sort((a, b) => {
      const tierA = tierOrder[(a as any).top_tier] || 4;
      const tierB = tierOrder[(b as any).top_tier] || 4;
      return tierA - tierB;
    });
  }, [filteredUniversities]);

  const handleUniversityClick = (uni: University) => {
    if (onUniversitySelect) {
      onUniversitySelect(uni);
    } else {
      navigate(`/${user?.role || 'student'}/university/${uni.id}`);
    }
  };

  const formatPrice = (amount?: number) => {
    if (!amount) return null;
    return amount.toLocaleString('vi-VN');
  };

  const getTierBadge = (tier?: string) => {
    switch(tier) {
      case 'Top1': return { bg: '#4CAF50', text: '#fff', label: '1' };
      case 'Top2': return { bg: '#FF9800', text: '#fff', label: '2' };
      case 'Top3': return { bg: '#F44336', text: '#fff', label: '3' };
      default: return { bg: '#9E9E9E', text: '#fff', label: '-' };
    }
  };

  const totalWidth = Object.values(COLUMN_WIDTHS).reduce((a, b) => a + b, 0) + 80; // +80 for gaps

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: '#333', marginBottom: 8 }}>
            Danh sách trường
          </h1>
          <p style={{ fontSize: 13, color: '#666' }}>
            {sortedUniversities.length} trường · Lọc theo ưu đãi
          </p>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Tìm tên trường..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: 14,
                background: '#fff',
              }}
            />
          </div>
          
          {/* Tier Pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'all', label: 'Tất cả', count: universities.length },
              { key: '1', label: 'Top 1', count: universities.filter(u => (u as any).top_tier === 'Top1').length },
              { key: '2', label: 'Top 2', count: universities.filter(u => (u as any).top_tier === 'Top2').length },
              { key: '3', label: 'Top 3', count: universities.filter(u => (u as any).top_tier === 'Top3').length },
            ].map((tier) => (
              <button
                key={tier.key}
                onClick={() => setActiveTier(tier.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: 'none',
                  background: activeTier === tier.key ? '#1B5FC7' : '#fff',
                  color: activeTier === tier.key ? '#fff' : '#666',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {tier.label} {tier.count > 0 && <span style={{ opacity: 0.7 }}>({tier.count})</span>}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          {[
            { key: 'hb100', label: 'HB 100%', icon: <Award size={14} /> },
            { key: 'hb50', label: 'HB 50%+', icon: <Award size={14} /> },
            { key: 'gpa', label: 'GPA ≤ 6.5', icon: <Award size={14} /> },
            { key: 'ktx', label: 'Có KTX', icon: <Home size={14} /> },
            { key: 'job', label: 'Việc làm', icon: <Briefcase size={14} /> },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(activeFilter === f.key ? 'all' : f.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 20,
                border: '1px solid #ddd',
                background: activeFilter === f.key ? '#E3F2FD' : '#fff',
                color: activeFilter === f.key ? '#1976D2' : '#666',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Table Container */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: totalWidth }}>
            {/* Table Header */}
            <div style={{
              display: 'flex',
              gap: 16,
              padding: '12px 20px',
              background: '#FFF8E1',
              borderRadius: '8px 8px 0 0',
              fontSize: 12,
              fontWeight: 600,
              color: '#666',
              borderBottom: '2px solid #FFE082',
            }}>
              <div style={{ width: COLUMN_WIDTHS.school }}>TRƯỜNG</div>
              <div style={{ width: COLUMN_WIDTHS.price }}>HỌC PHÍ THẤP NHẤT</div>
              <div style={{ width: COLUMN_WIDTHS.features }}>ƯU ĐÃI NỔI BẬT</div>
              <div style={{ width: COLUMN_WIDTHS.scholarship }}>HỌC BỔNG TỐT NHẤT</div>
              <div style={{ width: COLUMN_WIDTHS.actions, textAlign: 'center' }}>THAO TÁC</div>
            </div>

            {/* University Cards */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Đang tải...</div>
              ) : sortedUniversities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Không tìm thấy trường nào phù hợp</div>
              ) : (
                sortedUniversities.map((uni, index) => {
                  const tier = (uni as any).top_tier;
                  const tierBadge = getTierBadge(tier);
                  const koreanData = (uni as any).koreanData || {};
                  const visaSystemsDetail = koreanData.visaSystemsDetail || {};
                  
                  // Get D4-1 data
                  const d41Data = visaSystemsDetail['D4-1'];
                  const hasD41 = d41Data?.available;
                  const d41Price = d41Data?.invoiceKRWPerYear;
                  const d41Gpa = koreanData.admission?.['D4-1']?.gpaMin;
                  
                  // Get other visa systems
                  const availableVisas = Object.entries(visaSystemsDetail)
                    .filter(([_, data]: [string, any]) => data?.available)
                    .map(([key, _]) => key);

                  // Get scholarships for display
                  const scholarships = d41Data?.scholarships || [];
                  const bestScholarship = scholarships.reduce((max: any, s: any) => 
                    (s?.discountPct || 0) > (max?.discountPct || 0) ? s : max, null
                  );

                  // Get KTX options
                  const ktxOptions = d41Data?.ktxOptions || [];
                  const bestKtx = ktxOptions[0];

                  return (
                    <div
                      key={uni.id}
                      style={{
                        display: 'flex',
                        gap: 16,
                        alignItems: 'stretch',
                        padding: '16px 20px',
                        background: '#fff',
                        borderRadius: index === sortedUniversities.length - 1 ? '0 0 8px 8px' : 0,
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleUniversityClick(uni)}
                    >
                      {/* Column 1: School Info - Fixed Width */}
                      <div style={{ width: COLUMN_WIDTHS.school, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: (uni as any).koreanData?.listLogo || (uni as any).thumbnail 
                              ? 'transparent' 
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 20,
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}>
                            {(uni as any).koreanData?.listLogo || (uni as any).thumbnail ? (
                              <img 
                                src={(uni as any).koreanData?.listLogo || (uni as any).thumbnail} 
                                alt={uni.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                  (e.currentTarget.parentElement as HTMLElement).textContent = '🏫';
                                }}
                              />
                            ) : '🏫'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#333', margin: 0 }}>
                                Đại học {uni.name}
                              </h3>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 700,
                                background: tierBadge.bg,
                                color: tierBadge.text,
                              }}>
                                {tierBadge.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: '#666', margin: '0 0 2px 0' }}>
                              {uni.koreanName}
                            </p>
                            <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
                              <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
                              {uni.region || 'Hàn Quốc'}
                            </p>
                            
                            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                              {availableVisas.slice(0, 5).map((visa) => (
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

                      {/* Column 2: Price Info - Fixed Width */}
                      <div style={{ 
                        width: COLUMN_WIDTHS.price, 
                        flexShrink: 0,
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                      }}>
                        {hasD41 && d41Price ? (
                          <>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#1976D2', marginBottom: 4 }}>
                              {formatPrice(d41Price)} KRW
                            </div>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>
                              D4-1 · mỗi kỳ
                            </div>
                            {d41Gpa && (
                              <div style={{ fontSize: 11, color: '#888' }}>
                                GPA ≥ {d41Gpa}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>Chưa cập nhật</span>
                        )}
                      </div>

                      {/* Column 3: Features - Fixed Width */}
                      <div style={{ 
                        width: COLUMN_WIDTHS.features, 
                        flexShrink: 0,
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 6, 
                        justifyContent: 'center' 
                      }}>
                        {bestScholarship && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: 12,
                              fontSize: 11,
                              background: '#E8F5E9',
                              color: '#2E7D32',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}>
                              <Award size={12} />
                              HB đến {bestScholarship.discountPct}%
                            </span>
                          </div>
                        )}
                        {bestKtx && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
                            <Home size={14} color="#1976D2" />
                            <span>KTX từ {formatPrice(bestKtx.priceKRWPerKy)} KRW</span>
                          </div>
                        )}
                        {koreanData.jobOpportunities && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666' }}>
                            <Briefcase size={14} color="#F57C00" />
                            <span>Việc làm {koreanData.jobOpportunities}</span>
                          </div>
                        )}
                      </div>

                      {/* Column 4: Scholarship Bar - Fixed Width */}
                      <div style={{ 
                        width: COLUMN_WIDTHS.scholarship, 
                        flexShrink: 0,
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center' 
                      }}>
                        {bestScholarship ? (
                          <>
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
                              D2-2 · TOPIK {bestScholarship.topikLevel || 6}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                flex: 1,
                                height: 8,
                                background: '#E0E0E0',
                                borderRadius: 4,
                                overflow: 'hidden',
                              }}>
                                <div style={{
                                  width: `${bestScholarship.discountPct}%`,
                                  height: '100%',
                                  background: bestScholarship.discountPct >= 70 ? '#4CAF50' : 
                                             bestScholarship.discountPct >= 40 ? '#8BC34A' : '#FFC107',
                                  borderRadius: 4,
                                  transition: 'width 0.3s',
                                }} />
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: bestScholarship.discountPct >= 70 ? '#4CAF50' : '#666', minWidth: 35 }}>
                                {bestScholarship.discountPct}%
                              </span>
                            </div>
                            <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                              TOPIK {bestScholarship.topikLevel || '3→6'}: {scholarships.map((s: any) => `${s.discountPct}%`).join('/')}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: '#999' }}>Không có HB</span>
                        )}
                      </div>

                      {/* Column 5: Actions - Fixed Width */}
                      <div style={{ 
                        width: COLUMN_WIDTHS.actions, 
                        flexShrink: 0,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 8 
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUniversityClick(uni);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: '1px solid #ddd',
                            background: '#fff',
                            color: '#333',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Xem
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Legend */}
        <div style={{
          marginTop: 20,
          padding: '12px 16px',
          background: '#fff',
          borderRadius: 8,
          fontSize: 11,
          color: '#666',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 20px',
        }}>
          <span><strong style={{ color: '#4CAF50' }}>●</strong> HB = Học bổng giảm học phí theo TOPIK</span>
          <span><strong style={{ color: '#1976D2' }}>●</strong> KTX = Ký túc xá trong trường</span>
          <span><strong style={{ color: '#F57C00' }}>●</strong> = Khu vực có việc làm thêm</span>
          <span><strong>GPA</strong> = Điều kiện xét tuyển</span>
        </div>
      </div>
    </div>
  );
}
