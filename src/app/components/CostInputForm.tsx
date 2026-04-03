import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { cn } from '../../utils/cn';
import { VISA_SYSTEMS } from '../../constants/visaSystems';

// Types
interface CommonFeesVND {
  hoc_tieng: number;
  phi_tu_van: number;
  phi_trung_tam: number;
  ve_may_bay: { amount: number; optional: boolean };
  ktx_vn: { amount_per_month: number; optional: boolean };
}

interface Scholarship {
  topik_level: number;
  discount_pct: number;
}

interface KTXOption {
  name: string;
  price_krw: number;
}

interface SoTietKiemOption {
  label: string;
  amount_krw: number;
}

interface VisaSystem {
  available: boolean;
  invoice_krw: number;
  apply_fee_krw: number;
  enrollment_fee_krw: number;
  scholarships: Scholarship[];
  ktx_options: KTXOption[];
  so_tiet_kiem_options: SoTietKiemOption[];
  // Admission requirements
  gpa_min?: number;
  gap_year_limit?: number;
}

interface VisaSystems {
  [visaType: string]: VisaSystem;
}

interface CostFormData {
  common_fees_vnd: CommonFeesVND;
  visa_systems: VisaSystems;
}

// Visa system definitions imported from shared constant above

const VISA_DEFAULTS: Record<string, Partial<VisaSystem>> = {
  'D4-1': {
    invoice_krw: 5800000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 0,
    gpa_min: 7.0,
    gap_year_limit: 2,
    scholarships: [
      { topik_level: 3, discount_pct: 30 },
      { topik_level: 4, discount_pct: 50 },
      { topik_level: 5, discount_pct: 70 },
      { topik_level: 6, discount_pct: 100 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Khu vực Gyeonggi', amount_krw: 10000000 },
      { label: 'Ngoài Gyeonggi', amount_krw: 8000000 }
    ]
  },
  'D4-2': {
    invoice_krw: 4500000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 3, discount_pct: 25 },
      { topik_level: 4, discount_pct: 45 },
      { topik_level: 5, discount_pct: 65 },
      { topik_level: 6, discount_pct: 85 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Khu vực Gyeonggi', amount_krw: 10000000 },
      { label: 'Ngoài Gyeonggi', amount_krw: 8000000 }
    ]
  },
  'D2-1': {
    invoice_krw: 6000000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 3, discount_pct: 30 },
      { topik_level: 4, discount_pct: 50 },
      { topik_level: 5, discount_pct: 70 },
      { topik_level: 6, discount_pct: 100 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 20000000 }
    ]
  },
  'D2-2': {
    invoice_krw: 9490000,
    apply_fee_krw: 150000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 3, discount_pct: 30 },
      { topik_level: 4, discount_pct: 50 },
      { topik_level: 5, discount_pct: 70 },
      { topik_level: 6, discount_pct: 100 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 20000000 }
    ]
  },
  'D2-3': {
    invoice_krw: 8076000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 900000,
    scholarships: [
      { topik_level: 5, discount_pct: 30 },
      { topik_level: 6, discount_pct: 50 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 20000000 }
    ]
  },
  'D2-3M': {
    invoice_krw: 8076000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 900000,
    scholarships: [
      { topik_level: 5, discount_pct: 30 },
      { topik_level: 6, discount_pct: 50 }
    ],
    ktx_options: [
      { name: 'Phong 4 nguoi', price_krw: 747000 },
      { name: 'Phong 2 nguoi', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tat ca khu vuc', amount_krw: 20000000 }
    ]
  },
  'D2-3P': {
    invoice_krw: 9000000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 5, discount_pct: 25 },
      { topik_level: 6, discount_pct: 45 }
    ],
    ktx_options: [
      { name: 'Phong 4 nguoi', price_krw: 747000 },
      { name: 'Phong 2 nguoi', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tat ca khu vuc', amount_krw: 20000000 }
    ]
  },
  'D2-4': {
    invoice_krw: 7000000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 500000,
    scholarships: [
      { topik_level: 5, discount_pct: 25 },
      { topik_level: 6, discount_pct: 45 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 20000000 }
    ]
  },
  'D2-5': {
    invoice_krw: 6500000,
    apply_fee_krw: 100000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 4, discount_pct: 20 },
      { topik_level: 5, discount_pct: 40 },
      { topik_level: 6, discount_pct: 60 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 20000000 }
    ]
  },
  'D2-6': {
    invoice_krw: 5000000,
    apply_fee_krw: 80000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 3, discount_pct: 20 },
      { topik_level: 4, discount_pct: 35 },
      { topik_level: 5, discount_pct: 50 },
      { topik_level: 6, discount_pct: 65 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 10000000 }
    ]
  },
  'D2-6E': {
    invoice_krw: 0,
    apply_fee_krw: 0,
    enrollment_fee_krw: 0,
    scholarships: [],
    ktx_options: [],
    so_tiet_kiem_options: []
  },
  'D2-8': {
    invoice_krw: 0,
    apply_fee_krw: 0,
    enrollment_fee_krw: 0,
    scholarships: [],
    ktx_options: [],
    so_tiet_kiem_options: []
  },
  'D2-7': {
    invoice_krw: 3000000,
    apply_fee_krw: 50000,
    enrollment_fee_krw: 0,
    scholarships: [
      { topik_level: 2, discount_pct: 10 },
      { topik_level: 3, discount_pct: 20 },
      { topik_level: 4, discount_pct: 30 }
    ],
    ktx_options: [
      { name: 'Phòng 4 người', price_krw: 747000 },
      { name: 'Phòng 2 người', price_krw: 1102000 }
    ],
    so_tiet_kiem_options: [
      { label: 'Tất cả khu vực', amount_krw: 5000000 }
    ]
  }
};

