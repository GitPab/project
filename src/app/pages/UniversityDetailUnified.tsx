import React from 'react';
import { useAuth } from '../context/AuthContext';
import UniversityDetailRedesigned from './UniversityDetailRedesigned';
import UniversityDetailAdmin from './UniversityDetailAdmin';

/**
 * Unified University Detail Component
 * 
 * This wrapper component renders the appropriate view based on user role:
 * - Students see UniversityDetailRedesigned (student-focused UI)
 * - Admins see UniversityDetailAdmin (admin-focused UI with editing capabilities)
 * 
 * TODO: In a future refactor, these two components should be fully merged into one
 * with role-based conditional rendering within the component itself.
 */
export default function UniversityDetailUnified() {
  const { user } = useAuth();
  
  // Determine if user is admin based on role
  const isAdmin = user?.role === 'admin' || user?.role === 'admin_manager' || user?.role === 'content_editor';
  
  // Render appropriate component based on role
  if (isAdmin) {
    return <UniversityDetailAdmin />;
  }
  
  return <UniversityDetailRedesigned />;
}
