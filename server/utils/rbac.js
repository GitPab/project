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
      'view:scholarship', 'manage:scholarship_application',
      'view:visa', 'edit:visa',
      'view:appointment', 'create:appointment', 'edit:appointment',
      'view:message', 'create:message',
      'view:document', 'review:document',
      'view:program',
      'view:notification',
      'view:profile', 'edit:profile',
      'view:feedback', 'manage:feedback',
    ],
  },
  content_editor: {
    permissions: [
      'view:university', 'create:university', 'edit:university',
      'view:student',
      'view:application',
      'view:program', 'create:program', 'edit:program',
      'view:media', 'create:media',
    ],
  },
  finance_admin: {
    permissions: [
      'view:university',
      'view:student',
      'view:application',
      'view:payment', 'create:payment', 'approve:payment',
      'view:analytics',
      'view:scholarship',
      'view:exchange_rate',
    ],
  },
  viewer: {
    permissions: [
      'view:university',
      'view:student',
      'view:application',
      'view:payment',
      'view:analytics',
      'view:scholarship',
      'view:visa',
      'view:appointment',
      'view:document',
      'view:program',
      'view:notification',
      'view:profile',
      'view:feedback',
    ],
  },
  student: {
    permissions: [
      'view:university',
      'create:application', 'view:application',
      'view:scholarship',
      'view:visa', 'create:visa',
      'view:appointment', 'create:appointment',
      'view:message', 'create:message',
      'view:document', 'create:document',
      'view:notification',
      'view:preference', 'edit:preference',
      'view:profile', 'edit:profile',
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
 * Note: 'viewer' is NOT included as they are read-only
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Admin roles that can make changes (viewer excluded - read only)
  const adminRoles = ['admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin'];
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
