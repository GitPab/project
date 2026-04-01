import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Info, ChevronDown, ChevronUp, MapPin, GraduationCap, Building2, ExternalLink } from 'lucide-react';
import { DESIGN_TOKENS, normalizeTier, VISA_SYSTEMS } from '../styles/designTokens';
import {
  DEFAULT_FEES_VND,
  DEFAULT_SO_TIET_KIEM_OPTIONS,
  EXCHANGE_RATES,
  DEFAULT_ADMISSION,
  DEFAULT_FINANCIAL
} from '../../constants/feeDefaults';

// Import actual modal components
import EditUniversityModal from '../components/EditUniversityModal';
import CostInputForm from '../components/CostInputForm';

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

// Helper to format currency - memoized
const formatVND = (amount: number) => amount.toLocaleString('vi-VN');
const formatKRW = (amount: number) => amount.toLocaleString('vi-VN');

// Empty object constant to prevent new references
const EMPTY_OBJECT = {};
const EMPTY_ARRAY: any[] = [];
// Helper to convert camelCase to snake_case for saving to database
const convertVisaSystemsToSnakeCase = (visaSystems: any): any => {
  if (!visaSystems) return {};
  
  const result: any = {};
  
  Object.keys(visaSystems).forEach(key => {
    const system = visaSystems[key];
    if (!system) return;
    
    result[key] = {
      available: system.available ?? false,
      invoice_krw: system.invoiceKRWPerYear ?? system.invoice_krw ?? 0,
      apply_fee_krw: system.applyFeeKRW ?? system.apply_fee_krw ?? 0,
      enrollment_fee_krw: system.enrollmentFeeKRW ?? system.enrollment_fee_krw ?? 0,
      scholarships: (system.scholarships || []).map((s: any) => ({
        topik_level: s.topikLevel ?? s.topik_level ?? 0,
        discount_pct: s.discountPct ?? s.discount_pct ?? 0
      })),
      ktx_options: (system.ktxOptions || system.ktx_options || []).map((k: any) => ({
        name: k.name || '',
        price_krw: k.priceKRWPerKy ?? k.price_krw ?? 0
      })),
      so_tiet_kiem_options: (system.financialRequirement?.soTietKiemOptions || system.so_tiet_kiem_options || system.soTietKiemOptions || []).map((s: any) => ({
        label: s.label || '',
        amount_krw: s.amountKRW ?? s.amount_krw ?? 0
      })),
      lui_n_thang: system.financialRequirement?.luiNThang ?? system.lui_n_thang ?? DEFAULT_FINANCIAL.luiNThang,
      // Admission requirements
      gpa_min: system.admission?.gpaMin ?? system.gpa_min ?? DEFAULT_ADMISSION.gpaMin,
      gap_year_limit: system.admission?.gapYearLimit ?? system.gap_year_limit ?? DEFAULT_ADMISSION.gapYearLimit
    };
  });
  
  return result;
};

// Helper to convert common fees array to snake_case object
const convertCommonFeesToObject = (commonFees: any[]): any => {
  if (!commonFees || !Array.isArray(commonFees) || commonFees.length === 0) {
    return EMPTY_COMMON_FEES;
  }
  
  const result: any = { ...EMPTY_COMMON_FEES };
  
  commonFees.forEach(fee => {
    if (fee.id === 'hoc_tieng' || fee.name?.includes('tiếng')) {
      result.hoc_tieng = fee.amount ?? DEFAULT_FEES_VND.hocTieng;
    }
    if (fee.id === 'phi_tu_van' || fee.name?.includes('tư vấn')) {
      result.phi_tu_van = fee.amount ?? DEFAULT_FEES_VND.phiTuVan;
    }
    if (fee.id === 'phi_trung_tam' || fee.name?.includes('trung tâm')) {
      result.phi_trung_tam = fee.amount ?? DEFAULT_FEES_VND.phiTrungTam;
    }
    if (fee.id === 've_may_bay' || fee.name?.includes('máy bay')) {
      result.ve_may_bay = { amount: fee.amount ?? DEFAULT_FEES_VND.veMayBay, optional: fee.optional ?? true };
    }
    if (fee.id === 'ktx_vn' || fee.name?.includes('KTX')) {
      result.ktx_vn = { amount_per_month: fee.amountPerMonth ?? DEFAULT_FEES_VND.ktxVNPerMonth, optional: fee.optional ?? true };
    }
  });
  
  return result;
};

