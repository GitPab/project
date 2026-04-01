// ============================================
// Permission Guard Component - Hide/Disable features based on roles
// ============================================

import { useAuth } from '../context/AuthContext';
import { ROLE_DEFINITIONS, PERMISSIONS, type Role } from '../constants/rbac';
import { Navigate } from 'react-router';

const ACTION_ALIASES: Record<string, string> = {
  update: 'edit'
};

const normalizeAction = (action: string) => ACTION_ALIASES[action] || action;

const resolvePermissionKey = (requiredPermission: string): string | null => {
  if (!requiredPermission) return null;
  if (requiredPermission === '*') return '*';

  // Direct key match (e.g. "UNIVERSITY_CREATE")
  if (requiredPermission in PERMISSIONS) {
    return requiredPermission;
  }

  // Match by action/resource (supports "resource:action" or "action:resource")
  const parts = requiredPermission.split(':');
  if (parts.length === 2) {
    const [p1, p2] = parts.map(p => p.trim());

    const action1 = normalizeAction(p2);
    const resource1 = p1;
    const match1 = Object.entries(PERMISSIONS).find(([, perm]) =>
      perm.action === action1 && perm.resource === resource1
    );
    if (match1) return match1[0];

    const action2 = normalizeAction(p1);
    const resource2 = p2;
    const match2 = Object.entries(PERMISSIONS).find(([, perm]) =>
      perm.action === action2 && perm.resource === resource2
    );
    if (match2) return match2[0];
  }

  return null;
};

// Hook to check permissions
export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (requiredPermission: string): boolean => {
    if (!user?.role) return false;
    const role = user.role as Role;
    const roleDef = ROLE_DEFINITIONS[role];
    if (!roleDef) return false;
    if (roleDef.permissions.includes('*')) return true;
    const key = resolvePermissionKey(requiredPermission);
    if (!key) return false;
    return roleDef.permissions.includes(key);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, userRole: user?.role };
}

// Component to conditionally render based on permission
interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// Component to redirect if no permission
interface PageGuardProps {
  permission: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export function PageGuard({ permission, children, redirectTo = '/admin/dashboard' }: PageGuardProps) {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(permission)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
}

// Button wrapper that disables button if no permission
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission: string;
  children: React.ReactNode;
}

export function PermissionButton({ permission, children, ...props }: PermissionButtonProps) {
  const { hasPermission } = usePermission();
  const canAccess = hasPermission(permission);
  
  return (
    <button 
      {...props} 
      disabled={props.disabled || !canAccess}
      title={!canAccess ? 'Bạn không có quyền thực hiện thao tác này' : props.title}
    >
      {children}
    </button>
  );
}
