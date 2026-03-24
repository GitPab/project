import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import Layout from './components/Layout';
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
    Component: Layout,
    errorElement: <RouteError />,
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
  },
  {
    path: '/student',
    Component: Layout,
    errorElement: <RouteError />,
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
]);
