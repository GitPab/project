// ============================================
// RBAC (Role-Based Access Control) Configuration
// ============================================

export type Role = 'super_admin' | 'admin' | 'admin_manager' | 'content_editor' | 'finance_admin' | 'viewer' | 'student';

export interface Permission {
  action: string;
  resource: string;
  description: string;
}

// Define all available permissions
export const PERMISSIONS = {
  // University management
  UNIVERSITY_VIEW: { action: 'view', resource: 'university', description: 'Xem danh sách trường' },
  UNIVERSITY_CREATE: { action: 'create', resource: 'university', description: 'Thêm trường mới' },
  UNIVERSITY_EDIT: { action: 'edit', resource: 'university', description: 'Chỉnh sửa trường' },
  UNIVERSITY_DELETE: { action: 'delete', resource: 'university', description: 'Xóa trường' },
  UNIVERSITY_EXPORT: { action: 'export', resource: 'university', description: 'Xuất dữ liệu trường' },
  
  // Student management
  STUDENT_VIEW: { action: 'view', resource: 'student', description: 'Xem danh sách học sinh' },
  STUDENT_EDIT: { action: 'edit', resource: 'student', description: 'Chỉnh sửa học sinh' },
  STUDENT_PROGRESS: { action: 'manage', resource: 'student_progress', description: 'Quản lý tiến độ học sinh' },
  
  // Finance
  PAYMENT_VIEW: { action: 'view', resource: 'payment', description: 'Xem thanh toán' },
  PAYMENT_CREATE: { action: 'create', resource: 'payment', description: 'Tạo thanh toán' },
  PAYMENT_APPROVE: { action: 'approve', resource: 'payment', description: 'Phê duyệt thanh toán' },
  
  // Applications
  APPLICATION_VIEW: { action: 'view', resource: 'application', description: 'Xem đơn đăng ký' },
  APPLICATION_MANAGE: { action: 'manage', resource: 'application', description: 'Quản lý đơn đăng ký' },
  
  // Reports & Analytics
  ANALYTICS_VIEW: { action: 'view', resource: 'analytics', description: 'Xem báo cáo' },
  ANALYTICS_MANAGE: { action: 'manage', resource: 'analytics', description: 'Manage analytics and feedback' },

  // Database & maintenance
  DATABASE_VIEW: { action: 'view', resource: 'database', description: 'View database operations' },
  DATABASE_MANAGE: { action: 'manage', resource: 'database', description: 'Manage database operations' },
  
  // User management (Super admin only)
  USER_MANAGE: { action: 'manage', resource: 'user', description: 'Quản lý người dùng' },
  ROLE_MANAGE: { action: 'manage', resource: 'role', description: 'Quản lý vai trò' },
  
  // System settings
  SETTINGS_MANAGE: { action: 'manage', resource: 'settings', description: 'Quản lý cài đặt' },
  
  // v2.0 Features - Scholarships (Học bổng)
  SCHOLARSHIP_VIEW: { action: 'view', resource: 'scholarship', description: 'Xem học bổng' },
  SCHOLARSHIP_CREATE: { action: 'create', resource: 'scholarship', description: 'Tạo học bổng' },
  SCHOLARSHIP_EDIT: { action: 'edit', resource: 'scholarship', description: 'Chỉnh sửa học bổng' },
  SCHOLARSHIP_DELETE: { action: 'delete', resource: 'scholarship', description: 'Xóa học bổng' },
  SCHOLARSHIP_APPLICATION_MANAGE: { action: 'manage', resource: 'scholarship_application', description: 'Quản lý đơn xin học bổng' },
  
  // v2.0 Features - Visa Applications (Theo dõi visa)
  VISA_VIEW: { action: 'view', resource: 'visa', description: 'Xem đơn visa' },
  VISA_CREATE: { action: 'create', resource: 'visa', description: 'Tạo đơn visa' },
  VISA_EDIT: { action: 'edit', resource: 'visa', description: 'Chỉnh sửa đơn visa' },
  VISA_STATUS_MANAGE: { action: 'manage', resource: 'visa_status', description: 'Quản lý trạng thái visa' },
  
  // v2.0 Features - Appointments (Lịch hẹn)
  APPOINTMENT_VIEW: { action: 'view', resource: 'appointment', description: 'Xem lịch hẹn' },
  APPOINTMENT_CREATE: { action: 'create', resource: 'appointment', description: 'Tạo lịch hẹn' },
  APPOINTMENT_EDIT: { action: 'edit', resource: 'appointment', description: 'Chỉnh sửa lịch hẹn' },
  APPOINTMENT_CANCEL: { action: 'cancel', resource: 'appointment', description: 'Hủy lịch hẹn' },
  
  // v2.0 Features - Messages (Tin nhắn nội bộ)
  MESSAGE_VIEW: { action: 'view', resource: 'message', description: 'Xem tin nhắn' },
  MESSAGE_CREATE: { action: 'create', resource: 'message', description: 'Gửi tin nhắn' },
  MESSAGE_DELETE: { action: 'delete', resource: 'message', description: 'Xóa tin nhắn' },
  
  // v2.0 Features - Documents (Tài liệu)
  DOCUMENT_VIEW: { action: 'view', resource: 'document', description: 'Xem tài liệu' },
  DOCUMENT_UPLOAD: { action: 'create', resource: 'document', description: 'Tải lên tài liệu' },
  DOCUMENT_REVIEW: { action: 'review', resource: 'document', description: 'Phê duyệt tài liệu' },
  DOCUMENT_DELETE: { action: 'delete', resource: 'document', description: 'Xóa tài liệu' },
  
  // v2.0 Features - Programs (Chương trình học)
  PROGRAM_VIEW: { action: 'view', resource: 'program', description: 'Xem chương trình học' },
  PROGRAM_CREATE: { action: 'create', resource: 'program', description: 'Tạo chương trình học' },
  PROGRAM_EDIT: { action: 'edit', resource: 'program', description: 'Chỉnh sửa chương trình học' },
  PROGRAM_DELETE: { action: 'delete', resource: 'program', description: 'Xóa chương trình học' },
  
  // v2.0 Features - Notifications (Thông báo)
  NOTIFICATION_VIEW: { action: 'view', resource: 'notification', description: 'Xem thông báo' },
  NOTIFICATION_CREATE: { action: 'create', resource: 'notification', description: 'Tạo thông báo' },
  NOTIFICATION_BROADCAST: { action: 'broadcast', resource: 'notification', description: 'Gửi thông báo hàng loạt' },
  NOTIFICATION_CLEAR: { action: 'delete', resource: 'notification', description: 'Xóa thông báo' },
  
  // v2.0 Features - User Preferences (Tùy chỉnh người dùng)
  PREFERENCE_VIEW: { action: 'view', resource: 'preference', description: 'Xem tùy chỉnh' },
  PREFERENCE_EDIT: { action: 'edit', resource: 'preference', description: 'Chỉnh sửa tùy chỉnh' },
  
  // v2.0 Features - Student Profiles (Hồ sơ học sinh)
  PROFILE_VIEW: { action: 'view', resource: 'profile', description: 'Xem hồ sơ học sinh' },
  PROFILE_EDIT: { action: 'edit', resource: 'profile', description: 'Chỉnh sửa hồ sơ học sinh' },
  PROFILE_MANAGE: { action: 'manage', resource: 'profile', description: 'Quản lý hồ sơ học sinh' },
  
  // v2.0 Features - Email Templates (Mẫu email)
  EMAIL_TEMPLATE_VIEW: { action: 'view', resource: 'email_template', description: 'Xem mẫu email' },
  EMAIL_TEMPLATE_CREATE: { action: 'create', resource: 'email_template', description: 'Tạo mẫu email' },
  EMAIL_TEMPLATE_EDIT: { action: 'edit', resource: 'email_template', description: 'Chỉnh sửa mẫu email' },
  
  // v2.0 Features - Workflow Rules (Tự động hóa)
  WORKFLOW_VIEW: { action: 'view', resource: 'workflow', description: 'Xem quy tắc tự động' },
  WORKFLOW_MANAGE: { action: 'manage', resource: 'workflow', description: 'Quản lý quy tắc tự động' },
  
  // v2.0 Features - Bulk Operations (Thao tác hàng loạt)
  BULK_OPERATION_VIEW: { action: 'view', resource: 'bulk_operation', description: 'Xem thao tác hàng loạt' },
  BULK_OPERATION_EXECUTE: { action: 'manage', resource: 'bulk_operation', description: 'Thực thi thao tác hàng loạt' },
  
  // v2.0 Features - Service Feedback (Phản hồi dịch vụ)
  FEEDBACK_VIEW: { action: 'view', resource: 'feedback', description: 'Xem phản hồi' },
  FEEDBACK_MANAGE: { action: 'manage', resource: 'feedback', description: 'Quản lý phản hồi' },
  
  // v2.0 Features - Communication Logs (Lịch sử liên lạc)
  COMMUNICATION_VIEW: { action: 'view', resource: 'communication', description: 'Xem lịch sử liên lạc' },
  COMMUNICATION_SEND: { action: 'create', resource: 'communication', description: 'Gửi liên lạc' },
  
  // v2.0 Features - Exchange Rates (Tỷ giá)
  EXCHANGE_RATE_VIEW: { action: 'view', resource: 'exchange_rate', description: 'Xem tỷ giá' },
  EXCHANGE_RATE_MANAGE: { action: 'manage', resource: 'exchange_rate', description: 'Quản lý tỷ giá' },
  
  // v2.0 Features - Media & Files (Media)
  MEDIA_VIEW: { action: 'view', resource: 'media', description: 'Xem media' },
  MEDIA_UPLOAD: { action: 'create', resource: 'media', description: 'Tải lên media' },
  MEDIA_DELETE: { action: 'delete', resource: 'media', description: 'Xóa media' },
} as const;

