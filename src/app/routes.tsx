import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import Layout from './components/Layout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UniversitiesList from './pages/UniversitiesList';
import AdminRegistrations from './pages/AdminRegistrations';
import StudentMonitoring from './pages/StudentMonitoring';
import StudentHome from './pages/StudentHome';
import UniversityDetail from './pages/UniversityDetail';
import MyCosts from './pages/MyCosts';
import ProgressTracker from './pages/ProgressTracker';
import StudentOnboarding from './pages/StudentOnboarding';
import PublicOnboarding from './pages/PublicOnboarding';
import StudentTracking from './pages/StudentTracking';
import StudentLookup from './pages/StudentLookup';
import RouteError from './components/RouteError';

export const router = createHashRouter([
  {
    path: '/',
    Component: PublicOnboarding,
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
        Component: UniversitiesList
      },
      {
        path: 'university/:id',
        Component: UniversityDetail
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
        Component: UniversitiesList
      },
      {
        path: 'university/:id',
        Component: UniversityDetail
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
