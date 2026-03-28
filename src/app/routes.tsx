import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Register from './pages/Register';
import Login from './pages/Login';
import UniversityInfo from './pages/UniversityInfo';
import UniversityDetailRedesigned from './pages/UniversityDetailRedesigned';
import PublicOnboarding from './pages/PublicOnboarding';
import StudentHome from './pages/StudentHome';
import StudentUniversityList from './components/StudentUniversityList';
import RouteError from './components/RouteError';

// Lazy load admin pages for code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminAuditTrail = lazy(() => import('./pages/AdminAuditTrail'));
const AdminEmailTemplates = lazy(() => import('./pages/AdminEmailTemplates'));
const AdminWorkflow = lazy(() => import('./pages/AdminWorkflow'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const AdminBulkOperations = lazy(() => import('./pages/AdminBulkOperations'));
const AdminScholarships = lazy(() => import('./pages/AdminScholarships'));
const AdminVisaTracking = lazy(() => import('./pages/AdminVisaTracking'));
const AdminCalendar = lazy(() => import('./pages/AdminCalendar'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));
const AdminRoles = lazy(() => import('./pages/AdminRoles'));
const AdminAnalyticsDashboard = lazy(() => import('./pages/AdminAnalyticsDashboard'));
const AdminRegistrations = lazy(() => import('./pages/AdminRegistrations'));
const StudentMonitoring = lazy(() => import('./pages/StudentMonitoring'));
const UniversityDetailAdmin = lazy(() => import('./pages/UniversityDetailAdmin'));
const MyCosts = lazy(() => import('./pages/MyCosts'));
const ProgressTracker = lazy(() => import('./pages/ProgressTracker'));
const StudentOnboarding = lazy(() => import('./pages/StudentOnboarding'));
const StudentTracking = lazy(() => import('./pages/StudentTracking'));
const StudentLookup = lazy(() => import('./pages/StudentLookup'));
const StudentFeedback = lazy(() => import('./pages/StudentFeedback'));
const UniversitiesListEnhancedRedesigned = lazy(() => import('./components/UniversitiesListEnhancedRedesigned'));

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
function AdminProtected() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/403" replace />;
  return <Outlet />;
}

// Protected route wrapper for students
function StudentProtected() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
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
    path: '/login',
    Component: Login,
    errorElement: <RouteError />
  },
  {
    path: '/register',
    Component: Register,
    errorElement: <RouteError />
  },
  {
    path: '/student/lookup',
    Component: withSuspense(StudentLookup),
    errorElement: <RouteError />
  },
  {
    path: '/student/tracking/:code',
    Component: withSuspense(StudentTracking),
    errorElement: <RouteError />
  },
  {
    path: '/admin',
    Component: AdminProtected,
    errorElement: <RouteError />,
    children: [
      {
        path: '',
        Component: Layout,
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
            path: 'roles',
            Component: withSuspense(AdminRoles)
          }
        ]
      }
    ]
  },
  {
    path: '/student',
    Component: StudentProtected,
    errorElement: <RouteError />,
    children: [
      {
        path: '',
        Component: Layout,
        children: [
          {
            index: true,
            Component: () => <Navigate to="/student/home" replace />
          },
          {
            path: 'home',
            Component: StudentHome
          },
          {
            path: 'universities',
            Component: StudentUniversityList
          },
          {
            path: 'university/:id',
            Component: UniversityDetailRedesigned
          },
          {
            path: 'my-costs',
            Component: withSuspense(MyCosts)
          },
          {
            path: 'my-progress',
            Component: withSuspense(ProgressTracker)
          },
          {
            path: 'onboarding',
            Component: withSuspense(StudentOnboarding)
          },
          {
            path: 'feedback',
            Component: withSuspense(StudentFeedback)
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
