/**
 * Central export for all TypeScript types
 */

// Common types
export type { Currency, Language, ProgressStatus } from './common';

// University types
export type {
  University,
  AdditionalFee,
  VisaSystemCost,
  OptionalAddon,
  KoreanUniversityData,
  AcademicProgram,
  Registration,
  ProgressStage,
  StudentProgress,
} from './university';

// User types
export type {
  User,
  PaymentHistory,
  StudentProfile,
  StudentOnboardingData,
} from './user';
