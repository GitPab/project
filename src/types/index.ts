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
  Document,
  Payment,
  Notification,
  StudentApplication,
  AuditLog,
  Appointment,
  Scholarship,
  ScholarshipApplication,
  VisaApplication,
  ScheduledReminder,
  AnalyticsMetric,
  Role,
  UserRole,
  CommunicationLog,
  UniversityRating,
  ServiceFeedback,
  CostCalculatorState,
  CalculatedCosts,
  // New types
  EmailTemplate,
  WorkflowRule,
  UserPreferences,
  User2FA,
  UserSession,
  BulkOperation,
  SavedFilter,
} from './university';

// User types
export type {
  User,
  PaymentHistory,
  StudentProfile,
  StudentOnboardingData,
} from './user';
