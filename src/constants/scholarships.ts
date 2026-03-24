/**
 * Scholarship and Fee Constants
 * Centralized definitions for TOPIK discounts and common fees
 */

export const TOPIK_DISCOUNT_LEVELS = [
  { level: 0, discount: 0 },
  { level: 1, discount: 0 },
  { level: 2, discount: 0 },
  { level: 3, discount: 30 },
  { level: 4, discount: 50 },
  { level: 5, discount: 70 },
  { level: 6, discount: 100 },
] as const;

export const EXCHANGE_RATES = {
  KRW_TO_VND: 20,
  USD_TO_VND: 25000,
} as const;

export const DEFAULT_COMMON_FEES = [
  { id: 'hoc_tieng', name: 'Học tiếng Hàn', amount: 13000000, note: 'Học từ 0 lên TOPIK 2 + Tài khoản E-Learning', editable: true },
  { id: 'phi_tu_van', name: 'Phí tư vấn & xử lý hồ sơ', amount: 39000000, note: '', editable: true },
  { id: 'phi_trung_tam', name: 'Phí trung tâm thu hộ', amount: 11000000, subItems: ['Phí công chứng', 'Tem vàng', 'Tem tím', 'Xin visa', 'Khám sức khoẻ', 'Ship hồ sơ (VN)', 'Ship hồ sơ (HQ)', 'Đưa đón HQ', 'Tìm KTX'], editable: true },
  { id: 've_may_bay', name: 'Vé máy bay 1 chiều', amount: 8000000, note: 'Bao gồm 40kg ký gửi', optional: true, editable: true },
  { id: 'ktx_vn', name: 'KTX tại Việt Nam', amount: 0, amountPerMonth: 800000, note: 'Học viên chọn số tháng', optional: true, editable: true },
] as const;

export const KTX_VN_MONTHS_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export const TOPIK_LEVELS = [1, 2, 3, 4, 5, 6] as const;

export const DEFAULT_KTX_OPTIONS = [
  { name: 'Phòng 4 người', priceKRWPerKy: 747000 },
  { name: 'Phòng 2 người', priceKRWPerKy: 1102000 },
  { name: 'Phòng 2 người (Quốc tế)', priceKRWPerKy: 1440000 },
] as const;

export const DEFAULT_FINANCIAL_REQUIREMENT = {
  soTietKiemOptions: [
    { label: 'Khu vực Gyeonggi', amountKRW: 10000000 },
    { label: 'Ngoài Gyeonggi', amountKRW: 8000000 },
  ],
  luiNThang: 6,
} as const;

export const SCHOLARSHIP_DISCOUNT_RANGES = {
  FULL: 100,
  HIGH: 70,
  MEDIUM: 50,
  LOW: 30,
  NONE: 0,
} as const;

export const RANKING_THRESHOLDS = {
  TOP_1_MAX: 30,
  TOP_2_MAX: 80,
  TOP_3_MIN: 81,
} as const;

export const SCHOLARSHIP_THRESHOLDS = {
  FULL_SCHOLARSHIP: 100,
  HIGH_SCHOLARSHIP: 50,
  GPA_THRESHOLD: 6.5,
} as const;
