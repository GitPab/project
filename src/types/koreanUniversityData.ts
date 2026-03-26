import { VisaSystemCost } from './university';

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
  workOpportunity?: string;
  // Missing fields from Detail.txt spec
  supportPolicies?: string[]; // Chính sách hỗ trợ
  refundPolicy?: string; // Chính sách hoàn tiền
  admissionsType?: string; // Hình thức xét tuyển
  partTimeInfo?: string; // Việc làm thêm
}
