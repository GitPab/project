/**
 * University and cost-related types
 * REDESIGNED: New fee system with structured VND/KRW separation
 */

import { Currency, ProgressStatus } from './common';
import type { FlexibleFee } from './fees';

// ============================================
// NEW REDESIGNED FEE SYSTEM TYPES (Part 1)
// ============================================

/** Common fee item in VND - applies to all visa systems */
export interface CommonFeeVND {
  id: string;
  name: string;
  amount: number;
  amountPerMonth?: number; // For fees like KTX VN where months vary
  note?: string;
  editable: boolean;
  optional?: boolean;
  subItems?: string[]; // For displaying breakdown like "Phí trung tâm thu hộ"
}

/** Scholarship condition based on TOPIK level */
export interface ScholarshipCondition {
  condition: string; // e.g., "TOPIK 3"
  discountPct: number; // e.g., 30
  topikLevel?: number; // 3, 4, 5, 6
}

/** KTX room option in Korea */
export interface KTXOption {
  name: string;
  priceKRWPerKy: number; // per semester/ky
}

/** Financial requirement option (sổ tiết kiệm) */
export interface FinancialRequirementOption {
  label: string; // e.g., "Khu vực Gyeonggi"
  amountKRW: number;
}

/** Detailed visa system configuration */
export interface VisaSystemDetail {
  available: boolean;
  invoiceKRWPerYear: number; // Annual tuition invoice
  applyFeeKRW: number;
  enrollmentFeeKRW: number;
  scholarships: ScholarshipCondition[];
  ktxOptions: KTXOption[];
  financialRequirement: {
    soTietKiemOptions: FinancialRequirementOption[];
    luiNThang: number; // months to backdate
  };
}

/** Admission requirements per visa category */
export interface AdmissionRequirement {
  gpaMin: number;
  gapYearLimit: number | null;
  regions: string[];
}

// ============================================
// LEGACY/COMPATIBILITY TYPES
// ============================================