// Role definitions with permissions
export const ROLE_DEFINITIONS: Record<Role, { label: string; description: string; permissions: string[] }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'Quyền toàn hệ thống',
    permissions: Object.keys(PERMISSIONS),
  },
  admin: {
    label: 'Admin',
    description: 'Quản lý toàn bộ hệ thống (legacy)',
    permissions: Object.keys(PERMISSIONS), // Full access like super_admin
  },
  admin_manager: {
    label: 'Quản lý Admin',
    description: 'Quản lý học sinh, đơn đăng ký, tiến độ',
    permissions: [
      'UNIVERSITY_VIEW',
      'STUDENT_VIEW', 'STUDENT_EDIT', 'STUDENT_PROGRESS',
      'APPLICATION_VIEW', 'APPLICATION_MANAGE',
      'PAYMENT_VIEW',
      'ANALYTICS_VIEW',
      'SCHOLARSHIP_VIEW', 'SCHOLARSHIP_APPLICATION_MANAGE',
      'VISA_VIEW', 'VISA_EDIT',
      'APPOINTMENT_VIEW', 'APPOINTMENT_CREATE', 'APPOINTMENT_EDIT',
      'MESSAGE_VIEW', 'MESSAGE_CREATE',
      'DOCUMENT_VIEW', 'DOCUMENT_REVIEW',
      'PROGRAM_VIEW',
      'NOTIFICATION_VIEW',
      'PROFILE_VIEW', 'PROFILE_EDIT',
      'FEEDBACK_VIEW', 'FEEDBACK_MANAGE',
    ],
  },
  content_editor: {
    label: 'Biên tập viên',
    description: 'Chỉnh sửa thông tin trường, nội dung',
    permissions: [
      'UNIVERSITY_VIEW', 'UNIVERSITY_CREATE', 'UNIVERSITY_EDIT',
      'STUDENT_VIEW',
      'APPLICATION_VIEW',
      'PROGRAM_VIEW', 'PROGRAM_CREATE', 'PROGRAM_EDIT',
      'MEDIA_VIEW', 'MEDIA_UPLOAD',
    ],
  },
  finance_admin: {
    label: 'Quản lý Tài chính',
    description: 'Quản lý thanh toán và tài chính',
    permissions: [
      'UNIVERSITY_VIEW',
      'STUDENT_VIEW',
      'APPLICATION_VIEW',
      'PAYMENT_VIEW', 'PAYMENT_CREATE', 'PAYMENT_APPROVE',
      'ANALYTICS_VIEW',
      'SCHOLARSHIP_VIEW',
      'EXCHANGE_RATE_VIEW',
    ],
  },
  viewer: {
    label: 'Người xem',
    description: 'Chỉ xem, không chỉnh sửa',
    permissions: [
      'UNIVERSITY_VIEW',
      'STUDENT_VIEW',
      'APPLICATION_VIEW',
      'PAYMENT_VIEW',
      'ANALYTICS_VIEW',
      'SCHOLARSHIP_VIEW',
      'VISA_VIEW',
      'APPOINTMENT_VIEW',
      'DOCUMENT_VIEW',
      'PROGRAM_VIEW',
      'NOTIFICATION_VIEW',
      'PROFILE_VIEW',
      'FEEDBACK_VIEW',
    ],
  },
  student: {
    label: 'Học viên',
    description: 'Quyền cơ bản cho học viên',
    permissions: [
      'UNIVERSITY_VIEW',
      'APPLICATION_VIEW',
      'SCHOLARSHIP_VIEW',
      'VISA_VIEW', 'VISA_CREATE',
      'APPOINTMENT_VIEW', 'APPOINTMENT_CREATE',
      'MESSAGE_VIEW', 'MESSAGE_CREATE',
      'DOCUMENT_VIEW', 'DOCUMENT_UPLOAD',
      'NOTIFICATION_VIEW',
      'PREFERENCE_VIEW', 'PREFERENCE_EDIT',
      'PROFILE_VIEW', 'PROFILE_EDIT',
    ],
  },
};

// Helper function to check if role has permission
export function hasPermission(role: Role, permissionKey: keyof typeof PERMISSIONS): boolean {
  const roleDef = ROLE_DEFINITIONS[role];
  return roleDef?.permissions.includes(permissionKey) ?? false;
}

// Get all permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  const roleDef = ROLE_DEFINITIONS[role];
  return roleDef?.permissions.map(key => PERMISSIONS[key as keyof typeof PERMISSIONS]) ?? [];
}

// Get readable role label
export function getRoleLabel(role: Role): string {
  return ROLE_DEFINITIONS[role]?.label || role;
}
