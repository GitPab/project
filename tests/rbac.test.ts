/**
 * RBAC Constants Tests
 * Tests for role-based access control constants
 */

import { describe, it, expect } from 'vitest';
import { 
  PERMISSIONS, 
  ROLE_DEFINITIONS, 
  getRolePermissions,
  hasPermission,
  type Role
} from '../src/app/constants/rbac';

describe('PERMISSIONS', () => {
  it('should have all required permissions defined', () => {
    expect(PERMISSIONS.UNIVERSITY_VIEW).toBeDefined();
    expect(PERMISSIONS.UNIVERSITY_CREATE).toBeDefined();
    expect(PERMISSIONS.UNIVERSITY_EDIT).toBeDefined();
    expect(PERMISSIONS.UNIVERSITY_DELETE).toBeDefined();
    expect(PERMISSIONS.STUDENT_VIEW).toBeDefined();
    expect(PERMISSIONS.STUDENT_EDIT).toBeDefined();
    expect(PERMISSIONS.PAYMENT_VIEW).toBeDefined();
    expect(PERMISSIONS.PAYMENT_CREATE).toBeDefined();
    expect(PERMISSIONS.APPLICATION_VIEW).toBeDefined();
    expect(PERMISSIONS.APPLICATION_MANAGE).toBeDefined();
    expect(PERMISSIONS.USER_MANAGE).toBeDefined();
    expect(PERMISSIONS.SETTINGS_MANAGE).toBeDefined();
  });

  it('should have correct permission structure with action, resource, description', () => {
    Object.values(PERMISSIONS).forEach(permission => {
      expect(typeof permission).toBe('object');
      expect(permission.action).toBeDefined();
      expect(permission.resource).toBeDefined();
      expect(permission.description).toBeDefined();
      expect(typeof permission.action).toBe('string');
      expect(typeof permission.resource).toBe('string');
      expect(typeof permission.description).toBe('string');
    });
  });
});

describe('ROLE_DEFINITIONS', () => {
  it('should have all standard roles', () => {
    expect(ROLE_DEFINITIONS.admin).toBeDefined();
    expect(ROLE_DEFINITIONS.student).toBeDefined();
    expect(ROLE_DEFINITIONS.admin_manager).toBeDefined();
    expect(ROLE_DEFINITIONS.content_editor).toBeDefined();
    expect(ROLE_DEFINITIONS.finance_admin).toBeDefined();
    expect(ROLE_DEFINITIONS.viewer).toBeDefined();
  });

  it('should have valid permission arrays for each role', () => {
    Object.entries(ROLE_DEFINITIONS).forEach(([role, config]) => {
      expect(Array.isArray(config.permissions)).toBe(true);
      expect(config.permissions.length).toBeGreaterThan(0);
      expect(config.description).toBeDefined();
    });
  });

  it('admin should have most permissions', () => {
    const adminPerms = ROLE_DEFINITIONS.admin.permissions;
    expect(adminPerms.length).toBeGreaterThan(20);
  });

  it('student should have limited permissions', () => {
    const studentPerms = ROLE_DEFINITIONS.student.permissions;
    expect(studentPerms.length).toBeLessThan(10);
  });
});

describe('getRolePermissions', () => {
  it('should return permissions for valid role', () => {
    const perms = getRolePermissions('admin');
    expect(Array.isArray(perms)).toBe(true);
    expect(perms.length).toBeGreaterThan(0);
  });

  it('should return empty array for invalid role', () => {
    const perms = getRolePermissions('invalid_role' as Role);
    expect(perms).toEqual([]);
  });

  it('should handle all defined roles', () => {
    (Object.keys(ROLE_DEFINITIONS) as Role[]).forEach(role => {
      const perms = getRolePermissions(role);
      expect(Array.isArray(perms)).toBe(true);
    });
  });
});

describe('hasPermission', () => {
  it('should return true when user has permission', () => {
    expect(hasPermission('admin', 'UNIVERSITY_VIEW')).toBe(true);
  });

  it('should return false when user lacks permission', () => {
    expect(hasPermission('student', 'UNIVERSITY_DELETE')).toBe(false);
  });

  it('should return false for invalid role', () => {
    expect(hasPermission('invalid' as Role, 'UNIVERSITY_VIEW')).toBe(false);
  });

  it('should work for all role-permission combinations', () => {
    const testCases: { role: Role; perm: string; expected: boolean }[] = [
      { role: 'admin', perm: 'STUDENT_VIEW', expected: true },
      { role: 'student', perm: 'STUDENT_VIEW', expected: true },
      { role: 'finance_admin', perm: 'PAYMENT_CREATE', expected: true },
      { role: 'viewer', perm: 'UNIVERSITY_DELETE', expected: false },
    ];

    testCases.forEach(({ role, perm, expected }) => {
      expect(hasPermission(role, perm as any)).toBe(expected);
    });
  });
});
