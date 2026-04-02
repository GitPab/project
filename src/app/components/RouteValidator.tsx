/**
 * Route Validator Component
 * Detects route/layout mismatches and warns in development
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { validateRoute, isAdminRoute, isStudentRoute } from '../constants/routes';

interface RouteValidatorProps {
  expectedLayout: 'admin' | 'student' | 'public';
  children: React.ReactNode;
}

export function RouteValidator({ expectedLayout, children }: RouteValidatorProps) {
  const location = useLocation();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const validation = validateRoute(location.pathname);
      
      // Check for mismatches
      if (expectedLayout === 'admin' && !isAdminRoute(location.pathname)) {
        console.warn(
          `[RouteValidator] ⚠️ Layout mismatch!\n` +
          `  Route: ${location.pathname}\n` +
          `  Expected: admin layout\n` +
          `  Actual: This route is NOT in ADMIN_ROUTES\n` +
          `  Fix: Add route to ROUTE_LAYOUTS.ADMIN_ROUTES in constants/routes.ts`
        );
      }
      
      if (expectedLayout === 'student' && !isStudentRoute(location.pathname)) {
        console.warn(
          `[RouteValidator] ⚠️ Layout mismatch!\n` +
          `  Route: ${location.pathname}\n` +
          `  Expected: student layout\n` +
          `  Actual: This route is NOT in STUDENT_ROUTES\n` +
          `  Fix: Add route to ROUTE_LAYOUTS.STUDENT_ROUTES in constants/routes.ts`
        );
      }
      
      if (!validation.valid) {
        console.error(
          `[RouteValidator] ❌ Unknown route!\n` +
          `  Route: ${location.pathname}\n` +
          `  This route is not defined in any ROUTE_LAYOUTS\n` +
          `  Fix: Add route to constants/routes.ts and routes.tsx`
        );
      }
    }
  }, [location.pathname, expectedLayout]);
  
  return <>{children}</>;
}

// Hook for route validation
export function useRouteValidation() {
  const location = useLocation();
  
  return {
    isValid: validateRoute(location.pathname).valid,
    routeType: validateRoute(location.pathname).type,
    isAdmin: isAdminRoute(location.pathname),
    isStudent: isStudentRoute(location.pathname),
  };
}
