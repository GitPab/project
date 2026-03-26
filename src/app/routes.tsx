import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate, Outlet } from 'react-router';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UniversityInfo from './pages/UniversityInfo';
import AdminRegistrations from './pages/AdminRegistrations';
import StudentMonitoring from './pages/StudentMonitoring';
import StudentHome from './pages/StudentHome';
import UniversityDetail from './pages/UniversityDetail';
import UniversityDetailRedesigned from './pages/UniversityDetailRedesigned';
import UniversityDetailAdmin from './pages/UniversityDetailAdmin';
import MyCosts from './pages/MyCosts';
import ProgressTracker from './pages/ProgressTracker';
import StudentOnboarding from './pages/StudentOnboarding';
import PublicOnboarding from './pages/PublicOnboarding';
import StudentTracking from './pages/StudentTracking';
import StudentLookup from './pages/StudentLookup';
import UniversitiesListEnhancedRedesigned from './components/UniversitiesListEnhancedRedesigned';
import StudentUniversityList from './components/StudentUniversityList';
import RouteError from './components/RouteError';

// Protected route wrapper for admin
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
    Component: StudentLookup,
    errorElement: <RouteError />
  },
  {
    path: '/student/tracking/:code',
    Component: StudentTracking,
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
            Component: AdminDashboard
          },
          {
            path: 'universities',
            Component: UniversitiesListEnhancedRedesigned
          },
          {
            path: 'university/:id',
            Component: UniversityDetailAdmin
          },
          {
            path: 'students',
            Component: StudentMonitoring
          },
          {
            path: 'registrations',
            Component: AdminRegistrations
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
            Component: MyCosts
          },
          {
            path: 'my-progress',
            Component: ProgressTracker
          },
          {
            path: 'onboarding',
            Component: StudentOnboarding
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
