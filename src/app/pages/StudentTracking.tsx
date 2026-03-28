import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';

/**
 * StudentTracking - Redirects to ProgressTracker with tracking code
 * The progress tracker now shows both the tracking info AND the 8-stage pipeline
 * Stage 1 (Đăng ký) is automatically marked as completed when tracking code exists
 */
export default function StudentTracking() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      // Redirect to Tiến trình (ProgressTracker) with tracking code
      // This combines Theo dõi hồ sơ + Tiến trình into one view
      navigate(`/student/my-progress?code=${encodeURIComponent(code)}`);
    } else {
      navigate('/student');
    }
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-slate-600">Đang chuyển đến tiến trình...</p>
      </div>
    </div>
  );
}
