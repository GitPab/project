/**
 * User and profile types
 */

export interface User {
  email: string;
  role: 'admin' | 'student';
  name: string;
  // Student-specific fields (optional, set after onboarding)
  displayName?: string;  // Full name to display (e.g., "Nguyễn Văn A")
  phone?: string;         // Student phone number
  trackingCode?: string;  // Tracking code (e.g., "SACMA-20260313-ABC123")
}

export interface PaymentHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface StudentProfile {
  email: string;
  name: string;
  phone: string;
  photoUrl: string;
  registeredUniversities: string[];
  totalPersonalCost: number;
  paymentHistory: PaymentHistory[];
}

export interface StudentOnboardingData {
  id: string;
  name: string;
  phone: string;
  email: string;
  desiredUniversity: string;
  visaSystem: string;
  topikLevel?: string;
  ieltsScore?: string;
  initialTotalCost: number;
  notes?: string;
  submittedAt: string;
  status: 'pending' | 'in-review' | 'approved' | 'contacted';
}
