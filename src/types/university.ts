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
  visaType: 'D4-1' | 'D2-1' | 'D2-2' | 'D2-3' | 'D2-3M' | 'D2-3P' | 'D2-6' | 'D2-6E' | 'D2-8'; // Extended Korean visa types
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
  
  // Image fields
  logo?: string; // Main logo URL
  listLogo?: string; // Logo for list view
  
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
  dormitoryInfo?: string; // Detailed dormitory/KTX information
  notes?: string; // General notes about the university
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
  top_tier?: 'Top1' | 'Top2' | 'Top3';
  ranking?: string;
  description?: string;
  tagline?: string; // Short tagline for hero section
  heroImage?: string; // URL to hero image
  thumbnail?: string; // URL to thumbnail image
  overview?: string; // Detailed overview text
  academicPrograms?: AcademicProgram[]; // List of academic programs
  galleryImages?: string[]; // Array of gallery image URLs
  is_active?: boolean; // Soft delete flag
  
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
// DOCUMENT TYPES
// ============================================

export interface Document {
  id: string;
  studentEmail: string;
  universityId?: string;
  documentType: string;
  documentName: string;
  fileData: string;
  fileSize: number;
  mimeType: string;
  uploadType: 'student' | 'admin';
  uploadedBy?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface Payment {
  id: string;
  studentEmail: string;
  universityId?: string;
  paymentType: string;
  amountVnd?: number;
  amountKrw?: number;
  amountUsd?: number;
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  proofDocumentId?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  recipientEmail: string;
  recipientRole: 'student' | 'admin';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead: boolean;
  readAt?: string;
  createdBy?: string;
  createdAt: string;
}

// ============================================
// MULTI-UNIVERSITY APPLICATION TYPES
// ============================================

export interface StudentApplication {
  id: string;
  studentEmail: string;
  universityId: string;
  trackingCode?: string;
  applicationStatus: string;
  priority: number;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  universityName?: string;
  universityNameKorean?: string;
  studentName?: string;
  studentPhone?: string;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  studentEmail?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  performedBy: string;
  performedByEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
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
  showInvoiceWarning?: boolean; // TC-E004: Flag for unconfigured university
}

// ============================================
// CALENDAR & APPOINTMENTS TYPES
// ============================================

export interface Appointment {
  id: string;
  studentEmail: string;
  adminEmail?: string;
  title: string;
  description?: string;
  appointmentType: 'consultation' | 'interview' | 'review' | 'other';
  startTime: string;
  endTime?: string;
  location?: string;
  isOnline: boolean;
  meetingLink?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  reminderSent: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SCHOLARSHIP TYPES
// ============================================

export interface Scholarship {
  id: string;
  universityId?: string;
  name: string;
  nameKorean?: string;
  description?: string;
  amountVnd?: number;
  amountKrw?: number;
  eligibilityCriteria?: string;
  applicationDeadline?: string;
  requirements?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScholarshipApplication {
  id: string;
  scholarshipId: string;
  studentEmail: string;
  studentName?: string;
  universityId?: string;
  studentApplicationId?: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  documents?: string;
  amountAwardedVnd?: number;
  amountAwardedKrw?: number;
}

// ============================================
// VISA APPLICATION TYPES
// ============================================

export interface VisaApplication {
  id: string;
  studentEmail: string;
  studentName?: string;
  universityId?: string;
  studentApplicationId?: string;
  visaType: string;
  embassyLocation?: string;
  submissionDate?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: string;
  visaNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  documentsSubmitted?: string;
  interviewRequired: boolean;
  interviewDate?: string;
  interviewNotes?: string;
  rejectionReason?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SCHEDULED REMINDERS TYPES
// ============================================

export interface ScheduledReminder {
  id: string;
  recipientEmail: string;
  recipientRole: 'student' | 'admin';
  title: string;
  message: string;
  reminderType: 'payment' | 'document' | 'appointment' | 'deadline' | 'visa' | 'custom';
  relatedEntityType?: string;
  relatedEntityId?: string;
  scheduledDate: string;
  isRecurring: boolean;
  recurrencePattern?: string;
  isSent: boolean;
  sentAt?: string;
  createdBy?: string;
  createdAt: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsMetric {
  id: string;
  metricName: string;
  metricCategory?: string;
  metricValue?: number;
  metricData?: string;
  dimension1?: string;
  dimension2?: string;
  recordedAt: string;
}

// ============================================
// ROLE-BASED ACCESS CONTROL TYPES
// ============================================

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

export interface UserRole {
  id: string;
  userEmail: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: string;
}

// ============================================
// COMMUNICATION LOGS TYPES
// ============================================

export interface CommunicationLog {
  id: string;
  recipientEmail?: string;
  recipientPhone?: string;
  communicationType: 'email' | 'sms';
  subject?: string;
  content?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'opened';
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  errorMessage?: string;
  templateUsed?: string;
  createdAt: string;
}

// ============================================
// STUDENT FEEDBACK TYPES
// ============================================

export interface UniversityRating {
  id: string;
  universityId: string;
  studentEmail: string;
  studentApplicationId?: string;
  overallRating?: number;
  teachingQuality?: number;
  facilities?: number;
  supportServices?: number;
  valueForMoney?: number;
  reviewTitle?: string;
  reviewText?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface ServiceFeedback {
  id: string;
  studentEmail: string;
  feedbackType: 'general' | 'complaint' | 'suggestion' | 'praise';
  rating?: number;
  feedbackText?: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  createdAt: string;
}

// ============================================
// EMAIL TEMPLATE TYPES
// ============================================

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  templateType: string;
  variables: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// WORKFLOW AUTOMATION TYPES
// ============================================

export interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  triggerType: string;
  triggerCondition: string;
  actionType: string;
  actionConfig: Record<string, any>;
  isActive: boolean;
  priority: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USER PREFERENCES TYPES
// ============================================

export interface UserPreferences {
  id: string;
  userEmail: string;
  language: 'vi' | 'en' | 'ko';
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
  dateFormat: string;
  preferencesData: Record<string, any>;
  updatedAt: string;
}

// ============================================
// TWO-FACTOR AUTHENTICATION TYPES
// ============================================

export interface User2FA {
  id: string;
  userEmail: string;
  secret: string;
  backupCodes: string[];
  isEnabled: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// USER SESSION TYPES
// ============================================

export interface UserSession {
  id: string;
  userEmail: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  lastActivityAt: string;
}

// ============================================
// BULK OPERATION TYPES
// ============================================

export interface BulkOperation {
  id: string;
  operationType: 'import_students' | 'export_students' | 'update_status' | 'send_notifications' | 'delete_records';
  operationStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRecords?: number;
  processedRecords: number;
  successRecords: number;
  failedRecords: number;
  inputData?: string;
  resultData?: string;
  errorLog?: string;
  performedBy?: string;
  startedAt: string;
  completedAt?: string;
}

// ============================================
// SAVED FILTER TYPES
// ============================================

export interface SavedFilter {
  id: string;
  userEmail: string;
  filterName: string;
  filterType: 'students' | 'applications' | 'payments' | 'documents';
  filterCriteria: {
    dateRange?: { start: string; end: string };
    status?: string[];
    universityId?: string;
    visaSystem?: string;
    trackingCode?: string;
    [key: string]: any;
  };
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
