import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { DESIGN_TOKENS, normalizeTier, VISA_SYSTEMS } from '../styles/designTokens';

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

// Helper to format currency
const formatVND = (amount: number) => amount.toLocaleString('vi-VN');
const formatKRW = (amount: number) => amount.toLocaleString('vi-VN');
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
      lui_n_thang: system.financialRequirement?.luiNThang ?? system.lui_n_thang ?? 6
    };
  });
  
  return result;
};

// Helper to convert common fees array to snake_case object
const convertCommonFeesToObject = (commonFees: any[]): any => {
  if (!commonFees || !Array.isArray(commonFees)) {
    return {
      hoc_tieng: 13000000,
      phi_tu_van: 39000000,
      phi_trung_tam: 11000000,
      ve_may_bay: { amount: 8000000, optional: true },
      ktx_vn: { amount_per_month: 800000, optional: true }
    };
  }
  
  const result: any = {
    hoc_tieng: 13000000,
    phi_tu_van: 39000000,
    phi_trung_tam: 11000000,
    ve_may_bay: { amount: 8000000, optional: true },
    ktx_vn: { amount_per_month: 800000, optional: true }
  };
  
  commonFees.forEach(fee => {
    if (fee.id === 'hoc_tieng' || fee.name?.includes('tiếng')) {
      result.hoc_tieng = fee.amount ?? 13000000;
    }
    if (fee.id === 'phi_tu_van' || fee.name?.includes('tư vấn')) {
      result.phi_tu_van = fee.amount ?? 39000000;
    }
    if (fee.id === 'phi_trung_tam' || fee.name?.includes('trung tâm')) {
      result.phi_trung_tam = fee.amount ?? 11000000;
    }
    if (fee.id === 've_may_bay' || fee.name?.includes('máy bay')) {
      result.ve_may_bay = { amount: fee.amount ?? 8000000, optional: fee.optional ?? true };
    }
    if (fee.id === 'ktx_vn' || fee.name?.includes('KTX')) {
      result.ktx_vn = { amount_per_month: fee.amountPerMonth ?? 800000, optional: fee.optional ?? true };
    }
  });
  
  return result;
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
        luiNThang: system.lui_n_thang ?? system.luiNThang ?? 6
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

// Normalize common fees helper
const normalizeCommonFees = (rawData: any) => {
  if (!rawData) return [];
  if (Array.isArray(rawData)) return rawData;
  
  const fees = [];
  if (rawData.hoc_tieng !== undefined || rawData.hocTieng !== undefined) {
    fees.push({ 
      id: 'hoc_tieng', 
      name: 'Học tiếng Hàn', 
      amount: rawData.hoc_tieng ?? rawData.hocTieng ?? 13000000, 
      editable: true 
    });
  }
  if (rawData.phi_tu_van !== undefined || rawData.phiTuVan !== undefined) {
    fees.push({ 
      id: 'phi_tu_van', 
      name: 'Phí tư vấn', 
      amount: rawData.phi_tu_van ?? rawData.phiTuVan ?? 39000000, 
      editable: true 
    });
  }
  if (rawData.phi_trung_tam !== undefined || rawData.phiTrungTam !== undefined) {
    fees.push({ 
      id: 'phi_trung_tam', 
      name: 'Phí trung tâm thu hộ', 
      amount: rawData.phi_trung_tam ?? rawData.phiTrungTam ?? 11000000, 
      editable: true, 
      subItems: ['Phí công chứng', 'Tem vàng / Tem tím', 'Xin visa', 'Khám sức khoẻ', 'Ship hồ sơ tại Việt Nam', 'Ship hồ sơ sang trường', 'Đưa đón tại Hàn Quốc', 'Tìm ký túc xá']
    });
  }
  if (rawData.ve_may_bay || rawData.veMayBay) {
    const fee = rawData.ve_may_bay ?? rawData.veMayBay;
    fees.push({ 
      id: 've_may_bay', 
      name: 'Vé máy bay', 
      amount: fee.amount ?? 8000000, 
      optional: fee.optional ?? true, 
      editable: true 
    });
  }
  if (rawData.ktx_vn || rawData.ktxVN) {
    const fee = rawData.ktx_vn ?? rawData.ktxVN;
    fees.push({ 
      id: 'ktx_vn', 
      name: 'KTX Việt Nam', 
      amountPerMonth: fee.amount_per_month ?? fee.amountPerMonth ?? 800000, 
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

const AdminControls = ({ university, onEditClick, onCostConfigClick }: { 
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
};

// Visa Selector Component (Chọn hệ du học)
const VisaSelector = ({ 
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
};

// Admin Cost Summary Component
const AdminCostSummary = ({ university }: { university: any }) => {
  const visaSystems = university.koreanData?.visaSystemsDetail || {};
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
};

// Cost Controls Panel (Left side) - for Admin preview
const AdminCostControls = ({
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
    : [
        { label: 'Khu vực Gyeonggi', amountKRW: 10000000 },
        { label: 'Ngoài Gyeonggi', amountKRW: 8000000 }
      ];
  const scholarships = visaData?.scholarships || [];
  
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
};

// Fee Breakdown Panel (Right side) - for Admin preview
const AdminFeeBreakdown = ({
  commonFees: rawCommonFees,
  visaData,
  topikLevel,
  ktxRoom,
  soTietKiem,
  ktxVN,
  flight
}: any) => {
  const [expanded, setExpanded] = useState(false);
  
  const commonFees = normalizeCommonFees(rawCommonFees);
  
  const hocTiengFee = commonFees.find((f: any) => f.id === 'hoc_tieng');
  const phiTuVanFee = commonFees.find((f: any) => f.id === 'phi_tu_van');
  const phiTrungTamFee = commonFees.find((f: any) => f.id === 'phi_trung_tam');
  const veMayBayFee = commonFees.find((f: any) => f.id === 've_may_bay');
  const ktxVNFee = commonFees.find((f: any) => f.id === 'ktx_vn');
  
  const hocTieng = hocTiengFee?.amount || 13000000;
  const phiTuVan = phiTuVanFee?.amount || 39000000;
  const phiTrungTam = phiTrungTamFee?.amount || 11000000;
  const veMayBay = flight ? (veMayBayFee?.amount || 8000000) : 0;
  const ktxVNCost = ktxVN * (ktxVNFee?.amountPerMonth || 800000);
  
  const applyFee = visaData?.applyFeeKRW || 0;
  const enrollmentFee = visaData?.enrollmentFeeKRW || 0;
  const invoice = visaData?.invoiceKRWPerYear || 0;
  
  const scholarships = visaData?.scholarships || [];
  const selectedScholarship = scholarships.find((s: any) => s.topikLevel === topikLevel);
  const hocBongAmount = selectedScholarship && invoice > 0 ? -(invoice * selectedScholarship.discountPct / 100) : 0;
  
  const ktxOptions = visaData?.ktxOptions || [];
  const ktxCost = ktxRoom >= 0 && ktxOptions[ktxRoom] ? ktxOptions[ktxRoom].priceKRWPerKy : 0;
  
  const soTietKiemOptions = (visaData?.financialRequirement?.soTietKiemOptions?.length > 0)
    ? visaData.financialRequirement.soTietKiemOptions
    : [
        { label: 'Khu vực Gyeonggi', amountKRW: 10000000 },
        { label: 'Ngoài Gyeonggi', amountKRW: 8000000 }
      ];
  const soTietKiemAmount = soTietKiemOptions[soTietKiem]?.amountKRW || 10000000;
  
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
          Chi phí hệ {visaData?.name || 'D4-1'}
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
          Đã bao gồm sổ TK · ~${Math.round(totalVND / 25500 + totalKRW / 1350).toLocaleString()}
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
};

// Hero Banner Component
const AdminHeroBanner = ({ university }: { university: any }) => {
  const ranking = university.koreanData?.ranking || university.ranking || 'Top 100';
  const location = university.koreanData?.address || university.location || '';
  const visaSystems = university.koreanData?.visaSystemsDetail || {};
  const availableCount = ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length;
  
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '32px 40px',
      border: '1px solid #E8E8E8',
      marginBottom: 24
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1A', marginBottom: 8 }}>
            {university.name}
          </h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
            {location}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: '#FEF3C7',
              color: '#92400E'
            }}>
              {ranking}
            </span>
            <span style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              background: availableCount > 0 ? '#D1FAE5' : '#FEE2E2',
              color: availableCount > 0 ? '#065F46' : '#991B1B'
            }}>
              {availableCount > 0 ? `${availableCount} hệ available` : 'Chưa cấu hình'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Additional Information Section (Missing fields from Detail.txt)
const AdditionalInfoSection = ({ koreanData }: { koreanData: any }) => {
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
};

// Main Admin Component
export default function UniversityDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, fetchUniversity, updateUniversity } = useApp();
  const { user, isAdmin } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showCostConfigModal, setShowCostConfigModal] = useState(false);

  const university = universities.find(uni => uni.id === id);
  
  // Extract and normalize visa systems data - useMemo to prevent recreating on every render
  const rawVisaSystems = university?.koreanData?.visaSystemsDetail || {};
  const visaSystems = useMemo(() => convertVisaSystemsToCamelCase(rawVisaSystems), [rawVisaSystems]);
  const rawCommonFees = (university?.koreanData as any)?.commonFeesVND || (university?.koreanData as any)?.common_fees_vnd;

  // State for interactive controls
  const [selectedVisa, setSelectedVisa] = useState(() => {
    const first = ALL_VISA_SYSTEMS.find(v => visaSystems[v.key]?.available);
    return first?.key || 'D4-1';
  });
  
  const [topikLevel, setTopikLevel] = useState(0);
  const [ktxRoom, setKtxRoom] = useState(0);
  const [soTietKiem, setSoTietKiem] = useState(0);
  const [ktxVN, setKtxVN] = useState(0);
  const [flight, setFlight] = useState(true);
  
  // Reset when visa changes
  useEffect(() => {
    setTopikLevel(0);
    const visaData = visaSystems[selectedVisa];
    if (visaData?.ktxOptions && visaData.ktxOptions.length > 0) {
      setKtxRoom(0);
    } else {
      setKtxRoom(-1);
    }
  }, [selectedVisa, visaSystems]);

  // Force fresh data fetch on mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchUniversity(id);
    }
  }, [id, fetchUniversity]);

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

  // Redirect non-admin users to student view
  if (!isAdmin) {
    navigate(`/university/${id}`);
    return null;
  }

  const visaData = visaSystems[selectedVisa];
  const availableCount = ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length;

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        
        {/* Admin Controls */}
        <AdminControls 
          university={university}
          onEditClick={() => setShowEditModal(true)}
          onCostConfigClick={() => setShowCostConfigModal(true)}
        />

        {/* Hero Banner */}
        <AdminHeroBanner university={university} />

        {/* Visa System Selector - Chọn hệ du học */}
        {availableCount > 0 && (
          <VisaSelector 
            visaSystems={visaSystems}
            selectedVisa={selectedVisa}
            onSelect={setSelectedVisa}
          />
        )}

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          
          {/* LEFT: Cost Controls & Fee Breakdown */}
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

          {/* RIGHT: Admin Cost Summary */}
          <AdminCostSummary university={university} />

        </div>
        
        {/* Additional Information Section - Missing fields from Detail.txt */}
        <AdditionalInfoSection koreanData={university?.koreanData} />
      </div>

      {/* Modals */}
      {showEditModal && university && (
        <EditUniversityModal
          university={university}
          onClose={() => setShowEditModal(false)}
          onSave={async (data) => {
            await updateUniversity(university.id, data);
            setShowEditModal(false);
            if (id) fetchUniversity(id);
            toast.success('Cập nhật thông tin trường thành công!');
          }}
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
                const convertedVisaSystems = convertVisaSystemsToCamelCase(data.visa_systems);
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
                if (id) fetchUniversity(id);
              }}
              onCancel={() => setShowCostConfigModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
