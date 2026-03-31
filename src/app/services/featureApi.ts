/**
 * Feature API Service - Offline-First Version
 * 
 * Architecture:
 * - Primary: API → MySQL → PostgreSQL (when online)
 * - Fallback: Local SQLite (when offline)
 * - Sync: Background push from SQLite → API when back online
 * 
 * Features:
 * - Appointments (Lịch hẹn)
 * - Scholarships (Học bổng)
 * - Visa Applications (Theo dõi visa)
 * - University Ratings (Đánh giá)
 * - Service Feedback (Phản hồi)
 * - Email Templates (Mẫu email)
 * - Workflow Rules (Tự động hóa)
 * - Bulk Operations (Thao tác hàng loạt)
 * - Student Progress (Tiến độ)
 * - Student Applications (Đăng ký đa trường)
 * - Scheduled Reminders (Nhắc nhở)
 * - User Preferences (Cài đặt)
 * - Saved Filters (Bộ lọc)
 */

import { apiCallWithOfflineFallback, queueForSync, OfflineFeatureAPI } from './offlineSyncService';

// ============================================
// APPOINTMENTS (Lịch hẹn) - OFFLINE-FIRST
// ============================================
export const AppointmentsAPI = {
  getAll: (filters?: { student_id?: string; status?: string; start_date?: string; end_date?: string }) => 
    OfflineFeatureAPI.getAll('/features/appointments' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    student_id: string;
    admin_id?: string;
    title: string;
    description?: string;
    appointment_type?: string;
    start_time: string;
    end_time?: string;
    location?: string;
    is_online?: boolean;
    meeting_link?: string;
  }) => OfflineFeatureAPI.create('/features/appointments', data)
};

// ============================================
// SCHOLARSHIPS (Học bổng) - OFFLINE-FIRST
// ============================================
export const ScholarshipsAPI = {
  getAll: (filters?: { university_id?: string; is_active?: boolean }) =>
    OfflineFeatureAPI.getAll('/features/scholarships' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    university_id?: string;
    name: string;
    name_korean?: string;
    description?: string;
    amount_vnd?: number;
    amount_krw?: number;
    eligibility_criteria?: string;
    application_deadline?: string;
    requirements?: string;
    max_recipients?: number;
  }) => OfflineFeatureAPI.create('/features/scholarships', data)
};

// ============================================
// VISA APPLICATIONS (Theo dõi visa) - OFFLINE-FIRST
// ============================================
export const VisaApplicationsAPI = {
  getAll: (filters?: { student_id?: string; status?: string }) =>
    OfflineFeatureAPI.getAll('/features/visa-applications' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    student_id: string;
    registration_id?: string;
    visa_type: string;
    embassy_location?: string;
    appointment_date?: string;
    appointment_time?: string;
    notes?: string;
  }) => OfflineFeatureAPI.create('/features/visa-applications', data)
};

// ============================================
// UNIVERSITY RATINGS (Đánh giá) - OFFLINE-FIRST
// ============================================
export const UniversityRatingsAPI = {
  getAll: (filters?: { university_id?: string; is_approved?: boolean }) =>
    OfflineFeatureAPI.getAll('/features/university-ratings' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    university_id: string;
    registration_id?: string;
    overall_rating: number;
    teaching_quality?: number;
    facilities?: number;
    support_services?: number;
    value_for_money?: number;
    review_title?: string;
    review_text?: string;
  }) => OfflineFeatureAPI.create('/features/university-ratings', data)
};

// ============================================
// SERVICE FEEDBACK (Phản hồi dịch vụ) - OFFLINE-FIRST
// ============================================
export const ServiceFeedbackAPI = {
  getAll: (filters?: { is_resolved?: boolean }) =>
    OfflineFeatureAPI.getAll('/features/service-feedback' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    feedback_type?: string;
    rating: number;
    feedback_text: string;
  }) => OfflineFeatureAPI.create('/features/service-feedback', data)
};

// ============================================
// EMAIL TEMPLATES (Mẫu email) - OFFLINE-FIRST
// ============================================
export const EmailTemplatesAPI = {
  getAll: (filters?: { template_type?: string; is_active?: boolean }) =>
    OfflineFeatureAPI.getAll('/features/email-templates' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    name: string;
    subject: string;
    content: string;
    template_type?: string;
    variables?: string[];
  }) => OfflineFeatureAPI.create('/features/email-templates', data)
};