interface CostInputFormProps {
  universityId?: string;
  universityName?: string;
  initialData?: Partial<CostFormData>;
  onSave: (data: CostFormData) => void;
  onCancel: () => void;
}

export default function CostInputForm({ 
  universityId, 
  universityName, 
  initialData, 
  onSave, 
  onCancel 
}: CostInputFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // TC-B001 FIXED: Add useEffect to reload data when initialData changes
  // This fixes the issue where visa panels appear empty when reopening the form
  const [formData, setFormData] = useState<CostFormData>(() => createInitialFormData(initialData));
  
  useEffect(() => {
    // Reload form data when initialData changes (e.g., when reopening modal with different university)
    setFormData(createInitialFormData(initialData));
    setCurrentStep(1); // Reset to first step when data changes
  }, [initialData]);
  
  function createInitialFormData(data: Partial<CostFormData> | undefined): CostFormData {
    const visaSystems: VisaSystems = {};
    VISA_SYSTEMS.forEach(visa => {
      const defaults = VISA_DEFAULTS[visa.key];
      visaSystems[visa.key] = {
        available: false,
        invoice_krw: defaults?.invoice_krw || 0,
        apply_fee_krw: defaults?.apply_fee_krw ?? visa.default_apply_fee ?? 0,
        enrollment_fee_krw: defaults?.enrollment_fee_krw ?? visa.default_enrollment_fee ?? 0,
        scholarships: defaults?.scholarships || [],
        ktx_options: defaults?.ktx_options || [],
        so_tiet_kiem_options: defaults?.so_tiet_kiem_options || [],
      };
    });

    return {
      common_fees_vnd: {
        hoc_tieng: 13000000,
        phi_tu_van: 39000000,
        phi_trung_tam: 11000000,
        ve_may_bay: { amount: 8000000, optional: true },
        ktx_vn: { amount_per_month: 800000, optional: true },
        ...data?.common_fees_vnd,
      },
      visa_systems: {
        ...visaSystems,
        ...data?.visa_systems,
      },
    };
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  const parseNumber = (str: string) => {
    return parseInt(str.replace(/[^\d]/g, '')) || 0;
  };

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addScholarship = (visaType: string) => {
    const currentScholarships = formData.visa_systems[visaType]?.scholarships || [];
    const usedLevels = currentScholarships.map(s => s.topik_level);
    const availableLevels = [1, 2, 3, 4, 5, 6].filter(level => !usedLevels.includes(level));
    
    if (availableLevels.length > 0) {
      const nextLevel = Math.max(...availableLevels);
      updateFormData(`visa_systems.${visaType}.scholarships`, [
        ...currentScholarships,
        { topik_level: nextLevel, discount_pct: 0 }
      ]);
    }
  };

  const removeScholarship = (visaType: string, index: number) => {
    const scholarships = [...formData.visa_systems[visaType].scholarships];
    scholarships.splice(index, 1);
    updateFormData(`visa_systems.${visaType}.scholarships`, scholarships);
  };

  const addKTXOption = (visaType: string) => {
    const currentOptions = formData.visa_systems[visaType]?.ktx_options || [];
    updateFormData(`visa_systems.${visaType}.ktx_options`, [
      ...currentOptions,
      { name: '', price_krw: 0 }
    ]);
  };

  const removeKTXOption = (visaType: string, index: number) => {
    const options = [...formData.visa_systems[visaType].ktx_options];
    options.splice(index, 1);
    updateFormData(`visa_systems.${visaType}.ktx_options`, options);
  };

  const addSavingsOption = (visaType: string) => {
    const currentOptions = formData.visa_systems[visaType]?.so_tiet_kiem_options || [];
    updateFormData(`visa_systems.${visaType}.so_tiet_kiem_options`, [
      ...currentOptions,
      { label: '', amount_krw: 0 }
    ]);
  };

  const removeSavingsOption = (visaType: string, index: number) => {
    const options = [...formData.visa_systems[visaType].so_tiet_kiem_options];
    options.splice(index, 1);
    updateFormData(`visa_systems.${visaType}.so_tiet_kiem_options`, options);
  };

  const toggleVisaSystem = (visaType: string) => {
    const current = formData.visa_systems[visaType];
    updateFormData(`visa_systems.${visaType}.available`, !current.available);
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return formData.common_fees_vnd.hoc_tieng > 0 && 
             formData.common_fees_vnd.phi_tu_van > 0 && 
             formData.common_fees_vnd.phi_trung_tam > 0;
    }
    if (step === 2) {
      const hasAvailable = Object.values(formData.visa_systems).some(vs => vs.available);
      if (!hasAvailable) return false;
      
      for (const [visaType, system] of Object.entries(formData.visa_systems)) {
        if (system.available && system.invoice_krw <= 0) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSave = () => {
    onSave(formData);
  };

  const renderProgressBar = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step <= currentStep
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {step}
          </div>
        ))}
        <div className="flex-1 h-1 bg-gray-200 rounded-full mx-2">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          />
        </div>
      </div>
      <div className="text-sm text-gray-600">
        Bước {currentStep}/3
      </div>
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          Phí chung tại Việt Nam (VNĐ)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Các khoản phí cố định - chỉ thay đổi số tiền, cấu trúc giữ nguyên
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Phí cố định (bắt buộc)</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="font-medium">Học tiếng Hàn</Label>
                <p className="text-xs text-gray-500">Học từ 0 lên TOPIK 2 + Tài khoản E-Learning</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formatNumber(formData.common_fees_vnd.hoc_tieng)}
                  onChange={(e) => updateFormData('common_fees_vnd.hoc_tieng', parseNumber(e.target.value))}
                  className="w-32 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">VNĐ</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="font-medium">Phí tư vấn & xử lý hồ sơ</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formatNumber(formData.common_fees_vnd.phi_tu_van)}
                  onChange={(e) => updateFormData('common_fees_vnd.phi_tu_van', parseNumber(e.target.value))}
                  className="w-32 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">VNĐ</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <Label className="font-medium">Phí trung tâm thu hộ</Label>
                <details className="text-xs text-gray-500 cursor-pointer">
                  <summary>Danh sách dịch vụ</summary>
                  <div className="mt-1 pl-4 space-y-1">
                    <div>⬢ Công chứng</div>
                    <div>⬢ Tem vàng</div>
                    <div>⬢ Tem tím</div>
                    <div>⬢ Xin visa</div>
                    <div>⬢ Khám sức khỏe</div>
                    <div>⬢ Ship hồ sơ (VN)</div>
                    <div>⬢ Ship hồ sơ (HQ)</div>
                    <div>⬢ Đưa đón HQ</div>
                    <div>⬢ Tìm KTX</div>
                  </div>
                </details>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formatNumber(formData.common_fees_vnd.phi_trung_tam)}
                  onChange={(e) => updateFormData('common_fees_vnd.phi_trung_tam', parseNumber(e.target.value))}
                  className="w-32 text-right"
                  placeholder="0"
                />
                <span className="text-sm text-gray-500">VNĐ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Phí tùy chọn</h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={formData.common_fees_vnd.ve_may_bay.optional}
                  onCheckedChange={(checked) => updateFormData('common_fees_vnd.ve_may_bay.optional', checked)}
                />
                <div>
                  <Label className="font-medium">Vé máy bay 1 chiều</Label>
                  <p className="text-xs text-gray-500">Bao gồm 40kg ký gửi</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formatNumber(formData.common_fees_vnd.ve_may_bay.amount)}
                  onChange={(e) => updateFormData('common_fees_vnd.ve_may_bay.amount', parseNumber(e.target.value))}
                  className="w-32 text-right"
                  placeholder="0"
                  disabled={!formData.common_fees_vnd.ve_may_bay.optional}
                />
                <span className="text-sm text-gray-500">VNĐ</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Switch
                  checked={formData.common_fees_vnd.ktx_vn.optional}
                  onCheckedChange={(checked) => updateFormData('common_fees_vnd.ktx_vn.optional', checked)}
                />
                <div>
                  <Label className="font-medium">KTX tại Việt Nam</Label>
                  <p className="text-xs text-gray-500">Nhập số tháng ở chế độ máy tính</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={formatNumber(formData.common_fees_vnd.ktx_vn.amount_per_month)}
                  onChange={(e) => updateFormData('common_fees_vnd.ktx_vn.amount_per_month', parseNumber(e.target.value))}
                  className="w-32 text-right"
                  placeholder="0"
                  disabled={!formData.common_fees_vnd.ktx_vn.optional}
                />
                <span className="text-sm text-gray-500">VNĐ/tháng</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          Phí theo từng hệ (KRW)
        </CardTitle>
        <p className="text-sm text-gray-600">
          Cấu hình chi phí cho từng hệ visa Hàn Quốc
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {VISA_SYSTEMS.map((visa) => (
            <button
              key={visa.key}
              onClick={() => toggleVisaSystem(visa.key)}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                formData.visa_systems[visa.key].available
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              )}
            >
              {visa.label}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {VISA_SYSTEMS.map((visa) => {
            const system = formData.visa_systems[visa.key];
            
            if (!system.available) {
              return (
                <Card key={visa.key} className="opacity-50">
                  <CardContent className="p-6">
                    <div className="text-center text-gray-500">
                      <div className="font-medium">{visa.label}</div>
                      <div className="text-sm mt-1">Bật toggle để nhập chi phí cho hệ này</div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={visa.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{visa.name}</CardTitle>
                  <p className="text-sm text-gray-600">{visa.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Học phí cơ bản</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Invoice học phí / nĒm</Label>
                        <Input
                          type="text"
                          value={formatNumber(system.invoice_krw)}
                          onChange={(e) => updateFormData(`visa_systems.${visa.key}.invoice_krw`, parseNumber(e.target.value))}
                          className="text-right"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500">KRW</span>
                      </div>
                      <div>
                        <Label className="text-sm">Phí apply</Label>
                        <Input
                          type="text"
                          value={formatNumber(system.apply_fee_krw)}
                          onChange={(e) => updateFormData(`visa_systems.${visa.key}.apply_fee_krw`, parseNumber(e.target.value))}
                          className="text-right"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500">KRW</span>
                      </div>
                      <div>
                        <Label className="text-sm">Phí nhập học</Label>
                        <Input
                          type="text"
                          value={formatNumber(system.enrollment_fee_krw)}
                          onChange={(e) => updateFormData(`visa_systems.${visa.key}.enrollment_fee_krw`, parseNumber(e.target.value))}
                          className="text-right"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500">KRW</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Điều kiện tuyển sinh</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">GPA tối thiểu</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={system.gpa_min ?? 7.0}
                          onChange={(e) => updateFormData(`visa_systems.${visa.key}.gpa_min`, parseFloat(e.target.value) || 7.0)}
                          className="text-right"
                          placeholder="7.0"
                        />
                        <span className="text-xs text-gray-500">Điểm</span>
                      </div>
                      <div>
                        <Label className="text-sm">Năm trống tối đa</Label>
                        <Input
                          type="number"
                          value={system.gap_year_limit ?? 2}
                          onChange={(e) => updateFormData(`visa_systems.${visa.key}.gap_year_limit`, parseInt(e.target.value) || 2)}
                          className="text-right"
                          placeholder="2"
                        />
                        <span className="text-xs text-gray-500">năm</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Chính sách học bổng theo TOPIK</h4>
                      <Button type="button" size="sm" onClick={() => addScholarship(visa.key)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm mức học bổng
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {system.scholarships.map((scholarship, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <select
                            value={scholarship.topik_level}
                            onChange={(e) => {
                              const scholarships = [...system.scholarships];
                              scholarships[index].topik_level = parseInt(e.target.value);
                              updateFormData(`visa_systems.${visa.key}.scholarships`, scholarships);
                            }}
                            className="w-24 px-2 py-1 border rounded text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6].map(level => (
                              <option key={level} value={level}>TOPIK {level}</option>
                            ))}
                          </select>
                          <Input
                            type="number"
                            value={scholarship.discount_pct}
                            onChange={(e) => {
                              const scholarships = [...system.scholarships];
                              // TC-B006: Clamp discount between 0-100
                              const rawValue = parseInt(e.target.value) || 0;
                              scholarships[index].discount_pct = Math.min(100, Math.max(0, rawValue));
                              updateFormData(`visa_systems.${visa.key}.scholarships`, scholarships);
                            }}
                            className="w-20 text-right"
                            placeholder="0"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-gray-500">%</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeScholarship(visa.key, index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Ký túc xá tại Hàn (KRW / kỳ)</h4>
                      <Button type="button" size="sm" onClick={() => addKTXOption(visa.key)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm loại phòng
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {system.ktx_options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Input
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              const options = [...system.ktx_options];
                              options[index].name = e.target.value;
                              updateFormData(`visa_systems.${visa.key}.ktx_options`, options);
                            }}
                            className="flex-1"
                            placeholder="Tên phòng"
                          />
                          <Input
                            type="text"
                            value={formatNumber(option.price_krw)}
                            onChange={(e) => {
                              const options = [...system.ktx_options];
                              options[index].price_krw = parseNumber(e.target.value);
                              updateFormData(`visa_systems.${visa.key}.ktx_options`, options);
                            }}
                            className="w-32 text-right"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">KRW</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeKTXOption(visa.key, index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Sổ tiết kiệm (KRW)</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Info className="w-3 h-3" />
                        Số tiền sổ tiết kiệm phụ thuộc vào khu vực địa lý của trường
                      </div>
                      <Button type="button" size="sm" onClick={() => addSavingsOption(visa.key)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Thêm mức sổ
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {system.so_tiet_kiem_options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Input
                            type="text"
                            value={option.label}
                            onChange={(e) => {
                              const options = [...system.so_tiet_kiem_options];
                              options[index].label = e.target.value;
                              updateFormData(`visa_systems.${visa.key}.so_tiet_kiem_options`, options);
                            }}
                            className="flex-1"
                            placeholder="Mô tả"
                          />
                          <Input
                            type="text"
                            value={formatNumber(option.amount_krw)}
                            onChange={(e) => {
                              const options = [...system.so_tiet_kiem_options];
                              options[index].amount_krw = parseNumber(e.target.value);
                              updateFormData(`visa_systems.${visa.key}.so_tiet_kiem_options`, options);
                            }}
                            className="w-32 text-right"
                            placeholder="0"
                          />
                          <span className="text-sm text-gray-500">KRW</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSavingsOption(visa.key, index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => {
    const availableSystems = VISA_SYSTEMS.filter(v => formData.visa_systems[v.key].available);
    const unavailableSystems = VISA_SYSTEMS.filter(v => !formData.visa_systems[v.key].available);
    
    const validationStatus = validateStep(3);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationStatus ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            Xem lại & Lưu
          </CardTitle>
          <p className="text-sm text-gray-600">
            Kiểm tra lại thông tin trước khi lưu
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Phí chung tại Việt Nam</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Học tiếng Hàn</span>
                <span className="font-medium">{formatNumber(formData.common_fees_vnd.hoc_tieng)} VNĐ</span>
                <Badge variant="secondary">Cố định</Badge>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Phí tư vấn & xử lý hồ sơ</span>
                <span className="font-medium">{formatNumber(formData.common_fees_vnd.phi_tu_van)} VNĐ</span>
                <Badge variant="secondary">Cố định</Badge>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Phí trung tâm thu hộ</span>
                <span className="font-medium">{formatNumber(formData.common_fees_vnd.phi_trung_tam)} VNĐ</span>
                <Badge variant="secondary">Cố định</Badge>
              </div>
              {formData.common_fees_vnd.ve_may_bay.optional && (
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span>Vé máy bay 1 chiều</span>
                  <span className="font-medium">{formatNumber(formData.common_fees_vnd.ve_may_bay.amount)} VNĐ</span>
                  <Badge variant="outline">Tuỳ chọn</Badge>
                </div>
              )}
              {formData.common_fees_vnd.ktx_vn.optional && (
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span>KTX tại Việt Nam</span>
                  <span className="font-medium">{formatNumber(formData.common_fees_vnd.ktx_vn.amount_per_month)} VNĐ/tháng</span>
                  <Badge variant="outline">Tuỳ chọn</Badge>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">H? visa</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {availableSystems.map(visa => (
                <Badge key={visa.key} className="bg-green-100 text-green-800">
                  {visa.label}
                </Badge>
              ))}
            </div>
            {unavailableSystems.length > 0 && (
              <div className="text-sm text-gray-600">
                Không có: {unavailableSystems.map(v => v.label).join(', ')}
              </div>
            )}
            <div className="text-sm font-medium text-gray-700 mt-2">
              {availableSystems.length}/9 hệ được cấu hình
            </div>
          </div>

          {availableSystems.map(visa => {
            const system = formData.visa_systems[visa.key];
            return (
              <div key={visa.key} className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">{visa.label}</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Invoice:</span>
                    <div className="font-medium">{formatNumber(system.invoice_krw)} KRW</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Apply:</span>
                    <div className="font-medium">{formatNumber(system.apply_fee_krw)} KRW</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Enroll:</span>
                    <div className="font-medium">{formatNumber(system.enrollment_fee_krw)} KRW</div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {system.scholarships.length} mức học bổng ⬢ {system.ktx_options.length} loại phòng ⬢ {system.so_tiet_kiem_options.length} mức sổ
                </div>
              </div>
            );
          })}

          {!validationStatus && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Vui lòng điền đầy đủ thông tin các trường bắt buộc
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Cấu hình chi phí du học: {universityName || 'Trường mới'}
        </h1>
        <p className="text-gray-600">
          Thiết lập chi phí theo cấu trúc mới cho: {universityName || 'Trường mới'}
        </p>
      </div>

      {renderProgressBar()}

      <div className="space-y-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      <div className="flex justify-between items-center mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
              Tiếp tục
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!validateStep(3)}>
              Lưu thông tin
              <CheckCircle className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}



