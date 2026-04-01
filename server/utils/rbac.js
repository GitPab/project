/**
 * RBAC (Role-Based Access Control) Utility
 */

// Role definitions with permissions
export const ROLE_DEFINITIONS = {
  super_admin: {
    permissions: ['*'], // All permissions
  },
  admin: {
    permissions: ['*'], // Same as super_admin - full access
  },
  admin_manager: {
    permissions: [
      'view:university',
      'view:student', 'edit:student',
      'view:application', 'manage:application',
      'view:payment',
      'view:analytics',
      'view:student_progress', 'manage:student_progress',
    ],
  },
  content_editor: {
    permissions: [
      'view:university', 'create:university', 'edit:university',
      'view:student',
      'view:application',
    ],
  },
  finance_admin: {
    permissions: [
      'view:university',
      'view:student',
      'view:application',
      'view:payment', 'create:payment', 'approve:payment',
      'view:analytics',
    ],
  },
  viewer: {
    permissions: [
      'view:university',
      'view:student',
      'view:application',
      'view:payment',
      'view:analytics',
    ],
  },
  student: {
    permissions: [
      'view:university',
      'create:application', 'view:application',
    ],
  },
};

/**
 * Check if user has permission
 */
export function hasPermission(userRole, action, resource) {
  const roleDef = ROLE_DEFINITIONS[userRole];
  if (!roleDef) return false;
  if (roleDef.permissions.includes('*')) return true;
  return roleDef.permissions.includes(`${action}:${resource}`);
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(action, resource) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!hasPermission(req.user.role, action, resource)) {
      return res.status(403).json({ error: `Permission denied: ${action}:${resource}` });
    }
    next();
  };
}

/**
 * Legacy admin check (backward compatibility)
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const adminRoles = ['admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

/**
 * Require invite permission (for admin invites)
 */
export function requireInvitePermission(req, res, next) {
  const allowedRoles = ['super_admin', 'admin'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Permission denied: Cannot invite users' });
  }
  next();
}
