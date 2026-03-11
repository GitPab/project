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
  visaType: 'D4-1' | 'D2-2' | 'D2-3'; // Korean visa types
  tuitionPerTerm?: number;
  tuitionRange?: { min: number; max: number };
  applicationFee?: number;
  enrollmentFee?: number;
  baseYearlyFee?: number;
  description?: string;
}

export interface OptionalAddon {
  id: string;
  name: string;
  nameKr?: string;
  nameVi?: string;
  type: 'dorm-vn' | 'dorm-kr' | 'savings' | 'flight' | 'scholarship' | 'other';
  amount?: number;
  amountRange?: { min: number; max: number };
  perMonth?: boolean; // For dorm fees
  percentage?: number; // For scholarships
  selectable: boolean;
  requiresInput?: boolean; // If user needs to select months/type/etc
  options?: Array<{ label: string; value: number }>;
  conditional?: string; // Conditions for eligibility
}

export interface KoreanUniversityData {
  isKoreanUniversity: boolean;
  address?: string;
  topVisa?: string;
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
}

export interface AcademicProgram {
  icon: string;
  title: string;
  description: string;
}

export interface University {
  id: string;
  name: string;
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
