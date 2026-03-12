/**
 * Tracking Code Types
 * Types for student tracking code system
 */

export interface TrackingCode {
  id: string; // UUID from Supabase
  code: string; // Format: SACMA-YYYYMMDD-XXXXXX
  studentEmail: string;
  studentName: string;
  studentPhone: string;
  desiredUniversityId: string;
  desiredUniversityName: string;
  visaSystem: string; // D4-1, D2-2, D2-3, etc
  topikLevel?: string; // 0-6
  ieltsScore?: string;
  initialTotalCostVnd: number; // Stored in VND
  status: 'pending' | 'in-review' | 'approved' | 'contacted';
  notes?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface TrackingCodePayload {
  code: string;
  studentEmail: string;
  studentName: string;
  studentPhone: string;
  desiredUniversityId: string;
  desiredUniversityName: string;
  visaSystem: string;
  topikLevel?: string;
  ieltsScore?: string;
  initialTotalCostVnd: number;
  status?: 'pending' | 'in-review' | 'approved' | 'contacted';
  notes?: string;
}

export interface TrackingLookupResult {
  code: string;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  desiredUniversity: {
    id: string;
    name: string;
  };
  visaSystem: string;
  topikLevel?: string;
  totalCostVnd: number;
  applicationStatus: 'pending' | 'in-review' | 'approved' | 'contacted';
  submittedDate: string;
  notes?: string;
}
