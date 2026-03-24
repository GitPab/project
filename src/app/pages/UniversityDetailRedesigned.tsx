import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { toast } from 'sonner';
import type { AcademicProgram } from '../../types/university';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DESIGN_TOKENS, VISA_SYSTEMS, normalizeTier } from '../styles/designTokens';

// Hero Banner Component
const HeroBanner = ({ university }: { university: any }) => {
  const tier = normalizeTier(university.top_tier || university.koreanData?.topTier);
  const tierColors = { '1': DESIGN_TOKENS.colors.top1Green, '2': DESIGN_TOKENS.colors.top2Orange, '3': DESIGN_TOKENS.colors.top3Red };
  
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 220,
      background: DESIGN_TOKENS.colors.primaryBlue,
      borderRadius: 0,
      overflow: 'hidden',
      marginBottom: 0,
    }}>
      {/* Background university photo */}
      {university.image_cover ? (
        <img src={university.image_cover} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', opacity: 0.4
        }} />
      ) : (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, #1B3F8B 0%, #2D5BB8 100%)'
        }} />
      )}

      {/* Dark overlay gradient from bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 70%)'
      }} />

      {/* University logo circle — top right */}
      {university.image_logo && (
        <div style={{
          position: 'absolute', top: 24, right: 32,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          border: '2px solid rgba(255,255,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden'
        }}>
          <img src={university.image_logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      )}

      {/* University name — bottom left */}
      <div style={{ position: 'absolute', bottom: 24, left: 32 }}>
        <h1 style={{
          fontSize: 32, fontWeight: 700, color: '#FFFFFF',
          textTransform: 'uppercase', marginBottom: 4, letterSpacing: 1
        }}>
          {university.name}
        </h1>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }}>
          {university.name_korean || university.koreanName}
        </div>
      </div>
    </div>
  );
};

// Scholarship Text Component
const ScholarshipText = ({ university }: { university: any }) => {
  const systems = university?.visa_systems ?? {};
  const lines: JSX.Element[] = [];

  // D4-1
  const d41 = systems['D4-1'];
  if (d41?.available) {
    const hbs = d41.scholarships ?? [];
    lines.push(
      <div key="d41">
        <strong>• Hệ D4-1:</strong> {hbs.length === 0 ? 'Không có' : hbs.map((h: any) => `${h.condition}: Giảm ${h.discount_pct}%`).join(', ')}
      </div>
    );
  }

  // D2-2
  const d22 = systems['D2-2'];
  if (d22?.available && (d22.scholarships ?? []).length > 0) {
    lines.push(
      <div key="d22">
        <strong>• Hệ đại học D2-2:</strong>
        {d22.scholarships.map((h: any, i: number) => (
          <div key={i} style={{ paddingLeft: 12 }}>– {h.condition}: giảm {h.discount_pct}% học phí kỳ đầu.</div>
        ))}
      </div>
    );
  }

  // D2-3
  const d23 = systems['D2-3M'];
  if (d23?.available && (d23.scholarships ?? []).length > 0) {
    lines.push(
      <div key="d23">
        <strong>• Hệ cao học D2-3:</strong>
        {d23.scholarships.map((h: any, i: number) => (
          <div key={i} style={{ paddingLeft: 12 }}>– {h.condition}: giảm {h.discount_pct}%</div>
        ))}
      </div>
    );
  }

  // Fallback: raw text
  if (lines.length === 0 && university.scholarship_text?.raw) {
    return <div style={{ whiteSpace: 'pre-line' }}>{university.scholarship_text.raw}</div>;
  }

  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{lines}</div>;
};

// KTX Text Component
const KTXText = ({ university }: { university: any }) => {
  const ktxInfo = university?.common_fees_vnd?.find((fee: any) => 
    fee.name.toLowerCase().includes('ktx') || fee.name.toLowerCase().includes('ký túc xá')
  );
  
  if (ktxInfo) {
    return (
      <div>
        <div>Giá tham khảo: {ktxInfo.amount?.toLocaleString('vi-VN')} VNĐ/tháng</div>
        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
          {ktxInfo.note || 'Giá có thể thay đổi tùy theo loại phòng và vị trí'}
        </div>
      </div>
    );
  }
  
  return <div>—</div>;
};