export interface UniversitySystem {
  id: string;
  code: string; // D4-1, D2-2, D2-3, etc.
  name: string;
  nameVi?: string;
  nameKo?: string;
  nameEn?: string;
  description?: string;
  available: boolean;
  fees: FlexibleFee[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdditionalFee {
  type: string;
  amount: number;
  selected?: boolean; // For optional fees
}

export interface VisaSystemCost {
  visaType: 'D4-1' | 'D2-1' | 'D2-2' | 'D2-3' | 'D2-6'; // Extended Korean visa types
  tuitionPerTerm?: number;
  tuitionRange?: { min: number; max: number };
  applicationFee?: number;
  enrollmentFee?: number;
  baseYearlyFee?: number;
  description?: string;
  visaName?: string; // e.g., "Korean Language Program", "University Prep"
  available?: boolean; // Whether this visa system is available at the university
}

export interface OptionalAddon {
  id: string;
  name: string;
  nameKr?: string;
  nameVi?: string;
  type: 'dorm-vn' | 'dorm-kr' | 'savings' | 'flight' | 'scholarship' | 'group' | 'other';
  amount?: number;
  amountRange?: { min: number; max: number };
  perMonth?: boolean; // For dorm fees
  percentage?: number; // For scholarships
  selectable: boolean;
  requiresInput?: boolean; // If user needs to select months/type/etc
  options?: Array<{ label: string; value: number }>; // For room types, savings options, etc.
  conditional?: string; // Conditions for eligibility
  dormRoomType?: string; // e.g., "4-person", "2-person", "international" for KTX Hàn
  monthsSelected?: number; // For tracking months picked by user
  visaType?: string[]; // For visa-specific addons - only show for certain visa types
  displayOrder?: number; // For consistent ordering of addons
  currency?: string; // Currency for the addon amount (e.g., 'VND', 'KRW', 'USD')

  // 2-level hierarchy support
  groupName?: string; // Level 1: Group label (e.g., "Ký túc xá", "Vé máy bay", "Học bổng")
  subItems?: Array<{
    label: string; // e.g., "Phòng 4-người 747k", "TOPIK 5 → 70%", "5M VND"
    value: number; // The actual cost or percentage
    visaTypes?: string[]; // Applicable to specific visa types
  }>;
}

/** REDESIGNED: Korean University Data with new fee structure */
export interface KoreanUniversityData {
  isKoreanUniversity: boolean;
  address?: string;
  topVisa?: string;
  topTier?: 'Top1' | 'Top2' | 'Top3';
  koreanRanking?: string; // e.g., "15/200 trường đại học tại Hàn Quốc"
  
  // NEW REDESIGNED FIELDS
  commonFeesVND?: CommonFeeVND[];
  visaSystemsDetail?: Record<string, VisaSystemDetail>; // D4-1, D2-2, D2-3, etc.
  admission?: Record<string, AdmissionRequirement>; // D4-1, D2, etc.
  supportPolicies?: string[];
  refundPolicy?: string;
  admissionsType?: string;
  
  // Legacy fields for backward compatibility
  visaSystems?: VisaSystemCost[];
  majors?: string[];
  majorCategories?: Array<{ category: string; subjects: string[] }>;
  scholarships?: Array<{ visaType: string; description: string }>;
  admissionRequirements?: Array<{ visaType: string; requirement: string }>;
  financialRequirements?: Array<{ visaType: string; requirement: string }>;
  dormOptions?: Array<{ type: string; priceKRW: number }>;
  languageCourse?: { available: boolean; priceVND?: number };
  studentSupport?: string[];
  jobOpportunities?: string;
  workOpportunity?: string;
};

export interface TopikScholarship {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  discountPercentage: number;
  visaType?: string; // Optional: scholarship may apply to specific visa types
  description?: string;
}

export interface AcademicProgram {
  icon: string;
  title: string;
  description: string;
}

export interface University {
  id: string;
  name: string;
  koreanName?: string;
  country: string;
  countryCode?: string; // Emoji flag like 🇰🇷
  region?: string;
  ranking?: string;
  description?: string;
  tagline?: string; // Short tagline for hero section
  heroImage?: string; // URL to hero image
  thumbnail?: string; // URL to thumbnail image
  overview?: string; // Detailed overview text
  academicPrograms?: AcademicProgram[]; // List of academic programs
  galleryImages?: string[]; // Array of gallery image URLs
  
  // New systems-based structure
  systems: UniversitySystem[];
  
  // Legacy fields for backward compatibility
  generalTuition?: number;
  visaFee?: number;
  accommodationFee?: number;
  insuranceFee?: number;
  additionalFees?: AdditionalFee[];
  koreanData?: KoreanUniversityData;
  fixedCosts?: Array<{
    type: string;
    amount: number;
    currency?: Currency;
    category?: string;
    description?: string;
  }>;
  optionalAddons?: OptionalAddon[];
  majors?: string[];
}

export interface Registration {
  universityId: string;
  registeredAt: string;
  studentEmail: string;
  selectedFees?: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  };
}

export interface ProgressStage {
  id: number;
  status: ProgressStatus;
  startDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface StudentProgress {
  studentEmail: string;
  universityId: string;
  stages: ProgressStage[];
  overallProgress: number;
}

// ============================================
// COST CALCULATOR TYPES
// ============================================

/** Calculator state for student-facing cost calculation */
export interface CostCalculatorState {
  selectedVisaSystem: string; // D4-1, D2-2, D2-3
  topikLevel: number; // 0-6
  selectedKTXOption: number; // index of ktxOptions array
  selectedSoTietKiemOption: number; // index of soTietKiemOptions array
  ktxVNMonths: number; // 0-6, 0 = not staying
  includeFlight: boolean;
}

/** Calculated cost breakdown result */
export interface CalculatedCosts {
  // VND fees
  hocTieng: number;
  phiTuVan: number;
  phiTrungTam: number;
  ktxVN: number;
  veMayBay: number;
  totalVND: number;
  
  // KRW fees
  applyFee: number;
  enrollmentFee: number;
  invoice: number;
  hocBong: number; // negative value (discount)
  ktxHQ: number;
  soTietKiem: number;
  totalKRW: number;
  
  // Summary
  approximateUSD: number;
  scholarshipApplied: boolean;
  scholarshipDescription?: string;
}