// Memoized empty common fees object
const EMPTY_COMMON_FEES = {
  hoc_tieng: DEFAULT_FEES_VND.hocTieng,
  phi_tu_van: DEFAULT_FEES_VND.phiTuVan,
  phi_trung_tam: DEFAULT_FEES_VND.phiTrungTam,
  ve_may_bay: { amount: DEFAULT_FEES_VND.veMayBay, optional: true },
  ktx_vn: { amount_per_month: DEFAULT_FEES_VND.ktxVNPerMonth, optional: true }
};

// Helper to convert snake_case to camelCase for visa system data
const convertVisaSystemsToCamelCase = (visaSystems: any): any => {
  if (!visaSystems) return {};
  
  const result: any = {};
  
  Object.keys(visaSystems).forEach(key => {
    const system = visaSystems[key];
    if (!system) return;
    
    result[key] = {
      available: system.available ?? false,
      invoiceKRWPerYear: system.invoice_krw ?? system.invoiceKRWPerYear ?? 0,
      applyFeeKRW: system.apply_fee_krw ?? system.applyFeeKRW ?? 0,
      enrollmentFeeKRW: system.enrollment_fee_krw ?? system.enrollmentFeeKRW ?? 0,
      scholarships: (system.scholarships || []).map((s: any) => ({
        topikLevel: s.topik_level ?? s.topikLevel ?? 0,
        discountPct: s.discount_pct ?? s.discountPct ?? 0,
        condition: s.condition || `TOPIK ${s.topik_level || s.topikLevel || 0}`
      })),
      ktxOptions: (system.ktx_options || system.ktxOptions || []).map((k: any) => ({
        name: k.name || '',
        priceKRWPerKy: k.price_krw ?? k.priceKRWPerKy ?? 0
      })),
      financialRequirement: {
        soTietKiemOptions: (system.so_tiet_kiem_options || system.soTietKiemOptions || []).map((s: any) => ({
          label: s.label || '',
          amountKRW: s.amount_krw ?? s.amountKRW ?? 0
        })),
        luiNThang: system.lui_n_thang ?? system.luiNThang ?? DEFAULT_FINANCIAL.luiNThang
      },
      admission: {
        gpaMin: system.gpa_min ?? system.gpaMin ?? DEFAULT_ADMISSION.gpaMin,
        gapYearLimit: system.gap_year_limit ?? system.gapYearLimit ?? DEFAULT_ADMISSION.gapYearLimit
      }
    };
  });
  
  return result;
};

