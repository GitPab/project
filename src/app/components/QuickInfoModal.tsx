import React, { useMemo, useState } from 'react';
import type { University } from '../context/AppContext';
import { VISA_SYSTEMS, defaultVisaSystemEntry, initAllVisaSystems } from '../../constants/visaSystems';

type Scholarship = { topik_level: number; discount_pct: number };
type KTXOption = { name: string; price_krw: number };
type SoTietKiemOption = { label: string; amount_krw: number };
type VisaSystemState = {
  available: boolean;
  invoice_krw: number;
  apply_fee_krw: number;
  enrollment_fee_krw: number;
  scholarships: Scholarship[];
  ktx_options: KTXOption[];
  so_tiet_kiem_options: SoTietKiemOption[];
};

type AdmissionState = {
  [key: string]: { gpa_min: number; gap_year_limit: number | null };
};

interface QuickInfoModalProps {
  university: University;
  onClose: () => void;
  onSaved: (payload: any) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #E5E7EB',
  fontSize: 13
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
  display: 'block'
};

const Toggle = ({ on, onChange }: { on: boolean; onChange: (val: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    aria-pressed={on}
    style={{
      width: 36,
      height: 20,
      borderRadius: 999,
      border: `1px solid ${on ? '#2C6DB4' : '#D1D5DB'}`,
      background: on ? '#2C6DB4' : '#F3F4F6',
      position: 'relative',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
  >
    <span style={{
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#fff',
      position: 'absolute',
      top: 1,
      left: on ? 18 : 2,
      transition: 'left 0.2s'
    }} />
  </button>
);

const buildInitialVisaSystems = (university: University): Record<string, VisaSystemState> => {
  const base = initAllVisaSystems() as Record<string, VisaSystemState>;
  const existing = (university as any)?.visa_systems ?? (university as any)?.koreanData?.visa_systems;
  if (existing) {
    Object.keys(base).forEach((key) => {
      const current = existing[key];
      if (current) {
        base[key] = { ...base[key], ...current };
      }
    });
    if (existing['D2-3'] && !base['D2-3M']) base['D2-3M'] = { ...(base['D2-3M'] as any), ...(existing['D2-3'] as any) };
    if (existing['D2-3'] && !base['D2-3P']) base['D2-3P'] = { ...(base['D2-3P'] as any), ...(existing['D2-3'] as any) };
    return base;
  }

  const detail = university.koreanData?.visaSystemsDetail ?? {};
  Object.keys(base).forEach((key) => {
    const system = (detail as any)[key] ?? (key === 'D2-3M' ? (detail as any)['D2-3'] : undefined) ?? (key === 'D2-3P' ? (detail as any)['D2-3'] : undefined);
    if (!system) return;
    base[key] = {
      ...base[key],
      available: system.available ?? base[key].available,
      invoice_krw: system.invoiceKRWPerYear ?? system.invoice_krw ?? base[key].invoice_krw,
      apply_fee_krw: system.applyFeeKRW ?? base[key].apply_fee_krw,
      enrollment_fee_krw: system.enrollmentFeeKRW ?? base[key].enrollment_fee_krw,
      scholarships: (system.scholarships ?? []).map((s: any) => ({
        topik_level: s.topikLevel ?? s.topik_level ?? 3,
        discount_pct: s.discountPct ?? s.discount_pct ?? 0
      })),
      ktx_options: (system.ktxOptions ?? []).map((o: any) => ({
        name: o.name ?? 'KTX',
        price_krw: o.priceKRWPerKy ?? o.price_krw ?? 0
      })),
      so_tiet_kiem_options: (system.financialRequirement?.soTietKiemOptions ?? []).map((o: any) => ({
        label: o.label ?? '',
        amount_krw: o.amountKRW ?? o.amount_krw ?? 0
      }))
    };
  });
  return base;
};

const buildInitialAdmission = (university: University): AdmissionState => {
  const existing = (university as any)?.admission ?? university.koreanData?.admission ?? {};
  const d41 = existing['D4-1'] ?? {};
  const d2 = existing['D2'] ?? existing['D2-2'] ?? {};
  return {
    'D4-1': { gpa_min: d41.gpaMin ?? d41.gpa_min ?? 7.0, gap_year_limit: d41.gapYearLimit ?? d41.gap_year_limit ?? 2 },
    'D2': { gpa_min: d2.gpaMin ?? d2.gpa_min ?? 6.5, gap_year_limit: d2.gapYearLimit ?? d2.gap_year_limit ?? null }
  };
};

export default function QuickInfoModal({ university, onClose, onSaved }: QuickInfoModalProps) {
  const [step, setStep] = useState(1);
  const [visaSystems, setVisaSystems] = useState<Record<string, VisaSystemState>>(() => buildInitialVisaSystems(university));
  const [admission, setAdmission] = useState<AdmissionState>(() => buildInitialAdmission(university));
  const [partTimeInfo, setPartTimeInfo] = useState((university as any)?.part_time_info ?? university.koreanData?.jobOpportunities ?? '');
  const [majors, setMajors] = useState<string[]>(university.majors ?? university.koreanData?.majors ?? []);
  const [activeVisa, setActiveVisa] = useState<string>('D4-1');

  const hasListData = useMemo(() => Object.values(visaSystems).some(s => s.available && (s.invoice_krw ?? 0) > 0), [visaSystems]);

  const handleSave = () => {
    const admissionPayload = {
      'D4-1': admission['D4-1'],
      'D2': admission['D2']
    };

    const visaSystemsDetail: Record<string, any> = {};
    Object.entries(visaSystems).forEach(([key, system]) => {
      if (!system.available && (system.invoice_krw ?? 0) <= 0) return;
      visaSystemsDetail[key] = {
        available: system.available,
        invoiceKRWPerYear: system.invoice_krw,
        applyFeeKRW: system.apply_fee_krw,
        enrollmentFeeKRW: system.enrollment_fee_krw,
        scholarships: system.scholarships.map(s => ({
          condition: `TOPIK ${s.topik_level}`,
          discountPct: s.discount_pct,
          topikLevel: s.topik_level
        })),
        ktxOptions: system.ktx_options.map(o => ({ name: o.name, priceKRWPerKy: o.price_krw })),
        financialRequirement: {
          soTietKiemOptions: system.so_tiet_kiem_options.map(o => ({ label: o.label, amountKRW: o.amount_krw })),
          luiNThang: 0
        }
      };
    });

    const koreanAdmission: Record<string, any> = {
      'D4-1': { gpaMin: admission['D4-1']?.gpa_min ?? 7.0, gapYearLimit: admission['D4-1']?.gap_year_limit ?? 2, regions: [] },
      'D2': { gpaMin: admission['D2']?.gpa_min ?? 6.5, gapYearLimit: admission['D2']?.gap_year_limit ?? null, regions: [] }
    };

    onSaved({
      visa_systems: visaSystems,
      admission: admissionPayload,
      part_time_info: partTimeInfo,
      majors,
      koreanData: {
        ...university.koreanData,
        admission: koreanAdmission,
        visaSystemsDetail: Object.keys(visaSystemsDetail).length ? visaSystemsDetail : university.koreanData?.visaSystemsDetail,
        majors,
        jobOpportunities: partTimeInfo
      }
    });
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto',
        padding: '32px 16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 720,
          maxHeight: 'calc(100vh - 64px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '20px 24px 12px', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Nhập thông tin hiển thị danh sách</h2>
              <p style={{ fontSize: 12, color: '#6B7280' }}>{university.name} · {university.koreanName}</p>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 18
            }}>×</button>
          </div>
          <div style={{ paddingTop: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? '#185FA5' : '#E5E7EB' }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
              {['Hệ visa & Học phí', 'Học bổng & KTX', 'Ưu đãi & Preview'][step - 1]}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <Step1
              visaSystems={visaSystems}
              setVisaSystems={setVisaSystems}
              admission={admission}
              setAdmission={setAdmission}
            />
          )}
          {step === 2 && (
            <Step2
              activeVisa={activeVisa}
              setActiveVisa={setActiveVisa}
              visaSystems={visaSystems}
              setVisaSystems={setVisaSystems}
            />
          )}
          {step === 3 && (
            <Step3
              university={university}
              visaSystems={visaSystems}
              admission={admission}
              partTimeInfo={partTimeInfo}
              setPartTimeInfo={setPartTimeInfo}
              majors={majors}
              setMajors={setMajors}
            />
          )}
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #E5E7EB', padding: '12px 24px', display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={step > 1 ? () => setStep(s => s - 1) : onClose}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {step > 1 ? '← Quay lại' : 'Hủy'}
          </button>
          <button
            onClick={step < 3 ? () => setStep(s => s + 1) : handleSave}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #185FA5', background: '#185FA5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {step < 3 ? 'Tiếp theo →' : `✓ Lưu thông tin hiển thị${hasListData ? '' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step1({
  visaSystems,
  setVisaSystems,
  admission,
  setAdmission
}: {
  visaSystems: Record<string, VisaSystemState>;
  setVisaSystems: React.Dispatch<React.SetStateAction<Record<string, VisaSystemState>>>;
  admission: AdmissionState;
  setAdmission: React.Dispatch<React.SetStateAction<AdmissionState>>;
}) {
  return (
    <>
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Hệ visa & Invoice học phí</h3>
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 10 }}>
          {VISA_SYSTEMS.map((visa, idx) => {
            const sys = visaSystems[visa.key] ?? defaultVisaSystemEntry(visa.key);
            const isOn = sys.available;
            return (
            <div key={visa.key} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 12px',
              borderBottom: idx === VISA_SYSTEMS.length - 1 ? 'none' : '1px solid #F1F5F9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Toggle
                  on={isOn}
                  onChange={(val) => setVisaSystems(prev => ({
                    ...prev,
                    [visa.key]: { ...(prev[visa.key] ?? defaultVisaSystemEntry(visa.key)), available: val }
                  }))}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {visa.label} · {visa.name}
                    {visa.popular && <span style={{ fontSize: 10, padding: '1px 6px', background: '#E6F1FB', color: '#0C447C', borderRadius: 5 }}>Phổ biến</span>}
                    {visa.best_scholarship && <span style={{ fontSize: 10, padding: '1px 6px', background: '#EAF3DE', color: '#3B6D11', borderRadius: 5 }}>HB cao nhất</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{visa.description}</div>
                </div>
              </div>
              <div style={{ width: 190, opacity: isOn ? 1 : 0.4 }}>
                <div style={{ display: 'flex', border: '0.5px solid #E5E7EB', borderRadius: 7, overflow: 'hidden' }}>
                  <input
                    type="number"
                    disabled={!isOn}
                    value={sys.invoice_krw || ''}
                    onChange={(e) => setVisaSystems(prev => ({
                      ...prev,
                      [visa.key]: { ...(prev[visa.key] ?? defaultVisaSystemEntry(visa.key)), invoice_krw: Number(e.target.value) }
                    }))}
                    placeholder={isOn ? 'Invoice' : 'Không có'}
                    style={{ flex: 1, padding: '7px 10px', border: 'none', fontSize: 12, background: 'white' }}
                  />
                  <span style={{ padding: '7px 8px', background: '#F9FAFB', fontSize: 11, color: '#6B7280', borderLeft: '0.5px solid #E5E7EB' }}>
                    {visa.invoice_unit === 'per_ky' ? 'KRW/kỳ' : visa.invoice_unit === 'flat' ? 'KRW' : 'KRW/năm'}
                  </span>
                </div>
              </div>
            </div>
          )})}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Điều kiện tuyển sinh</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {['D4-1', 'D2'].map(sys => (
            <div key={sys} style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 700, color: '#185FA5', marginBottom: 8 }}>{sys}</div>
              <label style={labelStyle}>GPA tối thiểu</label>
              <input
                type="number"
                step="0.1"
                value={admission[sys]?.gpa_min ?? ''}
                onChange={e => setAdmission(prev => ({ ...prev, [sys]: { ...prev[sys], gpa_min: parseFloat(e.target.value) } }))}
                style={inputStyle}
              />
              <label style={{ ...labelStyle, marginTop: 10 }}>Năm trống tối đa</label>
              <select
                value={admission[sys]?.gap_year_limit ?? 'unlimited'}
                onChange={e => setAdmission(prev => ({
                  ...prev,
                  [sys]: { ...prev[sys], gap_year_limit: e.target.value === 'unlimited' ? null : Number(e.target.value) }
                }))}
                style={inputStyle}
              >
                <option value="unlimited">Không giới hạn</option>
                <option value="1">1 năm</option>
                <option value="2">2 năm</option>
                <option value="3">3 năm</option>
              </select>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Step2({
  activeVisa,
  setActiveVisa,
  visaSystems,
  setVisaSystems
}: {
  activeVisa: string;
  setActiveVisa: (value: string) => void;
  visaSystems: Record<string, VisaSystemState>;
  setVisaSystems: React.Dispatch<React.SetStateAction<Record<string, VisaSystemState>>>;
}) {
  const updateSystem = (key: string, updater: (current: VisaSystemState) => VisaSystemState) => {
    setVisaSystems(prev => ({ ...prev, [key]: updater(prev[key] ?? defaultVisaSystemEntry(key)) }));
  };

  const system = visaSystems[activeVisa] ?? defaultVisaSystemEntry(activeVisa);

  return (
    <>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {VISA_SYSTEMS.map((visa) => {
          const isAvailable = visaSystems[visa.key]?.available;
          const isActive = activeVisa === visa.key;
          return (
            <button
              key={visa.key}
              disabled={!isAvailable}
              onClick={() => isAvailable && setActiveVisa(visa.key)}
              style={{
                padding: '5px 11px',
                borderRadius: 14,
                fontSize: 11,
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                border: isActive ? '0.5px solid #185FA5' : '0.5px solid #E5E7EB',
                background: isActive ? '#185FA5' : isAvailable ? 'white' : '#F9FAFB',
                color: isActive ? '#fff' : isAvailable ? '#374151' : '#9CA3AF',
                opacity: isAvailable ? 1 : 0.45,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
              }}
            >
              <span>{visa.label}</span>
              <span style={{ fontSize: 9, color: isActive ? 'rgba(255,255,255,.7)' : isAvailable ? '#6B7280' : '#E24B4A' }}>
                {isAvailable ? visa.name : 'Không có'}
              </span>
            </button>
          );
        })}
      </div>

      {activeVisa && (visaSystems[activeVisa]?.available) && (
        <section style={{ marginBottom: 16, border: '1px solid #E5E7EB', borderRadius: 10, padding: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Học bổng theo TOPIK — {activeVisa}</h3>
          {system.scholarships.map((item, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 32px', gap: 8, marginBottom: 8 }}>
            <select
              value={item.topik_level}
              onChange={(e) => updateSystem(activeVisa, current => {
                const list = [...current.scholarships];
                list[index] = { ...list[index], topik_level: Number(e.target.value) };
                return { ...current, scholarships: list };
              })}
              style={inputStyle}
            >
              {[2, 3, 4, 5, 6].map(level => (
                <option key={level} value={level}>TOPIK {level}</option>
              ))}
            </select>
            <input
              type="number"
              value={item.discount_pct}
              onChange={(e) => updateSystem(activeVisa, current => {
                const list = [...current.scholarships];
                list[index] = { ...list[index], discount_pct: Number(e.target.value) };
                return { ...current, scholarships: list };
              })}
              placeholder="% giảm"
              style={inputStyle}
            />
            <button
              onClick={() => updateSystem(activeVisa, current => ({
                ...current,
                scholarships: current.scholarships.filter((_, i) => i !== index)
              }))}
              style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          ))}
          <button
            onClick={() => updateSystem(activeVisa, current => ({
              ...current,
              scholarships: [...current.scholarships, { topik_level: 3, discount_pct: 30 }]
            }))}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px dashed #CBD5F5', background: '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            + Thêm mức học bổng
          </button>
        </section>
      )}

      {activeVisa && (visaSystems[activeVisa]?.available) && (
        <>
          <section style={{ marginBottom: 16, border: '1px solid #E5E7EB', borderRadius: 10, padding: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Ký túc xá tại Hàn</h3>
            {system.ktx_options.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: 8, marginBottom: 8 }}>
                <input
                  value={item.name}
                  onChange={(e) => updateSystem(activeVisa, current => {
                    const list = [...current.ktx_options];
                    list[index] = { ...list[index], name: e.target.value };
                    return { ...current, ktx_options: list };
                  })}
                  placeholder="Loại phòng"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.price_krw}
                  onChange={(e) => updateSystem(activeVisa, current => {
                    const list = [...current.ktx_options];
                    list[index] = { ...list[index], price_krw: Number(e.target.value) };
                    return { ...current, ktx_options: list };
                  })}
                  placeholder="Giá KRW/kỳ"
                  style={inputStyle}
                />
                <button
                  onClick={() => updateSystem(activeVisa, current => ({
                    ...current,
                    ktx_options: current.ktx_options.filter((_, i) => i !== index)
                  }))}
                  style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => updateSystem(activeVisa, current => ({
                ...current,
                ktx_options: [...current.ktx_options, { name: 'Phòng 4 người', price_krw: 747000 }]
              }))}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px dashed #CBD5F5', background: '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              + Thêm loại phòng
            </button>
          </section>

          <section style={{ border: '1px solid #E5E7EB', borderRadius: 10, padding: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Sổ tiết kiệm (điều kiện visa)</h3>
            {system.so_tiet_kiem_options.map((item, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 32px', gap: 8, marginBottom: 8 }}>
                <input
                  value={item.label}
                  onChange={(e) => updateSystem(activeVisa, current => {
                    const list = [...current.so_tiet_kiem_options];
                    list[index] = { ...list[index], label: e.target.value };
                    return { ...current, so_tiet_kiem_options: list };
                  })}
                  placeholder="Khu vực"
                  style={inputStyle}
                />
                <input
                  type="number"
                  value={item.amount_krw}
                  onChange={(e) => updateSystem(activeVisa, current => {
                    const list = [...current.so_tiet_kiem_options];
                    list[index] = { ...list[index], amount_krw: Number(e.target.value) };
                    return { ...current, so_tiet_kiem_options: list };
                  })}
                  placeholder="Số tiền KRW"
                  style={inputStyle}
                />
                <button
                  onClick={() => updateSystem(activeVisa, current => ({
                    ...current,
                    so_tiet_kiem_options: current.so_tiet_kiem_options.filter((_, i) => i !== index)
                  }))}
                  style={{ border: '1px solid #E5E7EB', borderRadius: 8, background: '#fff', cursor: 'pointer' }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => updateSystem(activeVisa, current => ({
                ...current,
                so_tiet_kiem_options: [...current.so_tiet_kiem_options, { label: 'Khu vực Gyeonggi', amount_krw: 10000000 }]
              }))}
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px dashed #CBD5F5', background: '#F8FAFC', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              + Thêm mức số
            </button>
          </section>
        </>
      )}
    </>
  );
}

function Step3({
  university,
  visaSystems,
  admission,
  partTimeInfo,
  setPartTimeInfo,
  majors,
  setMajors
}: {
  university: University;
  visaSystems: Record<string, VisaSystemState>;
  admission: AdmissionState;
  partTimeInfo: string;
  setPartTimeInfo: (value: string) => void;
  majors: string[];
  setMajors: (value: string[]) => void;
}) {
  const preview = useMemo(() => {
    const availableSystems = Object.entries(visaSystems).filter(([, system]) => system.available && (system.invoice_krw ?? 0) > 0);
    const lowest = availableSystems.reduce((acc, [key, system]) => {
      if (!acc || system.invoice_krw < acc.amount) return { amount: system.invoice_krw, key };
      return acc;
    }, null as null | { amount: number; key: string });

    const scholarships = Object.values(visaSystems).flatMap(s => s.scholarships || []);
    const maxHB = scholarships.length ? Math.max(...scholarships.map(s => s.discount_pct)) : 0;
    const cheapestKtx = Object.values(visaSystems)
      .flatMap(s => s.ktx_options || [])
      .reduce((acc, item) => (acc === null || item.price_krw < acc ? item.price_krw : acc), null as number | null);
    const gpaMin = admission['D4-1']?.gpa_min ?? 0;
    const perks: string[] = [];
    if (maxHB >= 100) perks.push('🎓 HB đến 100%');
    else if (maxHB >= 50) perks.push(`🎓 HB ${maxHB}%`);
    if (cheapestKtx) perks.push(`🏠 KTX ${(cheapestKtx / 1000).toFixed(0)}K`);
    if (partTimeInfo) perks.push('💼 Việc làm');
    if (gpaMin > 0 && gpaMin <= 6.5) perks.push(`📋 GPA ${gpaMin}`);
    if (majors.length) perks.push(majors[0]);

    return { lowest, maxHB, perks };
  }, [visaSystems, admission, partTimeInfo, majors]);

  const majorsText = majors.join(', ');

  return (
    <>
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Việc làm thêm & Ưu đãi khác</h3>
        <label style={labelStyle}>Mô tả cơ hội việc làm</label>
        <input
          value={partTimeInfo}
          onChange={(e) => setPartTimeInfo(e.target.value)}
          placeholder="VD: Nhà hàng, CVS cách 10' bus khu trung tâm"
          style={inputStyle}
        />
        <label style={{ ...labelStyle, marginTop: 10 }}>Chuyên ngành nổi bật (dùng làm badge)</label>
        <input
          value={majorsText}
          onChange={(e) => setMajors(e.target.value.split(',').map(part => part.trim()).filter(Boolean))}
          placeholder="VD: Kỹ thuật, IT, Y dược..."
          style={inputStyle}
        />
      </section>

      <section style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Preview — Hiển thị trong danh sách</h3>
        <div style={{
          border: '1px solid #E7DFD6',
          borderRadius: 12,
          padding: 12,
          background: '#fff',
          display: 'grid',
          gridTemplateColumns: '2.2fr 140px 1.8fr 1.3fr 90px',
          gap: 12,
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700 }}>{university.name}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{university.koreanName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#185FA5' }}>
              {preview.lowest ? `${preview.lowest.amount.toLocaleString('vi-VN')} KRW` : '—'}
            </div>
            <div style={{ fontSize: 10, color: '#6B7280' }}>
              {preview.lowest ? `${preview.lowest.key} · mỗi năm` : 'Chưa có'}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {preview.perks.length ? preview.perks.map((perk, idx) => (
              <span key={idx} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: '#F4EFE8', border: '1px solid #E7DFD6' }}>
                {perk}
              </span>
            )) : (
              <span style={{ fontSize: 12, color: '#6B7280' }}>—</span>
            )}
          </div>
          <div>
            {preview.maxHB > 0 ? (
              <>
                <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4 }}>TOPIK · học bổng</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, height: 6, background: '#EFE9E1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${preview.maxHB}%`, height: '100%', background: '#639922' }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>-{preview.maxHB}%</span>
                </div>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#6B7280' }}>—</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', fontSize: 12 }}>Xem</button>
            <button style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#F4EFE8', fontSize: 12 }}>Sửa</button>
          </div>
        </div>
      </section>
    </>
  );
}
