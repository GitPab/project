import { Navigate, Outlet } from 'react-router';
import { useAuth, type UserRole } from '../context/AuthContext';

interface PrivateRouteProps {
  requireRole?: UserRole;
  children?: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PrivateRoute({ 
  requireRole, 
  children,
  fallback 
}: PrivateRouteProps) {
  const { user, isAuthenticated, isAdmin } = useAuth();

  // Not authenticated → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Require specific role but user doesn't have it (admin can access everything)
  if (requireRole && !isAdmin && user?.role !== requireRole) {
    return fallback || <Navigate to="/403" replace />;
  }

  // Render children or outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
}