// Helper to convert common fees from snake_case to array format
const convertCommonFeesToArray = (commonFees: any): any[] => {
  if (!commonFees) return [];
  if (Array.isArray(commonFees)) return commonFees;
  
  const fees = [];
  if (commonFees.hoc_tieng !== undefined) {
    fees.push({ id: 'hoc_tieng', name: 'Học tiếng Hàn', amount: commonFees.hoc_tieng, editable: true });
  }
  if (commonFees.phi_tu_van !== undefined) {
    fees.push({ id: 'phi_tu_van', name: 'Phí tư vấn', amount: commonFees.phi_tu_van, editable: true });
  }
  if (commonFees.phi_trung_tam !== undefined) {
    fees.push({ id: 'phi_trung_tam', name: 'Phí trung tâm thu hộ', amount: commonFees.phi_trung_tam, editable: true, subItems: [
      'Phí công chứng', 'Tem vàng / Tem tím', 'Xin visa', 'Khám sức khoẻ', 
      'Ship hồ sơ tại Việt Nam', 'Ship hồ sơ sang trường', 'Đưa đón tại Hàn Quốc', 'Tìm ký túc xá'
    ]});
  }
  if (commonFees.ve_may_bay) {
    fees.push({ id: 've_may_bay', name: 'Vé máy bay', amount: commonFees.ve_may_bay.amount || 8000000, optional: commonFees.ve_may_bay.optional, editable: true });
  }
  if (commonFees.ktx_vn) {
    fees.push({ id: 'ktx_vn', name: 'KTX Việt Nam', amountPerMonth: commonFees.ktx_vn.amount_per_month || 800000, optional: commonFees.ktx_vn.optional, editable: true });
  }
  return fees;
};

// Normalize common fees helper - memoized empty result
const EMPTY_FEES_ARRAY: any[] = [];

const normalizeCommonFees = (rawData: any) => {
  if (!rawData) return EMPTY_FEES_ARRAY;
  if (Array.isArray(rawData)) return rawData;
  
  const fees = [];
  if (rawData.hoc_tieng !== undefined || rawData.hocTieng !== undefined) {
    fees.push({ 
      id: 'hoc_tieng', 
      name: 'Học tiếng Hàn', 
      amount: rawData.hoc_tieng ?? rawData.hocTieng ?? DEFAULT_FEES_VND.hocTieng, 
      editable: true 
    });
  }
  if (rawData.phi_tu_van !== undefined || rawData.phiTuVan !== undefined) {
    fees.push({ 
      id: 'phi_tu_van', 
      name: 'Phí tư vấn', 
      amount: rawData.phi_tu_van ?? rawData.phiTuVan ?? DEFAULT_FEES_VND.phiTuVan, 
      editable: true 
    });
  }
  if (rawData.phi_trung_tam !== undefined || rawData.phiTrungTam !== undefined) {
    fees.push({ 
      id: 'phi_trung_tam', 
      name: 'Phí trung tâm thu hộ', 
      amount: rawData.phi_trung_tam ?? rawData.phiTrungTam ?? DEFAULT_FEES_VND.phiTrungTam, 
      editable: true, 
      subItems: ['Phí công chứng', 'Tem vàng / Tem tím', 'Xin visa', 'Khám sức khoẻ', 'Ship hồ sơ tại Việt Nam', 'Ship hồ sơ sang trường', 'Đưa đón tại Hàn Quốc', 'Tìm ký túc xá']
    });
  }
  if (rawData.ve_may_bay || rawData.veMayBay) {
    const fee = rawData.ve_may_bay ?? rawData.veMayBay;
    fees.push({ 
      id: 've_may_bay', 
      name: 'Vé máy bay', 
      amount: fee.amount ?? DEFAULT_FEES_VND.veMayBay, 
      optional: fee.optional ?? true, 
      editable: true 
    });
  }
  if (rawData.ktx_vn || rawData.ktxVN) {
    const fee = rawData.ktx_vn ?? rawData.ktxVN;
    fees.push({ 
      id: 'ktx_vn', 
      name: 'KTX Việt Nam', 
      amountPerMonth: fee.amount_per_month ?? fee.amountPerMonth ?? DEFAULT_FEES_VND.ktxVNPerMonth, 
      optional: fee.optional ?? true, 
      editable: true 
    });
  }
  return fees;
};

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

// Memoized default soTietKiemOptions for components
const DEFAULT_SO_TIET_KIEM_FALLBACK = [
  { label: 'Khu vực Gyeonggi', amountKRW: 10000000 },
  { label: 'Ngoài Gyeonggi', amountKRW: 8000000 }
];

