import { usePermission } from './PermissionGuard';
import { Navigate } from 'react-router';

interface PermissionRouteProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionRoute({ permission, children, fallback }: PermissionRouteProps) {
  const { hasPermission } = usePermission();
  
  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : <Navigate to="/admin/dashboard" replace />;
  }
  
  return <>{children}</>;
}
