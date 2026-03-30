// ============================================
// RBAC (Role-Based Access Control) Configuration
// ============================================

export type Role = 'super_admin' | 'admin' | 'admin_manager' | 'content_editor' | 'finance_admin' | 'viewer';

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
  
  // User management (Super admin only)
  USER_MANAGE: { action: 'manage', resource: 'user', description: 'Quản lý người dùng' },
  ROLE_MANAGE: { action: 'manage', resource: 'role', description: 'Quản lý vai trò' },
  
  // System settings
  SETTINGS_MANAGE: { action: 'manage', resource: 'settings', description: 'Quản lý cài đặt' },
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
    ],
  },
  content_editor: {
    label: 'Biên tập viên',
    description: 'Chỉnh sửa thông tin trường, nội dung',
    permissions: [
      'UNIVERSITY_VIEW', 'UNIVERSITY_CREATE', 'UNIVERSITY_EDIT',
      'STUDENT_VIEW',
      'APPLICATION_VIEW',
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
