/**
 * User and profile types
 */

export interface User {
  email: string;
  role: 'admin' | 'student';
  name: string;
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
