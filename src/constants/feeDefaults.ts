/**
 * Default fee amounts and financial constants
 * Centralized to avoid hardcoded values across the application
 */

// Default fee amounts in VND
export const DEFAULT_FEES_VND = {
  hocTieng: 13000000,        // Học tiếng Hàn (0→TOPIK 2)
  phiTuVan: 39000000,        // Phí tư vấn & xử lý hồ sơ
  phiTrungTam: 11000000,     // Phí trung tâm thu hộ
  veMayBay: 8000000,         // Vé máy bay 1 chiều
  ktxVNPerMonth: 800000,    // KTX tại Việt Nam (per month)
} as const;

// Default so tiet kiem amounts in KRW
export const DEFAULT_SO_TIET_KIEM_KRW = {
  gyeonggi: 10000000,       // Khu vực Gyeonggi
  ngoaiGyeonggi: 8000000,   // Ngoài Gyeonggi
} as const;

// Default labels for so tiet kiem
export const SO_TIET_KIEM_LABELS = {
  gyeonggi: 'Khu vực Gyeonggi',
  ngoaiGyeonggi: 'Ngoài Gyeonggi',
} as const;

// Exchange rates (for USD estimation display)
export const EXCHANGE_RATES = {
  vndToUsd: 25500,  // 1 USD = 25,500 VND
  krwToUsd: 1350,   // 1 USD = 1,350 KRW
} as const;

// Default admission requirements
export const DEFAULT_ADMISSION = {
  gpaMin: 7.0,           // GPA tối thiểu
  gapYearLimit: 2,       // Năm trống tối đa
} as const;

// Default financial requirement
export const DEFAULT_FINANCIAL = {
  luiNThang: 6,          // Số tháng lùi sổ tiết kiệm
} as const;

// Visa system fallback
export const VISA_FALLBACKS = {
  defaultName: 'D4-1',
  empty: '',
} as const;

// Default so tiet kiem options array
export const DEFAULT_SO_TIET_KIEM_OPTIONS = [
  { label: SO_TIET_KIEM_LABELS.gyeonggi, amountKRW: DEFAULT_SO_TIET_KIEM_KRW.gyeonggi },
  { label: SO_TIET_KIEM_LABELS.ngoaiGyeonggi, amountKRW: DEFAULT_SO_TIET_KIEM_KRW.ngoaiGyeonggi },
] as const;

// Price calculation factors
export const PRICE_CALCULATION = {
  minFactor: 0.8,   // Min price factor for range display
  maxFactor: 1.2,   // Max price factor for range display
  million: 1000000, // 1 million KRW
  thousand: 1000,   // 1 thousand KRW
} as const;