// Admin General Info Cards - Same design as student page
const AdminGeneralInfoCards = ({ university, visaSystems }: { university: any; visaSystems: any }) => {
  const koreanData = university?.koreanData;
  const topTier = university?.top_tier || university?.koreanData?.topTier || '';

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
  
  // Get all visa systems that have data
  const allSystems = ALL_VISA_SYSTEMS
    .filter(v => visaSystems[v.key] != null)
    .map((v, index) => ({ ...v, rank: index + 1 }));
  
  const availableSystems = allSystems.filter(v => visaSystems[v.key]?.available);
  
  // Get admission requirements
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
  
  // Get all unique majors
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
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
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
        
        {/* Điều kiện tuyển sinh */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
            Điều kiện tuyển sinh
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>GPA tối thiểu</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>≥ {gpaMin}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Năm trống / tuổi</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>Trống &lt; {gapYearLimit} năm</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Điều kiện tài chính</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>Sổ tiết kiệm {luiNThang} tháng</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Số tiền sổ TK</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A' }}>{formatKRW(soTietKiemAmount)} KRW</div>
            </div>
          </div>
        </div>
        
        <div style={{ height: 1, background: '#F0F0F0', margin: '20px 0' }} />
        
        {/* Thông tin chung */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Địa chỉ</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
              {koreanData?.address || university?.location || 'Đang cập nhật'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Chuyên ngành</div>
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>{displayMajors}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Hệ đào tạo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(allSystems.length > 0 ? allSystems : ALL_VISA_SYSTEMS.slice(0, 4)).map((visa) => (
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
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Học bổng cao nhất</div>
            <div style={{ fontSize: 14, color: bestScholarship ? '#059669' : '#666', fontWeight: 600 }}>
              {bestScholarship ? `Giảm ${bestScholarship.pct}% học phí (${bestScholarship.visa})` : 'Không có thông tin'}
            </div>
          </div>
          
          {/* Part-time Work */}
          {(koreanData?.partTimeInfo || koreanData?.partTimeWork) && (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Cơ hội việc làm</div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
                {koreanData?.partTimeInfo || koreanData?.partTimeWork}
              </div>
            </div>
          )}
          
          {/* Dormitory Info */}
          {(visaData?.ktxOptions?.length > 0 || koreanData?.dormitoryInfo) && (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Thông tin ký túc xá</div>
              <div style={{ fontSize: 14, color: '#333', lineHeight: 1.5 }}>
                {visaData?.ktxOptions?.length > 0 ? (
                  <div>
                    {visaData.ktxOptions.map((opt: any, i: number) => (
                      <div key={i} style={{ marginBottom: 2 }}>
                        {opt.name}: {formatKRW(opt.priceKRWPerKy)} KRW/kỳ
                      </div>
                    ))}
                  </div>
                ) : koreanData?.dormitoryInfo}
              </div>
            </div>
          )}
        </div>
        
        {/* Website */}
        {university?.website && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F0F0F0' }}>
            <a href={university.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#003AB7', textDecoration: 'none', fontWeight: 500 }}>
              <ExternalLink size={14} />
              Website trường
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminControls = React.memo(({ university, onEditClick, onCostConfigClick }: { 
  university: any; 
  onEditClick: () => void;
  onCostConfigClick: () => void;
}) => {
  return (
    <div style={{
      background: '#fff', 
      border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: DESIGN_TOKENS.colors.textPrimary }}>
          Quản lý trường đại học
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            onClick={onEditClick}
            style={{
              background: DESIGN_TOKENS.colors.primaryBlue,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              fontSize: 13,
              borderRadius: 6
            }}
          >
            Chỉnh sửa thông tin
          </Button>
          <Button
            onClick={onCostConfigClick}
            style={{
              background: DESIGN_TOKENS.colors.top1Green,
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              fontSize: 13,
              borderRadius: 6
            }}
          >
            Cấu hình chi phí
          </Button>
        </div>
      </div>
    </div>
  );
});

// Visa Selector Component (Chọn hệ du học) - Memoized
const VisaSelector = React.memo(({ 
  visaSystems, 
  selectedVisa, 
  onSelect 
}: { 
  visaSystems: any; 
  selectedVisa: string; 
  onSelect: (key: string) => void;
}) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 700, 
        color: '#1A1A1A', 
        marginBottom: 12,
        textTransform: 'uppercase'
      }}>
        Chọn hệ du học
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
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
});

// Admin Cost Summary Component - Memoized
const AdminCostSummary = React.memo(({ university }: { university: any }) => {
  // Convert from snake_case (database format) to check availability
  const rawVisaSystems = university.koreanData?.visaSystemsDetail || {};
  const visaSystems = convertVisaSystemsToCamelCase(rawVisaSystems);
  const availableCount = ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length;
  
  return (
    <div style={{
      background: '#fff', 
      border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
      borderRadius: 12, 
      padding: 20, 
      marginBottom: 24
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: DESIGN_TOKENS.colors.textPrimary, marginBottom: 16 }}>
        Tóm tắt cấu hình chi phí
      </h3>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: DESIGN_TOKENS.colors.textSecondary }}>
          Số hệ visa đã cấu hình:
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: DESIGN_TOKENS.colors.primaryBlue }}>
          {availableCount} / {ALL_VISA_SYSTEMS.length}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ALL_VISA_SYSTEMS.map(visa => {
          const system = visaSystems[visa.key];
          const isAvailable = system?.available;
          
          return (
            <div key={visa.key} style={{
              padding: 8, 
              background: isAvailable ? '#d4edda' : '#f8f9fa', 
              borderRadius: 6,
              border: `1px solid ${isAvailable ? '#c3e6cb' : '#e9ecef'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{visa.label}</span>
              <span style={{ 
                fontSize: 11, 
                color: isAvailable ? '#155724' : '#666',
                fontWeight: isAvailable ? 600 : 400
              }}>
                {isAvailable ? '✓ Đã bật' : '✗ Chưa bật'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Cost Controls Panel (Left side) - for Admin preview - Memoized
const AdminCostControls = React.memo(({
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
  const ktxOptions = visaData?.ktxOptions || EMPTY_ARRAY;
  const soTietKiemOptions = (visaData?.financialRequirement?.soTietKiemOptions?.length > 0)
    ? visaData.financialRequirement.soTietKiemOptions
    : DEFAULT_SO_TIET_KIEM_FALLBACK;
  const scholarships = visaData?.scholarships || EMPTY_ARRAY;
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #E8E8E8'
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 20 }}>
        Tùy chỉnh chi phí (Xem trước)
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
            background: '#fff'
          }}
        >
          <option value={0}>Chưa có TOPIK</option>
          {scholarships.map((s: any, idx: number) => (
            <option key={idx} value={s.topikLevel}>TOPIK {s.topikLevel} - Giảm {s.discountPct}%</option>
          ))}
        </select>
        
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
        </select>
      </div>
      
      {/* KTX VN Section */}
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
            <option key={m} value={m}>{m} tháng</option>
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
});

// Fee Breakdown Panel (Right side) - for Admin preview - Memoized
const AdminFeeBreakdown = React.memo(({
  commonFees: rawCommonFees,
  visaData,
  topikLevel,
  ktxRoom,
  soTietKiem,
  ktxVN,
  flight
}: any) => {
  const [expanded, setExpanded] = useState(false);
  
  // Memoize commonFees normalization
  const commonFees = useMemo(() => normalizeCommonFees(rawCommonFees), [rawCommonFees]);
  
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
  
  const applyFee = visaData?.applyFeeKRW || 0;
  const enrollmentFee = visaData?.enrollmentFeeKRW || 0;
  const invoice = visaData?.invoiceKRWPerYear || 0;
  
  const scholarships = visaData?.scholarships || [];
  const selectedScholarship = scholarships.find((s: any) => s.topikLevel === topikLevel);
  const hocBongAmount = selectedScholarship && invoice > 0 ? -(invoice * selectedScholarship.discountPct / 100) : 0;
  
  const ktxOptions = visaData?.ktxOptions || EMPTY_ARRAY;
  const ktxCost = ktxRoom >= 0 && ktxOptions[ktxRoom] ? ktxOptions[ktxRoom].priceKRWPerKy : 0;
  
  const soTietKiemOptions = (visaData?.financialRequirement?.soTietKiemOptions?.length > 0)
    ? visaData.financialRequirement.soTietKiemOptions
    : DEFAULT_SO_TIET_KIEM_FALLBACK;
  const soTietKiemAmount = soTietKiemOptions[soTietKiem]?.amountKRW || DEFAULT_SO_TIET_KIEM_OPTIONS[0].amountKRW;
  
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
          Chi phí hệ {visaData?.name || ''}
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
          
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#444' }}>Phí trung tâm thu hộ</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#003AB7' }}>{formatVND(phiTrungTam)}đ</span>
            </div>
            
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
            Có {scholarships.length} mức học bổng. Đạt TOPIK cao nhất để giảm tới {Math.max(...scholarships.map((s: any) => s.discountPct))}%!
          </div>
        )}
      </div>
    </div>
  );
});

// Hero Banner Component - Modern Konkuk Style - Memoized
const AdminHeroBanner = React.memo(({ university }: { university: any }) => {
  const ranking = university.koreanData?.ranking || university.ranking || 'Top 100';
  const location = university.koreanData?.address || university.location || '';
  const koreanName = university?.koreanData?.koreanName || university?.koreanName || '';
  // Use new image fields
  const logo = university?.thumbnail || university?.koreanData?.logo || university?.logo;
  const bannerImage = university?.heroImage || university?.koreanData?.bannerImage || university?.bannerImage || 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80';
  // Convert from snake_case (database format) to check availability
  const rawVisaSystems = university.koreanData?.visaSystemsDetail || {};
  const visaSystems = convertVisaSystemsToCamelCase(rawVisaSystems);
  const availableCount = ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length;
  
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
            TBT GROUP - Admin
          </span>
        </div>
        
        {/* Admin Badge */}
        <div style={{
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 500,
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          Quản trị viên
        </div>
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
            {university.name}
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
            {ranking && (
              <span style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: 20,
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                {ranking}
              </span>
            )}
            
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
              {location}
            </span>
            
            <span style={{
              fontSize: 14,
              color: '#fff',
              background: availableCount > 0 ? 'rgba(45, 140, 78, 0.8)' : 'rgba(239, 68, 68, 0.8)',
              padding: '6px 14px',
              borderRadius: 20,
              fontWeight: 500
            }}>
              {availableCount > 0 ? `${availableCount} hệ đã cấu hình` : 'Chưa cấu hình'}
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
});

// Additional Information Section (Missing fields from Detail.txt) - Memoized
const AdditionalInfoSection = React.memo(({ koreanData }: { koreanData: any }) => {
  const supportPolicies = koreanData?.supportPolicies || [];
  const refundPolicy = koreanData?.refundPolicy;
  const admissionsType = koreanData?.admissionsType;
  const partTimeInfo = koreanData?.partTimeInfo;
  
  // Only render if at least one field has data
  if (!supportPolicies.length && !refundPolicy && !admissionsType && !partTimeInfo) {
    return null;
  }
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: 24,
      border: '1px solid #E8E8E8',
      marginTop: 24
    }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 16 }}>
        Thông tin bổ sung
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Part-time Work Info */}
        {partTimeInfo && (
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Việc làm thêm</div>
            <div style={{ fontSize: 14, color: '#1A1A1A', whiteSpace: 'pre-wrap' }}>
              {partTimeInfo}
            </div>
          </div>
        )}
        
        {/* Support Policies */}
        {supportPolicies.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Chính sách hỗ trợ</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#1A1A1A' }}>
              {supportPolicies.map((policy: string, idx: number) => (
                <li key={idx} style={{ marginBottom: 4 }}>{policy}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Refund Policy */}
        {refundPolicy && (
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Chính sách hoàn tiền</div>
            <div style={{ fontSize: 14, color: '#1A1A1A' }}>
              {refundPolicy}
            </div>
          </div>
        )}
        
        {/* Admissions Type */}
        {admissionsType && (
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Hình thức xét tuyển</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A' }}>
              {admissionsType}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// Main Admin Component
export default function UniversityDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, fetchUniversity, updateUniversity } = useApp();
  const { user, isAdmin } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCostConfigModal, setShowCostConfigModal] = useState(false);

  const university = universities.find(uni => uni.id === id);
  
  // Use stable empty object reference to prevent unnecessary re-renders
  const rawVisaSystems = university?.koreanData?.visaSystemsDetail || EMPTY_OBJECT;
  const visaSystems = useMemo(() => convertVisaSystemsToCamelCase(rawVisaSystems), [rawVisaSystems]);
  const rawCommonFees = (university?.koreanData as any)?.commonFeesVND || (university?.koreanData as any)?.common_fees_vnd;

  // Compute available systems for useState initialization
  const availableVisaKeys = useMemo(() => 
    ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).map(v => v.key),
  [visaSystems]);

  // State for interactive controls - initialize with empty string, set in effect
  const [selectedVisa, setSelectedVisa] = useState('');
  const hasSetInitialVisa = useRef(false);
  
  // Set initial selected visa when data loads (only once)
  useEffect(() => {
    if (!hasSetInitialVisa.current && availableVisaKeys.length > 0) {
      setSelectedVisa(availableVisaKeys[0]);
      hasSetInitialVisa.current = true;
    }
  }, [availableVisaKeys]);
  
  const [topikLevel, setTopikLevel] = useState(0);
  const [ktxRoom, setKtxRoom] = useState(0);
  const [soTietKiem, setSoTietKiem] = useState(0);
  const [ktxVN, setKtxVN] = useState(0);
  const [flight, setFlight] = useState(true);
  const prevVisaRef = useRef<string>('');
  
  // Reset when visa changes (only when visa actually changes, not on every render)
  useEffect(() => {
    if (selectedVisa && selectedVisa !== prevVisaRef.current) {
      setTopikLevel(0);
      const visaData = visaSystems[selectedVisa];
      if (visaData?.ktxOptions && visaData.ktxOptions.length > 0) {
        setKtxRoom(0);
      } else {
        setKtxRoom(-1);
      }
      prevVisaRef.current = selectedVisa;
    }
  }, [selectedVisa, visaSystems]);

  // Force fresh data fetch on mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchUniversity(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [id]);

  // Memoize availableCount to prevent recalculation on every render
  const availableCount = useMemo(() => 
    ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length,
  [visaSystems]);

  // Memoize visaData for current selection
  const visaData = useMemo(() => visaSystems[selectedVisa], [visaSystems, selectedVisa]);

  // Memoize event handlers to prevent child re-renders
  const handleEditClick = useCallback(() => setShowEditModal(true), []);
  const handleCostConfigClick = useCallback(() => setShowCostConfigModal(true), []);
  const handleCloseEditModal = useCallback(() => setShowEditModal(false), []);
  const handleCloseCostModal = useCallback(() => setShowCostConfigModal(false), []);
  const handleSaveEditModal = useCallback(async (data: any) => {
    if (university) {
      await updateUniversity(university.id, data);
      setShowEditModal(false);
      if (id) fetchUniversity(id);
      toast.success('Cập nhật thông tin trường thành công!');
    }
  }, [university, id]);

  // Redirect non-admin users
  if (!university) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Không tìm thấy trường đại học</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  // Redirect non-admin users to student view - useEffect to avoid setState during render
  useEffect(() => {
    if (!isAdmin && id) {
      navigate(`/university/${id}`, { replace: true });
    }
  }, [isAdmin, id, navigate]);

  // Show loading while redirecting non-admin
  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            border: '4px solid #e2e8f0', 
            borderTop: '4px solid #2563eb', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b' }}>Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Full-width Hero */}
      <AdminHeroBanner university={university} />
      
      {/* Contained Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        
        {/* Admin Controls */}
        <AdminControls 
          university={university}
          onEditClick={handleEditClick}
          onCostConfigClick={handleCostConfigClick}
        />

        {/* General Info Card + Summary - Same layout as student page */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, marginBottom: 24 }}>
          {/* LEFT: General Information Card */}
          <AdminGeneralInfoCards university={university} visaSystems={visaSystems} />
          
          {/* RIGHT: Admin Cost Summary */}
          <AdminCostSummary university={university} />
        </div>

        {/* Visa System Selector */}
        {availableCount > 0 && (
          <VisaSelector 
            visaSystems={visaSystems}
            selectedVisa={selectedVisa}
            onSelect={setSelectedVisa}
          />
        )}

        {/* Main Content Grid - Cost Controls & Fee Breakdown */}
        {availableCount > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
            <AdminCostControls
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
            <AdminFeeBreakdown
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
            background: '#fff',
            borderRadius: 16,
            padding: 40,
            border: '1px solid #E8E8E8',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
              Chưa có hệ visa nào được cấu hình
            </div>
            <Button 
              onClick={() => setShowCostConfigModal(true)}
              style={{
                background: DESIGN_TOKENS.colors.primaryBlue,
                color: '#fff',
                padding: '12px 24px',
                borderRadius: 8
              }}
            >
              Cấu hình chi phí ngay
            </Button>
          </div>
        )}
        
        {/* Additional Information Section - Missing fields from Detail.txt */}
        <AdditionalInfoSection koreanData={university?.koreanData} />
      </div>

      {/* Modals */}
        {showEditModal && university && (
        <EditUniversityModal
          university={university}
          onClose={handleCloseEditModal}
          onSave={handleSaveEditModal}
        />
      )}

      {showCostConfigModal && university && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff', 
            borderRadius: 12, 
            padding: 24, 
            maxWidth: 900, 
            width: '90%',
            maxHeight: '90vh', 
            overflow: 'auto'
          }}>
            <CostInputForm
              universityId={university.id}
              universityName={university.name}
              initialData={{
                common_fees_vnd: convertCommonFeesToObject(university.koreanData?.commonFeesVND || []),
                visa_systems: convertVisaSystemsToSnakeCase(university.koreanData?.visaSystemsDetail)
              }}
              onSave={async (data) => {
                try {
                  console.log('[Cost Save] Started');
                  
                  const convertedVisaSystems = convertVisaSystemsToCamelCase(data.visa_systems);
                  console.log('[Cost Save] Converted systems:', Object.keys(convertedVisaSystems));
                  
                  const convertedCommonFees = convertCommonFeesToArray(data.common_fees_vnd);
                  
                  const updatedUniversity = {
                    ...university,
                    koreanData: {
                      ...university.koreanData,
                      isKoreanUniversity: true,
                      commonFeesVND: convertedCommonFees,
                      visaSystemsDetail: convertedVisaSystems
                    }
                  };
                  
                  await updateUniversity(university.id, updatedUniversity);
                  
                  toast.success('Cấu hình chi phí đã được lưu!');
                  setShowCostConfigModal(false);
                  
                  if (id) {
                    await fetchUniversity(id);
                  }
                } catch (error) {
                  console.error('[Cost Save] ERROR:', error);
                  toast.error('Lỗi khi lưu cấu hình chi phí');
                }
              }}
              onCancel={handleCloseCostModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
