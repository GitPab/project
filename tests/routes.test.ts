/**
 * Route Consistency Tests
 * Run these tests to ensure all routes are properly configured
 */

import { describe, it, expect } from 'vitest';
import { 
  ROUTES, 
  ROUTE_LAYOUTS, 
  validateRoute, 
  isAdminRoute, 
  isStudentRoute 
} from '../src/app/constants/routes';

// List of all routes from routes.tsx (manually sync or use test to verify)
const DEFINED_ROUTES = [
  // Public
  '/',
  '/universities',
  '/university/:id',
  '/admin-login',
  '/login',
  '/first-time-setup',
  '/student/tracking',
  
  // Student
  '/student',
  '/student/dashboard',
  '/student/home',
  '/student/universities',
  '/student/my-costs',
  '/student/my-progress',
  '/student/feedback',
  '/student/university/:id',
  
  // Admin
  '/admin',
  '/admin/dashboard',
  '/admin/analytics',
  '/admin/universities',
  '/admin/scholarships',
  '/admin/students',
  '/admin/registrations',
  '/admin/visa',
  '/admin/calendar',
  '/admin/feedback',
  '/admin/media',
  '/admin/templates',
  '/admin/bulk',
  '/admin/workflow',
  '/admin/exchange-rates',
  '/admin/users',
  '/admin/roles',
  '/admin/audit',
  '/admin/maintenance',
  '/admin/settings',
  '/admin/university/:id',
];

describe('Route Constants', () => {
  it('should have all admin routes defined', () => {
    ROUTE_LAYOUTS.ADMIN_ROUTES.forEach(route => {
      const result = validateRoute(route);
      expect(result.valid).toBe(true);
      expect(result.type).toBe('admin');
    });
  });

  it('should have all student routes defined', () => {
    ROUTE_LAYOUTS.STUDENT_ROUTES.forEach(route => {
      const result = validateRoute(route);
      expect(result.valid).toBe(true);
      expect(result.type).toBe('student');
    });
  });

  it('should detect admin routes correctly', () => {
    expect(isAdminRoute('/admin/dashboard')).toBe(true);
    expect(isAdminRoute('/admin/students')).toBe(true);
    expect(isAdminRoute('/student/dashboard')).toBe(false);
    expect(isAdminRoute('/')).toBe(false);
  });

  it('should detect student routes correctly', () => {
    expect(isStudentRoute('/student/dashboard')).toBe(true);
    expect(isStudentRoute('/student/home')).toBe(true);
    expect(isStudentRoute('/admin/dashboard')).toBe(false);
    expect(isStudentRoute('/')).toBe(false);
  });
});

describe('Route Consistency', () => {
  it('should not have overlapping admin and student routes', () => {
    const overlap = [...ROUTE_LAYOUTS.ADMIN_ROUTES].filter(adminRoute =>
      [...ROUTE_LAYOUTS.STUDENT_ROUTES].some(studentRoute => 
        (adminRoute as string) === (studentRoute as string)
      )
    );
    expect(overlap).toHaveLength(0);
  });

  it('should have consistent route definitions', () => {
    // Check that all nested routes start with parent
    Object.values(ROUTES.STUDENT).forEach(route => {
      if (typeof route === 'string') {
        expect(route.startsWith('/student')).toBe(true);
      }
    });

    Object.values(ROUTES.ADMIN).forEach(route => {
      if (typeof route === 'string') {
        expect(route.startsWith('/admin')).toBe(true);
      }
    });
  });
});

// Test for route existence in routes.tsx
// This would need to parse the actual routes file
describe('Route Configuration', () => {
  it('should validate route paths format', () => {
    const allRoutes = [
      ...ROUTE_LAYOUTS.ADMIN_ROUTES,
      ...ROUTE_LAYOUTS.STUDENT_ROUTES,
      ...ROUTE_LAYOUTS.PUBLIC_ROUTES,
    ];

    allRoutes.forEach(route => {
      // Routes should start with /
      expect(route.startsWith('/')).toBe(true);
      // Routes should not have trailing slash (except root)
      if (route !== '/') {
        expect(route.endsWith('/')).toBe(false);
      }
      // Routes should be lowercase
      expect(route).toBe(route.toLowerCase());
    });
  });
});
