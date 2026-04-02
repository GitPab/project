import { lazy, Suspense, useState, useEffect } from 'react';
import { createHashRouter, Navigate, Outlet, useNavigate } from 'react-router';

// Eager imports for critical pages
import PublicOnboarding from './pages/PublicOnboarding';
import AdminLoginSimple from './pages/AdminLoginSimple';
import TrackingLookupSimple from './pages/TrackingLookupSimple';
import FirstTimeSetup from './pages/FirstTimeSetup';
import Layout from './components/Layout';
import UniversityInfo from './pages/UniversityInfo';

// Lazy imports for other pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UniversitiesListEnhancedRedesigned = lazy(() => import('./components/UniversitiesListEnhancedRedesigned'));
const UniversityDetailRedesigned = lazy(() => import('./pages/UniversityDetailRedesigned'));
const UniversityDetailAdmin = lazy(() => import('./pages/UniversityDetailAdmin'));
const StudentMonitoring = lazy(() => import('./pages/StudentMonitoring'));
const AdminRegistrations = lazy(() => import('./pages/AdminRegistrations'));
const StudentUniversities = lazy(() => import('./pages/StudentUniversities'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentFeedbackPage = lazy(() => import('./pages/StudentFeedback'));
const ProgressTracker = lazy(() => import('./pages/ProgressTracker'));
const StudentHome = lazy(() => import('./pages/StudentHome'));
const StudentOnboarding = lazy(() => import('./pages/StudentOnboarding')); 
const AdminAuditTrail = lazy(() => import('./pages/AdminAuditTrail'));
const AdminEmailTemplates = lazy(() => import('./pages/AdminEmailTemplates'));
const AdminWorkflow = lazy(() => import('./pages/AdminWorkflow'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminBulkOperations = lazy(() => import('./pages/AdminBulkOperations'));
const AdminScholarships = lazy(() => import('./pages/AdminScholarships'));
const AdminVisaTracking = lazy(() => import('./pages/AdminVisaTracking'));
const AdminCalendar = lazy(() => import('./pages/AdminCalendar'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminAnalyticsDashboard = lazy(() => import('./pages/AdminAnalyticsDashboard'));
const AdminRoles = lazy(() => import('./pages/AdminRoles'));
const AdminMaintenance = lazy(() => import('./pages/AdminMaintenance'));
const AdminMediaLibrary = lazy(() => import('./pages/AdminMediaLibrary'));
const AdminExchangeRates = lazy(() => import('./pages/AdminExchangeRates'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

// Wrap lazy components with Suspense
const withSuspense = (Component: React.ComponentType) => () => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Route error component
function RouteError() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Lỗi</h1>
        <p className="text-gray-600 mb-4">Không thể tải trang</p>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
// Simple admin check using state to prevent multiple redirects
function AdminProtected() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/#/admin-login';
    } else {
      setIsAuthenticated(true);
    }
  }, []);
  
  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return <Outlet />;
}

export const router = createHashRouter([
  {
    path: '/',
    Component: PublicOnboarding,
    errorElement: <RouteError />
  },
  {
    path: '/universities',
    Component: UniversityInfo,
    errorElement: <RouteError />
  },
  {
    path: '/university/:id',
    Component: UniversityDetailRedesigned,
    errorElement: <RouteError />
  },
  {
    path: '/admin-login',
    Component: AdminLoginSimple,
    errorElement: <RouteError />
  },
  {
    path: '/login',
    Component: () => <Navigate to="/admin-login" replace />
  },
  {
    path: '/first-time-setup',
    Component: FirstTimeSetup,
    errorElement: <RouteError />
  },
  {
    path: '/student/tracking',
    Component: TrackingLookupSimple,
    errorElement: <RouteError />
  },
  // Student routes with Layout (same structure as admin)
  {
    path: '/student',
    Component: Layout,
    errorElement: <RouteError />,
    children: [
      {
        index: true,
        Component: () => <Navigate to="/student/dashboard" replace />
      },
      {
        path: 'dashboard',
        Component: withSuspense(StudentDashboard)
      },
      {
        path: 'home',
        Component: withSuspense(StudentHome)
      },
      {
        path: 'universities',
        Component: withSuspense(StudentUniversities)
      },
      {
        path: 'my-costs',
        Component: withSuspense(StudentOnboarding)
      },
      {
        path: 'my-progress',
        Component: withSuspense(ProgressTracker)
      },
      {
        path: 'feedback',
        Component: withSuspense(StudentFeedbackPage)
      },
      {
        path: 'university/:id',
        Component: UniversityDetailRedesigned
      }
    ]
  },
  // Admin routes
  {
    path: '/admin',
    Component: AdminProtected,
    errorElement: <RouteError />,
    children: [
      {
        path: '',
        Component: Layout,
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            Component: () => <Navigate to="/admin/dashboard" replace />
          },
          {
            path: 'dashboard',
            Component: withSuspense(AdminDashboard)
          },
          {
            path: 'universities',
            Component: withSuspense(UniversitiesListEnhancedRedesigned)
          },
          {
            path: 'university/:id',
            Component: withSuspense(UniversityDetailAdmin)
          },
          {
            path: 'students',
            Component: withSuspense(StudentMonitoring)
          },
          {
            path: 'registrations',
            Component: withSuspense(AdminRegistrations)
          },
          {
            path: 'audit',
            Component: withSuspense(AdminAuditTrail)
          },
          {
            path: 'templates',
            Component: withSuspense(AdminEmailTemplates)
          },
          {
            path: 'workflow',
            Component: withSuspense(AdminWorkflow)
          },
          {
            path: 'settings',
            Component: withSuspense(AdminSettings)
          },
          {
            path: 'bulk',
            Component: withSuspense(AdminBulkOperations)
          },
          {
            path: 'scholarships',
            Component: withSuspense(AdminScholarships)
          },
          {
            path: 'visa',
            Component: withSuspense(AdminVisaTracking)
          },
          {
            path: 'calendar',
            Component: withSuspense(AdminCalendar)
          },
          {
            path: 'feedback',
            Component: withSuspense(AdminFeedback)
          },
          {
            path: 'analytics',
            Component: withSuspense(AdminAnalyticsDashboard)
          },
          {
            path: 'users',
            Component: withSuspense(AdminUsers)
          },
          {
            path: 'roles',
            Component: withSuspense(AdminRoles)
          },
          {
            path: 'maintenance',
            Component: withSuspense(AdminMaintenance)
          },
          {
            path: 'media',
            Component: withSuspense(AdminMediaLibrary)
          },
          {
            path: 'exchange-rates',
            Component: withSuspense(AdminExchangeRates)
          }
        ]
      }
    ]
  },
  {
    path: '/403',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
          <p className="text-gray-600 mb-4">Không có quyền truy cập</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }
]);
