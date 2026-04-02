/**
 * Route Constants - Type-safe routing
 * Use these constants instead of hardcoded strings
 */

export const ROUTES = {
  // Public
  HOME: '/',
  UNIVERSITIES: '/universities',
  UNIVERSITY_DETAIL: (id: string) => `/university/${id}`,
  
  // Auth
  ADMIN_LOGIN: '/admin-login',
  LOGIN: '/login',
  
  // Student
  STUDENT: {
    ROOT: '/student',
    DASHBOARD: '/student/dashboard',
    HOME: '/student/home',
    UNIVERSITIES: '/student/universities',
    MY_COSTS: '/student/my-costs',
    MY_PROGRESS: '/student/my-progress',
    FEEDBACK: '/student/feedback',
    TRACKING: '/student/tracking',
    UNIVERSITY_DETAIL: (id: string) => `/student/university/${id}`,
  },
  
  // Admin
  ADMIN: {
    ROOT: '/admin',
    DASHBOARD: '/admin/dashboard',
    ANALYTICS: '/admin/analytics',
    UNIVERSITIES: '/admin/universities',
    SCHOLARSHIPS: '/admin/scholarships',
    STUDENTS: '/admin/students',
    REGISTRATIONS: '/admin/registrations',
    VISA: '/admin/visa',
    CALENDAR: '/admin/calendar',
    FEEDBACK: '/admin/feedback',
    MEDIA: '/admin/media',
    TEMPLATES: '/admin/templates',
    BULK: '/admin/bulk',
    WORKFLOW: '/admin/workflow',
    EXCHANGE_RATES: '/admin/exchange-rates',
    USERS: '/admin/users',
    ROLES: '/admin/roles',
    AUDIT: '/admin/audit',
    MAINTENANCE: '/admin/maintenance',
    SETTINGS: '/admin/settings',
  },
} as const;

// Route to Layout mapping
export const ROUTE_LAYOUTS = {
  ADMIN_ROUTES: [
    ROUTES.ADMIN.ROOT,
    ROUTES.ADMIN.DASHBOARD,
    ROUTES.ADMIN.ANALYTICS,
    ROUTES.ADMIN.UNIVERSITIES,
    ROUTES.ADMIN.SCHOLARSHIPS,
    ROUTES.ADMIN.STUDENTS,
    ROUTES.ADMIN.REGISTRATIONS,
    ROUTES.ADMIN.VISA,
    ROUTES.ADMIN.CALENDAR,
    ROUTES.ADMIN.FEEDBACK,
    ROUTES.ADMIN.MEDIA,
    ROUTES.ADMIN.TEMPLATES,
    ROUTES.ADMIN.BULK,
    ROUTES.ADMIN.WORKFLOW,
    ROUTES.ADMIN.EXCHANGE_RATES,
    ROUTES.ADMIN.USERS,
    ROUTES.ADMIN.ROLES,
    ROUTES.ADMIN.AUDIT,
    ROUTES.ADMIN.MAINTENANCE,
    ROUTES.ADMIN.SETTINGS,
  ],
  STUDENT_ROUTES: [
    ROUTES.STUDENT.ROOT,
    ROUTES.STUDENT.DASHBOARD,
    ROUTES.STUDENT.HOME,
    ROUTES.STUDENT.UNIVERSITIES,
    ROUTES.STUDENT.MY_COSTS,
    ROUTES.STUDENT.MY_PROGRESS,
    ROUTES.STUDENT.FEEDBACK,
    ROUTES.STUDENT.TRACKING,
  ],
  PUBLIC_ROUTES: [
    ROUTES.HOME,
    ROUTES.UNIVERSITIES,
    ROUTES.ADMIN_LOGIN,
    ROUTES.LOGIN,
  ],
} as const;

// Helper to check route type
export function isAdminRoute(path: string): boolean {
  return ROUTE_LAYOUTS.ADMIN_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

export function isStudentRoute(path: string): boolean {
  return ROUTE_LAYOUTS.STUDENT_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

export function isPublicRoute(path: string): boolean {
  return ROUTE_LAYOUTS.PUBLIC_ROUTES.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
}

// Validate route against defined routes
export function validateRoute(path: string): { valid: boolean; type?: 'admin' | 'student' | 'public' | 'unknown' } {
  if (isAdminRoute(path)) return { valid: true, type: 'admin' };
  if (isStudentRoute(path)) return { valid: true, type: 'student' };
  if (isPublicRoute(path)) return { valid: true, type: 'public' };
  return { valid: false, type: 'unknown' };
}
