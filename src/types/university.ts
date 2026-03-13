/**
 * University and cost-related types
 */

import { Currency, ProgressStatus } from './common';

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

  // 2-level hierarchy support
  groupName?: string; // Level 1: Group label (e.g., "Ký túc xá", "Vé máy bay", "Học bổng")
  subItems?: Array<{
    label: string; // e.g., "Phòng 4-người 747k", "TOPIK 5 → 70%", "5M VND"
    value: number; // The actual cost or percentage
    visaTypes?: string[]; // Applicable to specific visa types
  }>;
}

export interface KoreanUniversityData {
  isKoreanUniversity: boolean;
  address?: string;
  topVisa?: string;
  topTier?: 'Top1' | 'Top2' | 'Top3';
  koreanRanking?: string; // e.g., "15/200 trường đại học tại Hàn Quốc"
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
  region?: string;
  topTier?: 'Top1' | 'Top2' | 'Top3';
  country: string;
  countryCode: string;
  tagline: string;
  thumbnail: string;
  heroImage: string;
  overview: string;
  academicPrograms: AcademicProgram[];
  galleryImages: string[];
  ranking: string;
  worldRanking: number;

  // Traditional cost structure (for non-Korean universities)
  generalTuition: number;
  visaFee: number;
  accommodationFee: number;
  insuranceFee: number;
  additionalFees: AdditionalFee[];

  // Korean university data (optional)
  koreanData?: KoreanUniversityData;

  // Fixed costs for Korean universities (always apply)
  fixedCosts?: Array<{
    type: string;
    amount: number;
    currency?: Currency;
    category?: string;
    description?: string;
  }>;

  // Optional add-ons for Korean universities
  optionalAddons?: OptionalAddon[];

  majors?: string[]; // For search filtering
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