// ThongTinChungCard Component
const ThongTinChungCard = ({ university }: { university: any }) => {
  const tier = normalizeTier(university.top_tier || university.koreanData?.topTier);
  const tierColors: Record<string, string> = { '1': DESIGN_TOKENS.colors.top1Green, '2': DESIGN_TOKENS.colors.top2Orange, '3': DESIGN_TOKENS.colors.top3Red };
  const tierBg = tierColors[tier] ?? DESIGN_TOKENS.colors.top1Green;

  return (
    <div style={{
      background: '#fff', border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
      borderRadius: 12, padding: 28, position: 'relative'
    }}>
      {/* TOP VISA badge — top right corner */}
      <div style={{
        position: 'absolute', top: 24, right: 24,
        background: tierBg, borderRadius: 8,
        padding: '8px 12px', textAlign: 'center', minWidth: 72
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#fff', letterSpacing: 1 }}>
          TOP VISA
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
          {tier === '1' ? '01' : tier === '2' ? '02' : '03'}
        </div>
      </div>

      {/* Section title */}
      <h2 style={DESIGN_TOKENS.typography.sectionTitle}>
        THÔNG TIN CHUNG
      </h2>

      {/* Tên trường */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Tên trường:</div>
        <div style={{ fontSize: 13, color: '#444', paddingLeft: 12 }}>
          <div>Tiếng Việt: {university.name_vi ?? university.name}</div>
          <div>Tiếng Hàn: {university.name_korean || university.koreanName}</div>
        </div>
      </div>

      {/* Địa chỉ */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Địa chỉ</div>
        <div style={{ fontSize: 13, color: '#444', paddingLeft: 12 }}>
          {university.address || university.koreanData?.address}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, margin: '16px 0' }} />

      {/* Chuyên ngành tiêu biểu */}
      <div style={{ display: 'flex', marginBottom: 16, gap: 16, alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 160 }}>Chuyên ngành tiêu biểu</div>
        <div style={{ fontSize: 13, color: '#444', flex: 1 }}>
          {(university.majors || university.academicPrograms?.map((p: AcademicProgram) => p.title) || []).join(', ')}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, margin: '16px 0' }} />

      {/* Điều kiện tuyển sinh — ORANGE BOX */}
      <div style={{ display: 'flex', marginBottom: 16, gap: 16, alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: DESIGN_TOKENS.colors.top2Orange, minWidth: 160, display: 'flex', alignItems: 'center', gap: 6 }}>
          ℹ Điều kiện tuyển sinh
        </div>
        <div style={{
          flex: 1, background: DESIGN_TOKENS.colors.admissionBg,
          borderRadius: 8, padding: '10px 14px', fontSize: 13
        }}>
          <div>
            <strong>D4-1:</strong> GPA ≥ {(university as any)?.admission?.['D4-1']?.gpa_min ?? '?'};
            Số năm trống {'<'} {(university as any)?.admission?.['D4-1']?.gap_year_limit ?? '?'} năm
          </div>
          <div><strong>D2:</strong> GPA ≥ {(university as any)?.admission?.['D2']?.gpa_min ?? '?'}</div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, margin: '16px 0' }} />

      {/* Chính sách học bổng — GREEN BOX */}
      <div style={{ display: 'flex', marginBottom: 16, gap: 16, alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: DESIGN_TOKENS.colors.top1Green, minWidth: 160, display: 'flex', alignItems: 'center', gap: 6 }}>
          🎓 Chính sách học bổng
        </div>
        <div style={{
          flex: 1, background: DESIGN_TOKENS.colors.scholarshipBg,
          borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.8
        }}>
          <ScholarshipText university={university} />
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, margin: '16px 0' }} />

      {/* Cơ hội việc làm */}
      <div style={{ display: 'flex', marginBottom: 16, gap: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 160 }}>Cơ hội việc làm</div>
        <div style={{ fontSize: 13, color: '#444', flex: 1 }}>
          {(university.koreanData as any)?.workOpportunity || (university.koreanData as any)?.jobOpportunities || university.part_time_info || '—'}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, margin: '16px 0' }} />

      {/* Thông tin ký túc xá */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, minWidth: 160 }}>Thông tin ký túc xá</div>
        <div style={{ fontSize: 13, color: '#444', flex: 1 }}>
          <KTXText university={university} />
        </div>
      </div>
    </div>
  );
};

