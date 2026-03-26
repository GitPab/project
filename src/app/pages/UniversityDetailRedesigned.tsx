import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button } from '../components/ui/button';

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
  const luiNThang = financialReq.luiNThang ?? 6;
  
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
    fees.push({ id: 've_may_bay', name: 'Vé máy bay', amount: rawData.ve_may_bay.amount || 8000000, optional: rawData.ve_may_bay.optional, editable: true });
  }
  if (rawData.ktx_vn) {
    fees.push({ id: 'ktx_vn', name: 'KTX Việt Nam', amountPerMonth: rawData.ktx_vn.amount_per_month || 800000, optional: rawData.ktx_vn.optional, editable: true });
  }
  
  return fees;
};

// Hero Section Component
const HeroSection = ({ university, availableCount }: { university: any; availableCount: number }) => {
  const ranking = university?.koreanData?.koreanRanking || university?.ranking;
  const address = university?.koreanData?.address || university?.region || 'Hàn Quốc';
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, #F5F0E8 0%, #EDE6DC 100%)',
      borderRadius: 16,
      padding: '24px 28px',
      marginBottom: 24,
      position: 'relative'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {/* Logo placeholder */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          🏫
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>
            {university?.name} <span style={{ fontSize: 14, color: '#666', fontWeight: 400 }}>{university?.koreanName}</span>
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {ranking && (
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#2D8C4E',
                background: '#E8F5E9',
                padding: '4px 10px',
                borderRadius: 20
              }}>
                Top {ranking}
              </span>
            )}
            <span style={{ fontSize: 13, color: '#666' }}>
              {address}
            </span>
          </div>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#2D8C4E',
            background: '#E8F5E9',
            padding: '4px 12px',
            borderRadius: 20
          }}>
            <span style={{ width: 6, height: 6, background: '#2D8C4E', borderRadius: '50%' }} />
            {availableCount} hệ available
          </div>
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
        if (invoice >= 1000000) {
          const min = (invoice * 0.8 / 1000000).toFixed(1);
          const max = (invoice * 1.2 / 1000000).toFixed(1);
          priceDisplay = `${min}-${max}M`;
        } else if (invoice > 0) {
          priceDisplay = (invoice / 1000).toFixed(0) + 'K';
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
            <option value={0}>Khu vực Gyeonggi - 10,000,000 KRW</option>
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
            <option key={m} value={m}>{m} tháng - {formatVND(m * 800000)}đ</option>
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
  
  const hocTieng = hocTiengFee?.amount || 13000000;
  const phiTuVan = phiTuVanFee?.amount || 39000000;
  const phiTrungTam = phiTrungTamFee?.amount || 11000000;
  const veMayBay = flight ? (veMayBayFee?.amount || 8000000) : 0;
  const ktxVNCost = ktxVN * (ktxVNFee?.amountPerMonth || 800000);
  
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
    : [
        { label: 'Khu vực Gyeonggi', amountKRW: 10000000 },
        { label: 'Ngoài Gyeonggi', amountKRW: 8000000 }
      ];
  const soTietKiemAmount = soTietKiemOptions[soTietKiem]?.amountKRW || 10000000;
  
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
          Đã bao gồm sổ TK · ~${Math.round(totalVND / 25500 + totalKRW / 1350).toLocaleString()}
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

// Admission Requirements Section
const AdmissionRequirements = ({ admission, visaData }: any) => {
  const d41Admission = admission?.['D4-1'] || admission?.D4_1;
  const luiNThang = visaData?.financialRequirement?.luiNThang || 6;
  
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
            {d41Admission?.gpaMin ? `≥ ${d41Admission.gpaMin}` : '≥ 7.0'}
          </div>
        </div>
        
        <div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Năm trống / tuổi</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A1A' }}>
            Trống &lt; {d41Admission?.gapYearLimit || 2} năm
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
              : '10,000,000 KRW'}
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

// Main Component
export default function UniversityDetailRedesigned() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, fetchUniversity } = useApp();
  
  const university = universities.find(uni => uni.id === id);
  const rawVisaSystems = university?.koreanData?.visaSystemsDetail || {};
  
  // Normalize all visa system data - useMemo to prevent recreating on every render
  const visaSystems = useMemo(() => {
    const systems: Record<string, ReturnType<typeof normalizeVisaData>> = {};
    Object.keys(rawVisaSystems).forEach(key => {
      systems[key] = normalizeVisaData(rawVisaSystems[key]);
    });
    return systems;
  }, [rawVisaSystems]);
  
  // Count available systems
  const availableCount = ALL_VISA_SYSTEMS.filter(v => visaSystems[v.key]?.available).length;
  
  // State
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
  const admission = university?.koreanData?.admission;
  
  return (
    <div style={{ background: '#F8F7F5', minHeight: '100vh', padding: '24px 0' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px' }}>
        
        {/* Hero */}
        <HeroSection university={university} availableCount={availableCount} />
        
        {/* Cost Preview Cards */}
        <VisaCostCards university={university} />
        
        {/* Visa Selector */}
        <VisaSelector 
          university={university} 
          selectedVisa={selectedVisa}
          onSelect={setSelectedVisa}
        />
        
        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24 }}>
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
        
        {/* Admission Requirements */}
        <AdmissionRequirements admission={admission} visaData={visaData} />
        
        {/* Additional Information - Missing fields from Detail.txt */}
        <AdditionalInfoSection koreanData={university?.koreanData} />
      </div>
    </div>
  );
}

// Re-export components for admin version compatibility
export { HeroSection as HeroBanner, CostControls as ThongTinChungCard, FeeBreakdown as BangBocTachChiPhi };
