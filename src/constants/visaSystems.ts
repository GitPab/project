export type VisaSystemConfig = {
  key: string;
  label: string;
  name: string;
  description: string;
  default_apply_fee: number;
  default_enrollment_fee: number;
  popular?: boolean;
  best_scholarship?: boolean;
  invoice_unit?: 'per_ky' | 'flat' | 'per_year';
};

export const VISA_SYSTEMS: VisaSystemConfig[] = [
  {
    key: 'D4-1',
    label: 'D4-1',
    name: 'Hệ tiếng',
    description: 'Học tiếng Hàn tại trường',
    default_apply_fee: 100000,
    default_enrollment_fee: 0,
    popular: true
  },
  {
    key: 'D2-1',
    label: 'D2-1',
    name: 'Dự bị',
    description: 'Dự bị đại học tổng quát',
    default_apply_fee: 0,
    default_enrollment_fee: 0
  },
  {
    key: 'D2-2',
    label: 'D2-2',
    name: 'Đại học',
    description: 'Hệ đại học chính quy',
    default_apply_fee: 150000,
    default_enrollment_fee: 0,
    best_scholarship: true
  },
  {
    key: 'D2-3M',
    label: 'D2-3',
    name: 'Thạc sĩ',
    description: "Sau đại học – Master's degree",
    default_apply_fee: 100000,
    default_enrollment_fee: 900000
  },
  {
    key: 'D2-3P',
    label: 'D2-3',
    name: 'Tiến sĩ',
    description: 'Sau đại học – Doctoral degree',
    default_apply_fee: 100000,
    default_enrollment_fee: 0
  },
  {
    key: 'D2-6',
    label: 'D2-6',
    name: 'Nghiên cứu sinh',
    description: 'Research student – không lấy bằng',
    default_apply_fee: 0,
    default_enrollment_fee: 0
  },
  {
    key: 'D2-6E',
    label: 'Trao đổi',
    name: 'Trao đổi',
    description: 'Sinh viên trao đổi quốc tế (1–2 kỳ)',
    invoice_unit: 'per_ky',
    default_apply_fee: 0,
    default_enrollment_fee: 0
  },
  {
    key: 'D2-8',
    label: 'Ngắn hạn',
    name: 'Ngắn hạn',
    description: 'Chương trình dưới 6 tháng',
    invoice_unit: 'flat',
    default_apply_fee: 0,
    default_enrollment_fee: 0
  }
];

export const defaultVisaSystemEntry = (key: string) => ({
  available: false,
  invoice_krw: 0,
  apply_fee_krw: VISA_SYSTEMS.find(v => v.key === key)?.default_apply_fee ?? 0,
  enrollment_fee_krw: VISA_SYSTEMS.find(v => v.key === key)?.default_enrollment_fee ?? 0,
  scholarships: [],
  ktx_options: [],
  so_tiet_kiem_options: []
});

export const initAllVisaSystems = () => {
  const result: Record<string, ReturnType<typeof defaultVisaSystemEntry>> = {};
  VISA_SYSTEMS.forEach(v => {
    result[v.key] = defaultVisaSystemEntry(v.key);
  });
  return result;
};
