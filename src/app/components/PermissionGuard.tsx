// ============================================
// Permission Guard Component - Hide/Disable features based on roles
// ============================================

import { useAuth } from '../context/AuthContext';
import { ROLE_DEFINITIONS, type Role } from '../constants/rbac';
import { Navigate } from 'react-router';

// Hook to check permissions
export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (requiredPermission: string): boolean => {
    if (!user?.role) return false;
    const role = user.role as Role;
    const roleDef = ROLE_DEFINITIONS[role];
    if (!roleDef) return false;
    if (roleDef.permissions.includes('*')) return true;
    return roleDef.permissions.includes(requiredPermission);
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