// ThongTinHocVienCard Component
const ThongTinHocVienCard = ({ universityName }: { universityName: string }) => {
  const [form, setForm] = useState({ name: '', phone: '', visa: 'D4-1', topik: 'TOPIK 4' });

  return (
    <div style={{
      background: DESIGN_TOKENS.colors.primaryBlue, borderRadius: 12, padding: 24, color: '#fff',
      position: 'sticky', top: 20
    }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 20, textAlign: 'center' }}>
        THÔNG TIN HỌC VIÊN
      </h3>

      {[
        { label: 'Họ và tên', key: 'name', type: 'text', placeholder: 'Nguyễn Văn An' },
        { label: 'Số điện thoại', key: 'phone', type: 'tel', placeholder: '0123456789' },
      ].map(f => (
        <div key={f.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{f.label}</span>
          <input
            type={f.type}
            placeholder={f.placeholder}
            value={form[f.key as keyof typeof form]}
            onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
            style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 13, textAlign: 'right', outline: 'none', width: 140 }}
          />
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Hệ VISA</span>
        <select value={form.visa} onChange={e => setForm(p => ({ ...p, visa: e.target.value }))}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          {['D4-1', 'D2-2', 'D2-3', 'D2-6'].map(v => <option key={v} value={v} style={{ background: DESIGN_TOKENS.colors.primaryBlue }}>{v}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Trình độ tiếng Hàn</span>
        <select value={form.topik} onChange={e => setForm(p => ({ ...p, topik: e.target.value }))}
          style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
          {['Chưa có', 'TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5', 'TOPIK 6'].map(t => <option key={t} value={t} style={{ background: DESIGN_TOKENS.colors.primaryBlue }}>{t}</option>)}
        </select>
      </div>

      <button style={{
        width: '100%', padding: '14px', borderRadius: 8, border: 'none',
        background: DESIGN_TOKENS.colors.top3Red, color: '#fff', fontWeight: 700, fontSize: 15,
        cursor: 'pointer', marginTop: 20
      }}>
        Đăng ký ngay
      </button>
    </div>
  );
};

// BangBocTachChiPhi Component
const BangBocTachChiPhi = ({ university }: { university: any }) => {
  // State for calculator
  const [selectedVisa, setSelectedVisa] = useState('D4-1');
  const [topikLevel, setTopikLevel] = useState(0);
  const [ktxType, setKtxType] = useState(0);
  const [ktxVnMonths, setKtxVnMonths] = useState(0);
  const [includeVeMayBay, setIncludeVeMayBay] = useState(false);

  // Get data
  const commonFees = university?.common_fees_vnd?.reduce((acc: any, fee: any) => {
    acc[fee.id] = fee;
    return acc;
  }, {}) ?? {};
  
  const visaData = university?.visa_systems?.[selectedVisa] ?? {};
  const scholarships = visaData.scholarships ?? [];
  const bestHB = scholarships.find((h: any) => h.topik_level === topikLevel);
  const hbDiscount = bestHB ? Math.round((visaData.invoice_krw || 0) * bestHB.discount_pct / 100) : 0;
  const ktxOptions = visaData.ktx_options ?? [];
  const selectedKtx = ktxOptions[ktxType];

  // Calculate rows
  const rows = [
    { stt: '01', name: 'Học tiếng Hàn', sub: '0 đến TOPIK 2', amount: commonFees.hoc_tieng?.amount ?? 13000000, unit: 'VNĐ', note: 'Tự học / đã có chứng chỉ', type: 'fixed' },
    { stt: '02', name: 'Phí tư vấn & Xử lý hồ sơ', sub: 'Hỗ trợ xử dụng hồ sơ', amount: commonFees.phi_tu_van?.amount ?? 39000000, unit: 'VNĐ', note: 'Cố định', type: 'fixed' },
    { stt: '03', name: 'Phí thu hộ bên thứ ba', sub: 'Công chứng, Tem, Visa, Khám SK, Ship...', amount: commonFees.phi_trung_tam?.amount ?? 11000000, unit: 'VNĐ', note: 'Cố định', type: 'fixed' },
    { stt: '04', name: 'Phí apply trường', sub: '', amount: visaData.apply_fee_krw ?? 0, unit: 'KRW', note: 'Cố định', type: 'fixed' },
    { stt: '05', name: 'Phí nhập học trường Hàn Quốc', sub: '', amount: visaData.enrollment_fee_krw ?? 0, unit: 'VNĐ', note: 'Cố định', type: 'fixed' },
    { stt: '06', name: 'Ký túc xá tại Việt Nam', sub: '', amount: (commonFees.ktx_vn?.amount_per_month ?? 800000) * ktxVnMonths, unit: 'VNĐ', note: ktxVnMonths > 0 ? `${ktxVnMonths} tháng` : 'Không ở', type: 'optional',
      control: <select value={ktxVnMonths} onChange={e => setKtxVnMonths(Number(e.target.value))} style={{ fontSize: 12 }}>
        {[0,1,2,3,4,5,6].map(m => <option key={m} value={m}>{m === 0 ? 'Không ở' : m + ' tháng'}</option>)}
      </select>
    },
    { stt: '07', name: 'Học phí trường Hàn Quốc', sub: '(1 năm / 4 kỳ)', amount: visaData.invoice_krw ?? 0, unit: 'KRW', note: 'Theo trường đã chọn', type: 'fixed' },
    { stt: '08', name: 'Học bổng', sub: `${(bestHB?.discount_pct ?? 0)}% / tháng`, amount: -hbDiscount, unit: 'KRW', note: '', type: 'scholarship',
      control: <select value={topikLevel} onChange={e => setTopikLevel(Number(e.target.value))} style={{ fontSize: 12 }}>
        <option value={0}>0%</option>
        {scholarships.map((h: any) => <option key={h.topik_level} value={h.topik_level}>{h.discount_pct}%</option>)}
      </select>
    },
    { stt: '09', name: 'Ký túc xá / Thuê nhà tại Hàn Quốc', sub: 'Tự thuê / tính kỳ', amount: selectedKtx?.price_krw ?? 0, unit: 'KRW', note: selectedKtx?.name ?? '—', type: 'optional',
      control: <select value={ktxType} onChange={e => setKtxType(Number(e.target.value))} style={{ fontSize: 12 }}>
        {ktxOptions.map((k: any, i: number) => <option key={i} value={i}>{k.name}</option>)}
        <option value={-1}>Tự thuê</option>
      </select>
    },
    { stt: '10', name: 'Vé máy bay 1 chiều', sub: 'Bao gồm 40kg ký gửi', amount: includeVeMayBay ? (commonFees.ve_may_bay?.amount ?? 8000000) : 0, unit: 'VNĐ', note: (commonFees.ve_may_bay?.amount ?? 8000000).toLocaleString('vi-VN') + ' đ', type: 'optional',
      control: <input type="checkbox" checked={includeVeMayBay} onChange={e => setIncludeVeMayBay(e.target.checked)} />
    },
  ];

  return (
    <div style={{ background: '#fff', border: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, borderRadius: 12, padding: 28, marginTop: 24 }}>
      <h2 style={DESIGN_TOKENS.typography.sectionTitle}>
        BẢNG GIÁ BÓC TÁCH CHI TIẾT
      </h2>

      {/* Visa selector tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {VISA_SYSTEMS.filter(v => university.visa_systems?.[v.key]?.available).map(visa => (
          <button key={visa.key}
            onClick={() => setSelectedVisa(visa.key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              border: selectedVisa === visa.key ? 'none' : `1px solid ${DESIGN_TOKENS.colors.borderLight}`,
              background: selectedVisa === visa.key ? DESIGN_TOKENS.colors.primaryBlue : '#fff',
              color: selectedVisa === visa.key ? '#fff' : '#444',
              fontWeight: selectedVisa === visa.key ? 600 : 400,
            }}>
            {visa.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#F8F9FA' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#666', borderBottom: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, width: 40 }}>STT</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#666', borderBottom: `1px solid ${DESIGN_TOKENS.colors.borderLight}` }}>HẠNG MỤC</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 12, color: '#666', borderBottom: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, width: 140 }}>CHI PHÍ</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: '#666', borderBottom: `1px solid ${DESIGN_TOKENS.colors.borderLight}`, width: 180 }}>MÔ TẢ/TÙY CHỌN</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.stt} style={{ background: row.type === 'scholarship' ? DESIGN_TOKENS.colors.scholarshipBg : 'transparent', borderBottom: '1px solid #F0F0F0' }}>
              <td style={{ padding: '12px', color: '#999', fontWeight: 500 }}>{row.stt}</td>
              <td style={{ padding: '12px' }}>
                <div style={{ fontWeight: row.type === 'scholarship' ? 600 : 500, color: row.type === 'scholarship' ? DESIGN_TOKENS.colors.top1Green : DESIGN_TOKENS.colors.textPrimary }}>
                  {row.name}
                </div>
                {row.sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{row.sub}</div>}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: row.amount < 0 ? DESIGN_TOKENS.colors.top1Green : row.amount === 0 ? '#999' : DESIGN_TOKENS.colors.primaryBlue }}>
                {row.amount < 0 ? '-' : ''}{Math.abs(row.amount).toLocaleString('vi-VN')} {row.amount !== 0 && <span style={{ fontSize: 11 }}>{row.unit === 'VNĐ' ? 'đ' : '₩'}</span>}
                {row.amount === 0 && <span style={{ fontSize: 11, color: '#999' }}>0 đ</span>}
              </td>
              <td style={{ padding: '12px', color: '#666' }}>
                {row.control ?? <span style={{ fontSize: 12 }}>{row.note}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Total Section Component
const TotalSection = ({ university }: { university: any }) => {
  // Calculate totals (simplified for now)
  const totalVnd = 150000000; // Placeholder calculation
  const totalKrw = 5000000; // Placeholder calculation
  const totalUsd = Math.round(totalVnd / 25500 + totalKrw / 1350);

  return (
    <>
      {/* Big blue total box */}
      <div style={{
        background: DESIGN_TOKENS.colors.primaryBlue, borderRadius: 12, padding: '24px 32px',
        marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>
          Tổng chi phí trọn gói
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
            {totalVnd.toLocaleString('vi-VN')} đ
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            *Có thể thay đổi tuỳ theo học bổng và lựa chọn
          </div>
        </div>
      </div>

      {/* Red CTA button */}
      <button style={{
        width: '100%', padding: '18px', borderRadius: 12, border: 'none',
        background: DESIGN_TOKENS.colors.top3Red, color: '#fff', fontWeight: 700, fontSize: 16,
        cursor: 'pointer', marginTop: 12
      }}>
        Đăng ký ngay
      </button>
    </>
  );
};

// Main Component
export default function UniversityDetailRedesigned() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, user, fetchUniversity } = useApp();
  const { formatFrom } = useCurrency();

  const university = universities.find(uni => uni.id === id);

  // Force fresh data fetch on mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchUniversity(id);
    }
  }, [id, fetchUniversity]);

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy trường đại học</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <HeroBanner university={university} />

      {/* Main Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          
          {/* LEFT: Thông tin chung */}
          <ThongTinChungCard university={university} />

          {/* RIGHT: Thông tin học viên (student registration) */}
          <ThongTinHocVienCard universityName={university.name} />

        </div>

        {/* FULL WIDTH: Bảng bóc tách chi phí */}
        <BangBocTachChiPhi university={university} />

        {/* FULL WIDTH: Total + CTA */}
        <TotalSection university={university} />
      </div>
    </div>
  );
}

// Export components for use in admin version
export {
  HeroBanner,
  ThongTinChungCard,
  BangBocTachChiPhi,
  TotalSection
};
