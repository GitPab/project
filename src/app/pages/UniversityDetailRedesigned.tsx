import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useParams, useNavigate } from 'react-router';
import { ChevronDown, ChevronUp, Info, MapPin, GraduationCap, Building2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import StudentFixedSidebar from '../components/StudentFixedSidebar';
import {
  DEFAULT_FEES_VND,
  DEFAULT_SO_TIET_KIEM_OPTIONS,
  EXCHANGE_RATES,
  DEFAULT_ADMISSION,
  DEFAULT_FINANCIAL,
  VISA_FALLBACKS,
  PRICE_CALCULATION
} from '../../constants/feeDefaults';

// All visa systems - matching CostInputForm
const ALL_VISA_SYSTEMS = [
  { key: 'D4-1', label: 'D4-1', subLabel: 'Hệ tiếng', name: 'Hệ tiếng Hàn' },
  { key: 'D2-1', label: 'D2-1', subLabel: 'Dự bị ĐH', name: 'Dự bị đại học' },
  { key: 'D2-2', label: 'D2-2', subLabel: 'Đại học', name: 'Đại học chính quy' },
  { key: 'D2-3', label: 'D2-3', subLabel: 'Sau ĐH', name: 'Thạc sĩ' },
  { key: 'D2-3P', label: 'D2-3', subLabel: 'Tiến sĩ', name: 'Tiến sĩ' },
  { key: 'D2-6', label: 'D2-6', subLabel: 'Nghiên cứu', name: 'Nghiên cứu sinh' },
  { key: 'D2-6E', label: 'Trao đổi', subLabel: 'Trao đổi', name: 'Sinh viên trao đổi' },
  { key: 'D2-8', label: 'Ngắn hạn', subLabel: 'Ngắn hạn', name: 'Chương trình ngắn hạn' },
];

// Sub-items for Phí trung tâm thu hộ
const PHI_TRUNG_TAM_SUB_ITEMS = [
  'Phí công chứng',
  'Tem vàng / Tem tím',
  'Xin visa',
  'Khám sức khoẻ',
  'Ship hồ sơ tại Việt Nam',
  'Ship hồ sơ sang trường',
  'Đưa đón tại Hàn Quốc',
  'Tìm ký túc xá'
];

// Helper to format currency
const formatVND = (amount: number) => amount.toLocaleString('vi-VN');
const formatKRW = (amount: number) => amount.toLocaleString('vi-VN');

// Helper to normalize visa data from CostInputForm (snake_case) to display format (camelCase)
const normalizeVisaData = (rawData: any) => {
  if (!rawData) return null;
  
  // Handle both snake_case (from CostInputForm) and camelCase (from types)
  const invoiceKRW = rawData.invoice_krw ?? rawData.invoiceKRWPerYear ?? rawData.invoiceKRW ?? 0;
  const applyFeeKRW = rawData.apply_fee_krw ?? rawData.applyFeeKRW ?? 0;
  const enrollmentFeeKRW = rawData.enrollment_fee_krw ?? rawData.enrollmentFeeKRW ?? 0;
  
  // Normalize scholarships
  const scholarships = (rawData.scholarships || []).map((s: any) => ({
    topikLevel: s.topik_level ?? s.topikLevel ?? 0,
    discountPct: s.discount_pct ?? s.discountPct ?? 0,
    condition: s.condition || `TOPIK ${s.topik_level || s.topikLevel || 0}`
  }));
  
  // Normalize KTX options
  const ktxOptions = (rawData.ktx_options || rawData.ktxOptions || []).map((k: any) => ({
    name: k.name || '',
    priceKRWPerKy: k.price_krw ?? k.priceKRWPerKy ?? 0
  }));
  
  // Normalize sổ tiết kiệm options
  const soTietKiemOptions = (rawData.so_tiet_kiem_options || rawData.soTietKiemOptions || []).map((s: any) => ({
    label: s.label || '',
    amountKRW: s.amount_krw ?? s.amountKRW ?? 0
  }));
  
  // Get luiNThang (months to backdate)
  const financialReq = rawData.financialRequirement || {};
  const luiNThang = financialReq.luiNThang ?? rawData.lui_n_thang ?? DEFAULT_FINANCIAL.luiNThang;
  
  // Get admission requirements (snake_case from CostInputForm)
  const gpaMin = rawData.gpa_min ?? rawData.gpaMin ?? DEFAULT_ADMISSION.gpaMin;
  const gapYearLimit = rawData.gap_year_limit ?? rawData.gapYearLimit ?? DEFAULT_ADMISSION.gapYearLimit;
  
  return {
    available: rawData.available ?? false,
    invoiceKRWPerYear: invoiceKRW,
    applyFeeKRW,
    enrollmentFeeKRW,
    scholarships,
    ktxOptions,
    financialRequirement: {
      soTietKiemOptions,
      luiNThang
    },
    admission: {
      gpaMin,
      gapYearLimit
    }
  };
};

// Helper to normalize common fees from CostInputForm
const normalizeCommonFees = (rawData: any) => {
  if (!rawData) return [];
  
  // If already array format (from types)
  if (Array.isArray(rawData)) return rawData;
  
  // If object format from CostInputForm (snake_case)
  const fees = [];
  
  if (rawData.hoc_tieng || rawData.hoc_tieng === 0) {
    fees.push({ id: 'hoc_tieng', name: 'Học tiếng Hàn', amount: rawData.hoc_tieng, editable: true });
  }
  if (rawData.phi_tu_van || rawData.phi_tu_van === 0) {
    fees.push({ id: 'phi_tu_van', name: 'Phí tư vấn', amount: rawData.phi_tu_van, editable: true });
  }
  if (rawData.phi_trung_tam || rawData.phi_trung_tam === 0) {
    fees.push({ id: 'phi_trung_tam', name: 'Phí trung tâm thu hộ', amount: rawData.phi_trung_tam, editable: true, subItems: PHI_TRUNG_TAM_SUB_ITEMS });
  }
  if (rawData.ve_may_bay) {
    fees.push({ id: 've_may_bay', name: 'Vé máy bay', amount: rawData.ve_may_bay.amount || DEFAULT_FEES_VND.veMayBay, optional: rawData.ve_may_bay.optional, editable: true });
  }
  if (rawData.ktx_vn) {
    fees.push({ id: 'ktx_vn', name: 'KTX Việt Nam', amountPerMonth: rawData.ktx_vn.amount_per_month || DEFAULT_FEES_VND.ktxVNPerMonth, optional: rawData.ktx_vn.optional, editable: true });
  }
  
  return fees;
};

// Hero Section Component - Modern Konkuk Style
const HeroSection = ({ university, availableCount, onContactClick }: { university: any; availableCount: number; onContactClick: () => void }) => {
  const ranking = university?.koreanData?.koreanRanking || university?.ranking;
  const topTier = university?.top_tier || university?.koreanData?.topTier || '';
  const address = university?.koreanData?.address || university?.region || 'Hàn Quốc';
  const koreanName = university?.koreanData?.koreanName || university?.koreanName || '';
  // Use heroImage for background, thumbnail for logo circle
  const logo = university?.thumbnail || university?.koreanData?.logo || university?.logo;
  const bannerImage = university?.heroImage || university?.koreanData?.bannerImage || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80';

  // TOP VISA badge colors based on tier
  const getTopVisaBadge = (tier: string) => {
    switch(tier) {
      case 'Top1': return { bg: '#4CAF50', label: '01' };
      case 'Top2': return { bg: '#FF9800', label: '02' };
      case 'Top3': return { bg: '#F44336', label: '03' };
      default: return { bg: '#9E9E9E', label: '-' };
    }
  };

  const topVisaBadge = getTopVisaBadge(topTier);
  
  return (
    <div style={{
      position: 'relative',
      borderRadius: 0,
      marginBottom: 24,
      overflow: 'hidden',
      minHeight: 280,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background Image with Blue Gradient Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `linear-gradient(135deg, rgba(0, 58, 183, 0.85) 0%, rgba(27, 63, 139, 0.9) 50%, rgba(0, 35, 120, 0.95) 100%), url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        zIndex: 1
      }} />
      
      {/* Top Navigation Bar */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* TBT Group Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 40,
            height: 40,
            background: '#fff',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#003AB7',
            fontSize: 18
          }}>
            TBT
          </div>
          <span style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: 1
          }}>
            TBT GROUP
          </span>
        </div>
        
        {/* CTA Button */}
        <button 
          onClick={onContactClick}
          style={{
            background: '#003AB7',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '10px 24px',
            borderRadius: 25,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}
        >
          Nhận tư vấn
        </button>
      </div>
      
      {/* Main Hero Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '40px 60px',
        gap: 40
      }}>
        {/* Left: University Info */}
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 8,
            textTransform: 'uppercase',
            letterSpacing: 2,
            textShadow: '0 2px 20px rgba(0,0,0,0.3)'
          }}>
            {university?.name}
          </h1>
          
          {koreanName && (
            <p style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 20,
              fontWeight: 500
            }}>
              {koreanName}
            </p>
          )}
          
          {/* Badges Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap'
          }}>
            {/* TOP VISA Badge */}
            <div style={{
              background: topVisaBadge.bg,
              color: '#fff',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '60px',
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                lineHeight: 1,
              }}>
                TOP VISA
              </span>
              <span style={{
                fontSize: '24px',
                fontWeight: 700,
                lineHeight: 1,
                marginTop: '2px',
              }}>
                {topVisaBadge.label}
              </span>
            </div>
            
            <span style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {address}
            </span>
            
            <span style={{
              fontSize: 14,
              color: '#fff',
              background: 'rgba(45, 140, 78, 0.8)',
              padding: '6px 14px',
              borderRadius: 20,
              fontWeight: 500
            }}>
              {availableCount} hệ du học
            </span>
          </div>
        </div>
        
        {/* Right: University Logo */}
        <div style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '4px solid rgba(255,255,255,0.5)',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {logo ? (
            <img 
              src={logo} 
              alt={university?.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{ fontSize: 60 }}>🏫</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Visa Cost Preview Cards
const VisaCostCards = ({ university }: { university: any }) => {
  const visaSystems = university?.koreanData?.visaSystemsDetail || {};
  
  // Get available systems and normalize their data
  const availableSystems = ALL_VISA_SYSTEMS
    .filter(v => {
      const raw = visaSystems[v.key];
      return raw?.available;
    })
    .slice(0, 3);
  
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
      {availableSystems.map(visa => {
        const rawData = visaSystems[visa.key];
        const data = normalizeVisaData(rawData);
        const invoice = data?.invoiceKRWPerYear || 0;
        
        // Format price display
        let priceDisplay = '';
        if (invoice >= PRICE_CALCULATION.million) {
          const min = (invoice * PRICE_CALCULATION.minFactor / PRICE_CALCULATION.million).toFixed(1);
          const max = (invoice * PRICE_CALCULATION.maxFactor / PRICE_CALCULATION.million).toFixed(1);
          priceDisplay = `${min}-${max}M`;
        } else if (invoice > 0) {
          priceDisplay = (invoice / PRICE_CALCULATION.thousand).toFixed(0) + 'K';
        } else {
          priceDisplay = 'Liên hệ';
        }
        
        return (
          <div key={visa.key} style={{
            background: '#fff',
            borderRadius: 12,
            padding: '16px 20px',
            minWidth: 100,
            textAlign: 'center',
            border: '1px solid #E8E8E8',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{visa.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#003AB7' }}>{priceDisplay}</div>
            <div style={{ fontSize: 11, color: '#888' }}>KRW/kỳ</div>
          </div>
        );
      })}
    </div>
  );
};

// Visa Selector Tabs
const VisaSelector = ({ 
  university, 
  selectedVisa, 
  onSelect 
}: { 
  university: any; 
  selectedVisa: string; 
  onSelect: (key: string) => void;
}) => {
  const visaSystems = university?.koreanData?.visaSystemsDetail || {};
  
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 12 }}>
        Chọn hệ du học
      </h3>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {ALL_VISA_SYSTEMS.map(visa => {
          const rawData = visaSystems[visa.key];
          const isAvailable = !!rawData?.available;
          const isSelected = selectedVisa === visa.key;
          
          return (
            <button
              key={visa.key}
              onClick={() => isAvailable && onSelect(visa.key)}
              disabled={!isAvailable}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 10,
                border: isSelected ? '2px solid #003AB7' : '1px solid #E0E0E0',
                background: isSelected ? '#F0F7FF' : '#fff',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                opacity: isAvailable ? 1 : 0.5
              }}
            >
              {/* Status dot */}
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isAvailable ? '#2D8C4E' : '#EF4444',
                flexShrink: 0
              }} />
              
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isSelected ? '#003AB7' : '#374151',
                  textDecoration: isAvailable ? 'none' : 'line-through'
                }}>
                  {visa.label}
                </div>
                <div style={{
                  fontSize: 11,
                  color: isAvailable ? '#2D8C4E' : '#EF4444'
                }}>
                  {isAvailable ? visa.subLabel : 'Không có'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Cost Controls Panel (Left side)
const CostControls = ({
  topikLevel,
  setTopikLevel,
  ktxRoom,
  setKtxRoom,
  soTietKiem,
  setSoTietKiem,
  ktxVN,
  setKtxVN,
  flight,
  setFlight,
  visaData,
}: any) => {
  const ktxOptions = visaData?.ktxOptions || [];
  const soTietKiemOptions = (visaData?.financialRequirement?.soTietKiemOptions?.length > 0)
    ? visaData.financialRequirement.soTietKiemOptions
    : DEFAULT_SO_TIET_KIEM_OPTIONS;
  const scholarships = visaData?.scholarships || [];
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #E8E8E8'
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>
        Tùy chỉnh chi phí
      </h3>
      
      {/* TOPIK Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
          Học bổng & học phí
        </div>
        <label style={{ fontSize: 13, color: '#444', marginBottom: 6, display: 'block' }}>
          Trình độ TOPIK
        </label>
        <select
          value={topikLevel}
          onChange={(e) => setTopikLevel(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #D0D0D0',
            fontSize: 14,
            background: '#fff',
            cursor: 'pointer',
            pointerEvents: 'auto',
            WebkitAppearance: 'menulist',
            MozAppearance: 'menulist',
            appearance: 'menulist'
          }}
        >
          <option value={0}>Chưa có TOPIK</option>
          {scholarships.map((s: any, idx: number) => (
            <option key={idx} value={s.topikLevel}>TOPIK {s.topikLevel} - Giảm {s.discountPct}%</option>
          ))}
        </select>
        
        {/* Show scholarship details if available */}
        {scholarships.length > 0 && (
          <div style={{ marginTop: 8, padding: 10, background: '#F0F7FF', borderRadius: 6, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: '#003AB7', marginBottom: 4 }}>Chính sách học bổng:</div>
            {scholarships.map((s: any, idx: number) => (
              <div key={idx} style={{ color: '#444', marginBottom: 2 }}>
                TOPIK {s.topikLevel}: Giảm {s.discountPct}% học phí
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* KTX Korea Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
          Ký túc xá tại Hàn
        </div>
        <label style={{ fontSize: 13, color: '#444', marginBottom: 6, display: 'block' }}>
          Loại phòng KTX
        </label>
        <select
          value={ktxRoom}
          onChange={(e) => setKtxRoom(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #D0D0D0',
            fontSize: 14,
            cursor: 'pointer',
            pointerEvents: 'auto',
            WebkitAppearance: 'menulist',
            MozAppearance: 'menulist',
            appearance: 'menulist'
          }}
        >
          {ktxOptions.map((opt: any, idx: number) => (
            <option key={idx} value={idx}>{opt.name} ({formatKRW(opt.priceKRWPerKy)}KRW)</option>
          ))}
          {ktxOptions.length === 0 && <option value={-1}>Chưa có dữ liệu KTX</option>}
          <option value={-1}>Tự thuê ngoài</option>
        </select>
        
        {/* Show KTX options details */}
        {ktxOptions.length > 0 && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
            {ktxOptions.length} loại phòng có sẵn
          </div>
        )}
      </div>
      
      {/* Sổ tiết kiệm Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
          Sổ tiết kiệm (Visa)
        </div>
        <label style={{ fontSize: 13, color: '#444', marginBottom: 6, display: 'block' }}>
          Loại sổ
        </label>
        <select
          value={soTietKiem}
          onChange={(e) => setSoTietKiem(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #D0D0D0',
            fontSize: 14,
            cursor: 'pointer',
            pointerEvents: 'auto',
            WebkitAppearance: 'menulist',
            MozAppearance: 'menulist',
            appearance: 'menulist'
          }}
        >
          {soTietKiemOptions.map((opt: any, idx: number) => (
            <option key={idx} value={idx}>{opt.label} - {formatKRW(opt.amountKRW)} KRW</option>
          ))}
          {soTietKiemOptions.length === 0 && (
            <option value={0}>{DEFAULT_SO_TIET_KIEM_OPTIONS[0].label} - {formatKRW(DEFAULT_SO_TIET_KIEM_OPTIONS[0].amountKRW)} KRW</option>
          )}
        </select>
        
        {/* Show financial requirement note */}
        {visaData?.financialRequirement?.luiNThang && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#666' }}>
            <Info size={12} />
            <span>Sổ cần lùi {visaData.financialRequirement.luiNThang} tháng</span>
          </div>
        )}
      </div>
      
      {/* Other Options */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase' }}>
          Tùy chọn khác
        </div>
        
        <label style={{ fontSize: 13, color: '#444', marginBottom: 6, display: 'block' }}>
          KTX tại Việt Nam
        </label>
        <select
          value={ktxVN}
          onChange={(e) => setKtxVN(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid #D0D0D0',
            fontSize: 14,
            marginBottom: 12,
            cursor: 'pointer',
            pointerEvents: 'auto',
            WebkitAppearance: 'menulist',
            MozAppearance: 'menulist',
            appearance: 'menulist'
          }}
        >
          <option value={0}>Không ở</option>
          {[1,2,3,4,5,6].map(m => (
            <option key={m} value={m}>{m} tháng - {formatVND(m * DEFAULT_FEES_VND.ktxVNPerMonth)}đ</option>
          ))}
        </select>
      </div>
      
      {/* Flight checkbox */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px',
        background: '#F8F9FA',
        borderRadius: 8,
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={flight}
          onChange={(e) => setFlight(e.target.checked)}
          style={{ width: 18, height: 18 }}
        />
        <span style={{ fontSize: 14, color: '#444' }}>Vé máy bay 1 chiều</span>
      </label>
    </div>
  );
};

// Fee Breakdown Panel (Right side)
const FeeBreakdown = ({
  commonFees: rawCommonFees,
  visaData,
  topikLevel,
  ktxRoom,
  soTietKiem,
  ktxVN,
  flight
}: any) => {
  const [expanded, setExpanded] = useState(false);
  
  // Normalize common fees
  const commonFees = normalizeCommonFees(rawCommonFees);
  
  // Get fee amounts with fallbacks
  const hocTiengFee = commonFees.find((f: any) => f.id === 'hoc_tieng');
  const phiTuVanFee = commonFees.find((f: any) => f.id === 'phi_tu_van');
  const phiTrungTamFee = commonFees.find((f: any) => f.id === 'phi_trung_tam');
  const veMayBayFee = commonFees.find((f: any) => f.id === 've_may_bay');
  const ktxVNFee = commonFees.find((f: any) => f.id === 'ktx_vn');
  
  const hocTieng = hocTiengFee?.amount || DEFAULT_FEES_VND.hocTieng;
  const phiTuVan = phiTuVanFee?.amount || DEFAULT_FEES_VND.phiTuVan;
  const phiTrungTam = phiTrungTamFee?.amount || DEFAULT_FEES_VND.phiTrungTam;
  const veMayBay = flight ? (veMayBayFee?.amount || DEFAULT_FEES_VND.veMayBay) : 0;
  const ktxVNCost = ktxVN * (ktxVNFee?.amountPerMonth || DEFAULT_FEES_VND.ktxVNPerMonth);
  
  // Get visa-specific amounts
  const applyFee = visaData?.applyFeeKRW || 0;
  const enrollmentFee = visaData?.enrollmentFeeKRW || 0;
  const invoice = visaData?.invoiceKRWPerYear || 0;
  
  // Calculate scholarship
  const scholarships = visaData?.scholarships || [];
  const selectedScholarship = scholarships.find((s: any) => s.topikLevel === topikLevel);
  const hocBongAmount = selectedScholarship && invoice > 0 ? -(invoice * selectedScholarship.discountPct / 100) : 0;
  
  // Get KTX cost
  const ktxOptions = visaData?.ktxOptions || [];
  const ktxCost = ktxRoom >= 0 && ktxOptions[ktxRoom] ? ktxOptions[ktxRoom].priceKRWPerKy : 0;
  
  // Get sổ tiết kiệm amount
  const soTietKiemOptions = (visaData?.financialRequirement?.soTietKiemOptions?.length > 0)
    ? visaData.financialRequirement.soTietKiemOptions
    : DEFAULT_SO_TIET_KIEM_OPTIONS;
  const soTietKiemAmount = soTietKiemOptions[soTietKiem]?.amountKRW || DEFAULT_SO_TIET_KIEM_OPTIONS[0].amountKRW;
  
  // Calculate totals
  const totalVND = hocTieng + phiTuVan + phiTrungTam + veMayBay + ktxVNCost;
  const totalKRW = applyFee + enrollmentFee + invoice + hocBongAmount + ktxCost + soTietKiemAmount;
  
  return (
    <div>
      {/* VND Fees */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        border: '1px solid #E8E8E8',
        marginBottom: 16
      }}>
        <h3 style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#003AB7',
          marginBottom: 16,
          textTransform: 'uppercase'
        }}>
          Chi phí hệ {visaData?.name || VISA_FALLBACKS.empty}
        </h3>
        
        <div style={{ fontSize: 11, fontWeight: 600, color: '#2D8C4E', marginBottom: 12 }}>
          PHÍ TẠI VIỆT NAM (VNĐ)
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#444' }}>Học tiếng Hàn (0→TOPIK 2)</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatVND(hocTieng)}đ</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#444' }}>Phí tư vấn & xử lý hồ sơ</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatVND(phiTuVan)}đ</span>
          </div>
          
          {/* Phí trung tâm with expandable sub-items */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#444' }}>Phí trung tâm thu hộ</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatVND(phiTrungTam)}đ</span>
            </div>
            
            {/* Expandable sub-items */}
            {expanded && (
              <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #E0E0E0' }}>
                {PHI_TRUNG_TAM_SUB_ITEMS.map((item, idx) => (
                  <div key={idx} style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                    {item}
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                marginTop: 8,
                padding: '6px 12px',
                fontSize: 12,
                color: '#666',
                background: '#F5F5F5',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Thu gọn' : '8 khoản bao gồm'}
            </button>
          </div>
          
          {veMayBay > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#444' }}>Vé máy bay 1 chiều</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatVND(veMayBay)}đ</span>
            </div>
          )}
          
          {ktxVNCost > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#444' }}>KTX tại Việt Nam ({ktxVN} tháng)</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatVND(ktxVNCost)}đ</span>
            </div>
          )}
        </div>
        
        {/* KRW Fees */}
        <div style={{ fontSize: 11, fontWeight: 600, color: '#003AB7', marginBottom: 12, marginTop: 20 }}>
          PHÍ TẠI HÀN QUỐC (KRW)
        </div>
        
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#444' }}>Phí apply</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatKRW(applyFee)} KRW</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#444' }}>Invoice học phí (1 năm)</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatKRW(invoice)} KRW</span>
          </div>
          
          {selectedScholarship && hocBongAmount < 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#2D8C4E' }}>
                Học bổng TOPIK {selectedScholarship.topikLevel} (-{selectedScholarship.discountPct}%)
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#2D8C4E' }}>
                {formatKRW(Math.abs(hocBongAmount))} KRW
              </span>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: '#444' }}>
              KTX tại Hàn {ktxRoom >= 0 && ktxOptions[ktxRoom] ? `(${ktxOptions[ktxRoom].name})` : '(Tự thuê)'}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>
              {formatKRW(ktxCost)} KRW
            </span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#444' }}>
              Sổ tiết kiệm {soTietKiemOptions[soTietKiem]?.label || ''}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>
              {formatKRW(soTietKiemAmount)} KRW
            </span>
          </div>
        </div>
      </div>
      
      {/* Total Box */}
      <div style={{
        background: 'linear-gradient(135deg, #003AB7 0%, #1B3F8B 100%)',
        borderRadius: 16,
        padding: 24,
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Tổng chi phí ước tính</span>
          <span style={{ fontSize: 28, fontWeight: 700 }}>{formatVND(totalVND)}đ</span>
        </div>
        
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>
          + {formatKRW(totalKRW)} KRW
        </div>
        
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 16 }}>
          Đã bao gồm sổ TK · ~${Math.round(totalVND / EXCHANGE_RATES.vndToUsd + totalKRW / EXCHANGE_RATES.krwToUsd).toLocaleString()}
        </div>
        
        {!selectedScholarship && scholarships.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: 12,
            fontSize: 13
          }}>
            💡 Có {scholarships.length} mức học bổng. Đạt TOPIK cao nhất để giảm tới {Math.max(...scholarships.map((s: any) => s.discountPct))}%!
          </div>
        )}
      </div>
    </div>
  );
};

// Student Info Summary Card
const StudentInfoCard = ({
  name,
  phone,
  visaSystem,
  topikLevel,
  onRegister
}: {
  name?: string;
  phone?: string;
  visaSystem?: string;
  topikLevel?: number;
  onRegister: () => void;
}) => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #E8E8E8'
    }}>
      {/* Header */}
      <div style={{
        background: '#003AB7',
        padding: '16px 20px',
        textAlign: 'center'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          Thông tin học viên
        </h3>
      </div>
      
      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Name */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #F0F0F0'
        }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Họ và tên</span>
          <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>{name || 'Chưa cập nhật'}</span>
        </div>
        
        {/* Phone */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #F0F0F0'
        }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Số điện thoại</span>
          <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>{phone || 'Chưa cập nhật'}</span>
        </div>
        
        {/* Visa System */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          borderBottom: '1px solid #F0F0F0'
        }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Hệ VISA</span>
          <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>{visaSystem || VISA_FALLBACKS.empty}</span>
        </div>
        
        {/* Korean Level */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          marginBottom: 16
        }}>
          <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>Trình độ tiếng Hàn</span>
          <span style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>
            {topikLevel && topikLevel > 0 ? `TOPIK ${topikLevel}` : 'Chưa có TOPIK'}
          </span>
        </div>
        
        {/* Register Button */}
        <button
          onClick={onRegister}
          style={{
            width: '100%',
            padding: '14px 24px',
            background: '#EF4444',
            color: '#fff',
            border: 'none',
            borderRadius: 25,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
          }}
        >
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
};

// Admission Requirements Section
const AdmissionRequirements = ({ visaData }: { visaData: any }) => {
  const admission = visaData?.admission;
  const luiNThang = visaData?.financialRequirement?.luiNThang || DEFAULT_FINANCIAL.luiNThang;
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #E8E8E8',
      marginTop: 24
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
        Điều kiện tuyển sinh
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>GPA tối thiểu</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
            {admission?.gpaMin ? `≥ ${admission.gpaMin}` : `≥ ${DEFAULT_ADMISSION.gpaMin}`}
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Năm trống / tuổi</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
            Trống &lt; {admission?.gapYearLimit || DEFAULT_ADMISSION.gapYearLimit} năm
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Điều kiện tài chính</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
            Sổ tiết kiệm {luiNThang} tháng
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Số tiền sổ TK</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
            {visaData?.financialRequirement?.soTietKiemOptions?.[0]?.amountKRW 
              ? formatKRW(visaData.financialRequirement.soTietKiemOptions[0].amountKRW) + ' KRW'
              : `${formatKRW(DEFAULT_SO_TIET_KIEM_OPTIONS[0].amountKRW)} KRW`}
          </div>
        </div>
      </div>
    </div>
  );
};

// University Summary Card - Compact overview of all university info
const GeneralInfoCards = ({ university, visaSystems }: { university: any; visaSystems: any }) => {
  const koreanData = university?.koreanData;
  
  // Get all visa systems that have data (check for non-null values)
  const allSystems = ALL_VISA_SYSTEMS
    .filter(v => visaSystems[v.key] != null)
    .map((v, index) => ({ ...v, rank: index + 1 }));
  
  // Get available (active) systems  
  const availableSystems = allSystems.filter(v => visaSystems[v.key]?.available);
  
  // Get admission requirements from first available system or defaults
  const firstSystem = availableSystems[0];
  const visaData = firstSystem ? visaSystems[firstSystem.key] : null;
  
  const gpaMin = visaData?.admission?.gpaMin || DEFAULT_ADMISSION.gpaMin;
  const gapYearLimit = visaData?.admission?.gapYearLimit || DEFAULT_ADMISSION.gapYearLimit;
  const soTietKiemAmount = visaData?.financialRequirement?.soTietKiemOptions?.[0]?.amountKRW || DEFAULT_SO_TIET_KIEM_OPTIONS[0].amountKRW;
  const luiNThang = visaData?.financialRequirement?.luiNThang || DEFAULT_FINANCIAL.luiNThang;
  
  // Find best scholarship
  let bestScholarship: any = null;
  allSystems.forEach(visa => {
    const data = visaSystems[visa.key];
    if (data?.scholarships?.length > 0) {
      const max = Math.max(...data.scholarships.map((s: any) => s.discountPct));
      if (!bestScholarship || max > bestScholarship.pct) {
        bestScholarship = { pct: max, visa: visa.label };
      }
    }
  });
  
  // Get all unique majors from all visa systems
  const allMajors: string[] = [];
  allSystems.forEach(visa => {
    const data = visaSystems[visa.key];
    if (data?.majors && Array.isArray(data.majors)) {
      data.majors.forEach((m: string) => {
        if (!allMajors.includes(m)) allMajors.push(m);
      });
    }
  });
  
  const displayMajors = allMajors.length > 0 
    ? allMajors.slice(0, 4).join(', ') + (allMajors.length > 4 ? ` +${allMajors.length - 4} ngành` : '')
    : (Array.isArray(koreanData?.majors) 
        ? koreanData.majors.slice(0, 4).join(', ')
        : koreanData?.majors || university?.majors || 'Đang cập nhật');
  
  // Image fields
  const heroImage = university?.heroImage;
  const thumbnail = university?.thumbnail || university?.koreanData?.logo;
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #E8E8E8',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
    }}>
      {/* Header with hero image background */}
      <div style={{
        background: heroImage 
          ? `linear-gradient(135deg, rgba(0,58,183,0.85) 0%, rgba(27,63,139,0.9) 100%), url(${heroImage})`
          : 'linear-gradient(135deg, #003AB7 0%, #1B3F8B 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '20px 24px',
        color: '#fff',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Thumbnail/Logo */}
            {thumbnail && (
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.3)',
                flexShrink: 0,
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img 
                  src={thumbnail} 
                  alt={university?.name}
                  style={{ 
                    width: 56, 
                    height: 56, 
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px 0' }}>
                {university?.name || 'Thông tin trường'}
              </h2>
              <p style={{ fontSize: 14, opacity: 0.9, margin: 0 }}>
                {koreanData?.koreanName || university?.koreanName || ''}
              </p>
            </div>
          </div>
          {university?.ranking && (
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 13,
              fontWeight: 600
            }}>
              Top {university.ranking}
            </div>
          )}
        </div>
        
        {/* Quick Stats */}
        <div style={{
          display: 'flex',
          gap: 24,
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} />
            <span style={{ fontSize: 13 }}>{university?.region || koreanData?.region || 'Hàn Quốc'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <GraduationCap size={16} />
            <span style={{ fontSize: 13 }}>{availableSystems.length || allSystems.length || 0} hệ visa</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={16} />
            <span style={{ fontSize: 13 }}>{university?.country || 'Hàn Quốc'}</span>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        
        {/* Điều kiện tuyển sinh - Main Section */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: 16
          }}>
            Điều kiện tuyển sinh
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px 24px'
          }}>
            {/* GPA tối thiểu */}
            <div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 4
              }}>GPA tối thiểu</div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1A1A1A'
              }}>≥ {gpaMin}</div>
            </div>
            
            {/* Năm trống */}
            <div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 4
              }}>Năm trống / tuổi</div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1A1A1A'
              }}>Trống &lt; {gapYearLimit} năm</div>
            </div>
            
            {/* Điều kiện tài chính */}
            <div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 4
              }}>Điều kiện tài chính</div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1A1A1A'
              }}>Sổ tiết kiệm {luiNThang} tháng</div>
            </div>
            
            {/* Số tiền sổ TK */}
            <div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 4
              }}>Số tiền sổ TK</div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#1A1A1A'
              }}>{formatKRW(soTietKiemAmount)} KRW</div>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        <div style={{
          height: 1,
          background: '#F0F0F0',
          margin: '20px 0'
        }} />
        
        {/* Thông tin chung - Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px 24px'
        }}>
          {/* Address */}
          <div>
            <div style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 4,
              textTransform: 'uppercase',
              fontWeight: 600
            }}>Địa chỉ</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
              {koreanData?.address || university?.location || 'Đang cập nhật'}
            </div>
          </div>
          
          {/* Majors */}
          <div>
            <div style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 4,
              textTransform: 'uppercase',
              fontWeight: 600
            }}>Chuyên ngành</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
              {displayMajors}
            </div>
          </div>
          
          {/* Visa Systems */}
          <div>
            <div style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 4,
              textTransform: 'uppercase',
              fontWeight: 600
            }}>Hệ đào tạo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(allSystems.length > 0 ? allSystems : ALL_VISA_SYSTEMS.slice(0, 4)).map((visa, idx) => (
                <span key={visa.key} style={{
                  fontSize: 13,
                  padding: '4px 10px',
                  borderRadius: 12,
                  background: visaSystems[visa.key]?.available ? '#ECFDF5' : '#F5F5F5',
                  color: visaSystems[visa.key]?.available ? '#059669' : '#999',
                  fontWeight: 600
                }}>
                  {visa.label}
                </span>
              ))}
            </div>
          </div>
          
          {/* Scholarship Summary */}
          <div>
            <div style={{
              fontSize: 12,
              color: '#888',
              marginBottom: 4,
              textTransform: 'uppercase',
              fontWeight: 600
            }}>Học bổng cao nhất</div>
            <div style={{
              fontSize: 14,
              color: bestScholarship ? '#059669' : '#666',
              fontWeight: 600
            }}>
              {bestScholarship 
                ? `Giảm ${bestScholarship.pct}% học phí (${bestScholarship.visa})`
                : 'Không có thông tin'
              }
            </div>
          </div>
          
          {/* Part-time Work */}
          {(koreanData?.partTimeInfo || koreanData?.partTimeWork) && (
            <div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 4,
                textTransform: 'uppercase',
                fontWeight: 600
              }}>Cơ hội việc làm</div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
                {koreanData?.partTimeInfo || koreanData?.partTimeWork}
              </div>
            </div>
          )}
          
          {/* Dormitory Info */}
          {(visaData?.ktxOptions?.length > 0 || koreanData?.dormitoryInfo) && (
            <div>
              <div style={{
                fontSize: 12,
                color: '#888',
                marginBottom: 4,
                textTransform: 'uppercase',
                fontWeight: 600
              }}>Thông tin ký túc xá</div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
                {visaData?.ktxOptions?.length > 0 ? (
                  <div>
                    {visaData.ktxOptions.map((opt: any, i: number) => (
                      <div key={i} style={{ marginBottom: 2 }}>
                        {opt.name}: {formatKRW(opt.priceKRWPerKy)} KRW/kỳ
                      </div>
                    ))}
                  </div>
                ) : (
                  koreanData?.dormitoryInfo
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Website link if available */}
        {university?.website && (
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #F0F0F0'
          }}>
            <a 
              href={university.website} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: '#003AB7',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              <ExternalLink size={14} />
              Website trường
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// Contact Form Modal Component
const ContactFormModal = ({ 
  isOpen, 
  onClose, 
  universityName, 
  universityId,
  selectedVisa 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  universityName: string;
  universityId?: string;
  selectedVisa?: string;
}) => {
  const { saveContactRequest } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    note: ''
  });
  const [submitted, setSubmitted] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to database
    const id = Date.now().toString();
    saveContactRequest({
      id,
      studentName: formData.name,
      studentPhone: formData.phone,
      studentEmail: formData.email,
      note: formData.note,
      universityId,
      universityName,
      visaSystem: selectedVisa
    });
    
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setFormData({ name: '', phone: '', email: '', note: '' });
    }, 2000);
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: '#F5F5F5',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
        
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              Đã gửi thành công!
            </h3>
            <p style={{ fontSize: 14, color: '#666' }}>
              Chúng tôi sẽ liên hệ với bạn trong 24h
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>
              Nhận tư vấn miễn phí
            </h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
              Để lại thông tin để nhận tư vấn về <strong>{universityName}</strong>
            </p>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0912345678"
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="example@email.com"
                />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
                  Ghi chú / Câu hỏi
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #D1D5DB',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: 80,
                    resize: 'vertical'
                  }}
                  placeholder="Bạn có câu hỏi gì về trường?"
                />
              </div>
              
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: '#003AB7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
              >
                Gửi yêu cầu tư vấn
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

// Main Component
export default function UniversityDetailRedesigned() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, fetchUniversity } = useApp();
  
  const university = universities.find(uni => uni.id === id);
  const rawVisaSystems = university?.koreanData?.visaSystemsDetail || {};
  
  // Normalize all visa system data - useMemo to prevent recreating on every render
  // Use university?.id as dependency since rawVisaSystems creates new reference each render
  const visaSystems = useMemo(() => {
    const systems: Record<string, ReturnType<typeof normalizeVisaData>> = {};
    Object.keys(rawVisaSystems).forEach(key => {
      systems[key] = normalizeVisaData(rawVisaSystems[key]);
    });
    return systems;
  }, [university?.id, JSON.stringify(rawVisaSystems)]);
  
  // Count available systems
  const availableCount = ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length;
  
  // State
  const [selectedVisa, setSelectedVisa] = useState(() => {
    const first = ALL_VISA_SYSTEMS.find(v => visaSystems[v.key]?.available);
    return first?.key || ''; // Don't default to D4-1 if no visa available
  });
  
  // Modal state for contact form
  const [showContactModal, setShowContactModal] = useState(false);
  
  const [topikLevel, setTopikLevel] = useState(0);
  const [ktxRoom, setKtxRoom] = useState(0);
  const [soTietKiem, setSoTietKiem] = useState(0);
  const [ktxVN, setKtxVN] = useState(0);
  const [flight, setFlight] = useState(true);
  
  // Reset when visa changes
  useEffect(() => {
    setTopikLevel(0);
    // Reset KTX selection when visa changes
    const visaData = visaSystems[selectedVisa];
    if (visaData?.ktxOptions && visaData.ktxOptions.length > 0) {
      setKtxRoom(0);
    } else {
      setKtxRoom(-1);
    }
  }, [selectedVisa, visaSystems]);
  
  // Fetch data
  useEffect(() => {
    if (id) fetchUniversity(id);
  }, [id, fetchUniversity]);
  
  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy trường</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }
  
  const visaData = visaSystems[selectedVisa];
  const rawCommonFees = (university?.koreanData as any)?.commonFeesVND || (university?.koreanData as any)?.common_fees_vnd;
  
  // Calculate total cost for sidebar
  const totalCost = useMemo(() => {
    if (!visaData) return 0;
    
    const baseFee = visaData.invoiceKRWPerYear || 0;
    const scholarshipRate = topikLevel >= 6 ? 0.5 : topikLevel >= 5 ? 0.4 : topikLevel >= 4 ? 0.3 : topikLevel >= 3 ? 0.2 : 0;
    const afterScholarship = baseFee * (1 - scholarshipRate);
    
    // Convert KRW to VND: KRW -> USD -> VND
    const krwToVnd = EXCHANGE_RATES.vndToUsd / EXCHANGE_RATES.krwToUsd;
    return afterScholarship * krwToVnd;
  }, [visaData, topikLevel]);
  
  return (
    <div style={{ background: '#F8F7F5', minHeight: '100vh' }}>
      {/* Full-width Hero */}
      <HeroSection 
        university={university} 
        availableCount={availableCount} 
        onContactClick={() => setShowContactModal(true)}
      />
      
      {/* Contained Content */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px' }}>
        {/* Cost Preview Cards */}
        <VisaCostCards university={university} />
        
        {/* Visa Selector - only show if visa systems are configured */}
        {availableCount > 0 && (
          <VisaSelector 
            university={university} 
            selectedVisa={selectedVisa}
            onSelect={setSelectedVisa}
          />
        )}
        
        {/* Show message if no visa systems configured */}
        {availableCount === 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 32,
            border: '1px solid #E8E8E8',
            textAlign: 'center',
            marginBottom: 24
          }}>
            <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
              Chưa có hệ visa nào được cấu hình
            </div>
            <div style={{ fontSize: 13, color: '#999' }}>
              Vui lòng liên hệ để được tư vấn chi tiết
            </div>
          </div>
        )}
        
        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Left: General Information Cards */}
          <GeneralInfoCards university={university} visaSystems={visaSystems} />
          
          {/* Right: Student Info Card */}
          <div>
            <StudentInfoCard
              name=""
              phone=""
              visaSystem={selectedVisa}
              topikLevel={topikLevel}
              onRegister={() => setShowContactModal(true)}
            />
          </div>
        </div>
        
        {/* Cost Controls and Fee Breakdown Section - only show if visa configured */}
        {availableCount > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, marginTop: 24 }}>
            {/* Left: Controls */}
            <CostControls
              topikLevel={topikLevel}
              setTopikLevel={setTopikLevel}
              ktxRoom={ktxRoom}
              setKtxRoom={setKtxRoom}
              soTietKiem={soTietKiem}
              setSoTietKiem={setSoTietKiem}
              ktxVN={ktxVN}
              setKtxVN={setKtxVN}
              flight={flight}
              setFlight={setFlight}
              visaData={visaData}
            />
            
            {/* Right: Fee Breakdown */}
            <FeeBreakdown
              commonFees={rawCommonFees}
              visaData={visaData}
              topikLevel={topikLevel}
              ktxRoom={ktxRoom}
              soTietKiem={soTietKiem}
              ktxVN={ktxVN}
              flight={flight}
            />
          </div>
        ) : (
          <div style={{
            background: '#f8f9fa',
            borderRadius: 12,
            padding: 40,
            border: '1px dashed #ddd',
            textAlign: 'center',
            marginTop: 24
          }}>
            <div style={{ fontSize: 15, color: '#666' }}>
              Thông tin chi phí đang được cập nhật
            </div>
          </div>
        )}
      </div>
      
      <StudentFixedSidebar 
        universityId={university?.id}
        currentCost={totalCost}
      />
      
      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        universityName={university?.name}
        universityId={university?.id}
        selectedVisa={selectedVisa}
      />
    </div>
  );
}

// Re-export components for admin version compatibility
export { HeroSection as HeroBanner, CostControls as ThongTinChungCard, FeeBreakdown as BangBocTachChiPhi };