// ============================================
// WORKFLOW RULES (Tự động hóa) - OFFLINE-FIRST
// ============================================
export const WorkflowRulesAPI = {
  getAll: (filters?: { is_active?: boolean; trigger_type?: string }) =>
    OfflineFeatureAPI.getAll('/features/workflow-rules' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    name: string;
    description?: string;
    trigger_type: string;
    trigger_condition: string;
    action_type: string;
    action_config?: Record<string, any>;
    priority?: number;
  }) => OfflineFeatureAPI.create('/features/workflow-rules', data)
};

// ============================================
// BULK OPERATIONS (Thao tác hàng loạt)
// ============================================
export const BulkOperationsAPI = {
  getAll: (filters?: { operation_status?: string; performed_by?: string }) =>
    apiCallWithOfflineFallback('/features/bulk-operations' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : ''), {}),
  
  create: (data: {
    operation_type: string;
    input_data: Record<string, any>;
    total_records: number;
  }) => OfflineFeatureAPI.create('/features/bulk-operations', data)
};

// ============================================
// STUDENT PROGRESS (Tiến độ 8 bước) - OFFLINE-FIRST
// ============================================
export const StudentProgressAPI = {
  getAll: (filters?: { student_id?: string; university_id?: string }) =>
    OfflineFeatureAPI.getAll('/features/student-progress' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    student_id: string;
    university_id: string;
    stage_id: number;
    stage_name?: string;
    status?: string;
    notes?: string;
  }) => OfflineFeatureAPI.create('/features/student-progress', data)
};

// ============================================
// STUDENT APPLICATIONS (Đăng ký đa trường) - OFFLINE-FIRST
// ============================================
export const StudentApplicationsAPI = {
  getAll: (filters?: { student_id?: string; university_id?: string; status?: string }) =>
    OfflineFeatureAPI.getAll('/features/student-applications' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    student_id: string;
    university_id: string;
    tracking_code?: string;
    priority?: number;
    is_primary?: boolean;
    notes?: string;
  }) => OfflineFeatureAPI.create('/features/student-applications', data)
};

// ============================================
// SCHEDULED REMINDERS (Nhắc nhở tự động) - OFFLINE-FIRST
// ============================================
export const ScheduledRemindersAPI = {
  getAll: (filters?: { user_id?: string; is_sent?: boolean }) =>
    OfflineFeatureAPI.getAll('/features/scheduled-reminders' + (filters ? '?' + new URLSearchParams(filters as Record<string, string>).toString() : '')),
  
  create: (data: {
    user_id: string;
    title: string;
    message: string;
    reminder_type?: string;
    scheduled_date: string;
    is_recurring?: boolean;
    recurrence_pattern?: string;
  }) => OfflineFeatureAPI.create('/features/scheduled-reminders', data)
};

// ============================================
// USER PREFERENCES (Cài đặt người dùng) - OFFLINE-FIRST
// ============================================
export const UserPreferencesAPI = {
  get: () => apiCallWithOfflineFallback('/features/user-preferences', {}),
  
  save: (data: {
    language?: string;
    theme?: string;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    push_notifications?: boolean;
    timezone?: string;
    date_format?: string;
  }) => OfflineFeatureAPI.create('/features/user-preferences', data)
};

// ============================================
// SAVED FILTERS (Bộ lọc đã lưu) - OFFLINE-FIRST
// ============================================
export const SavedFiltersAPI = {
  getAll: () => OfflineFeatureAPI.getAll('/features/saved-filters'),
  
  create: (data: {
    filter_name: string;
    filter_type: string;
    filter_criteria: Record<string, any>;
    is_default?: boolean;
  }) => OfflineFeatureAPI.create('/features/saved-filters', data)
};

// Export all APIs
export const FeatureAPI = {
  Appointments: AppointmentsAPI,
  Scholarships: ScholarshipsAPI,
  VisaApplications: VisaApplicationsAPI,
  UniversityRatings: UniversityRatingsAPI,
  ServiceFeedback: ServiceFeedbackAPI,
  EmailTemplates: EmailTemplatesAPI,
  WorkflowRules: WorkflowRulesAPI,
  BulkOperations: BulkOperationsAPI,
  StudentProgress: StudentProgressAPI,
  StudentApplications: StudentApplicationsAPI,
  ScheduledReminders: ScheduledRemindersAPI,
  UserPreferences: UserPreferencesAPI,
  SavedFilters: SavedFiltersAPI
};

export default FeatureAPI;
