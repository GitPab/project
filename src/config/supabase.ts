/**
 * Supabase Configuration
 *
 * Setup Instructions:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your ANON_KEY and PROJECT_URL
 * 3. Create table: tracking_codes (see schema below)
 * 4. Set environment variables in .env.local:
 *    VITE_SUPABASE_URL=https://xxxxx.supabase.co
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * Database Schema (SQL):
 *
 * CREATE TABLE tracking_codes (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   code VARCHAR(255) UNIQUE NOT NULL,
 *   student_email VARCHAR(255),
 *   student_name VARCHAR(255),
 *   student_phone VARCHAR(20),
 *   desired_university_id VARCHAR(255),
 *   desired_university_name VARCHAR(255),
 *   visa_system VARCHAR(50),
 *   topik_level VARCHAR(10),
 *   ielts_score VARCHAR(10),
 *   initial_total_cost_vnd BIGINT,
 *   status VARCHAR(50) DEFAULT 'pending',
 *   notes TEXT,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 *
 * CREATE INDEX idx_tracking_code ON tracking_codes(code);
 * CREATE INDEX idx_student_email ON tracking_codes(student_email);
 *
 * Row Level Security (RLS) - Enable and create policies:
 * - Everyone can INSERT
 * - Everyone can SELECT if code is known
 * - Only ADMIN can UPDATE/DELETE
 */

// For production: import { createClient } from '@supabase/supabase-js'
// For now: Mock implementation that uses localStorage fallback

interface TrackingCodeRecord {
  id: string;
  code: string;
  student_email: string;
  student_name: string;
  student_phone: string;
  desired_university_id: string;
  desired_university_name: string;
  visa_system: string;
  topik_level?: string;
  ielts_score?: string;
  initial_total_cost_vnd: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Mock Supabase client for development
// In production, replace with real Supabase client
const mockSupabaseClient = {
  isConfigured: false,

  checkConfiguration: () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(url && key);
  },

  // Fallback: localStorage-based tracking codes (for development)
  getStorageKey: (code: string) => `tracking_code_${code}`,

  getAllCodesInStorage: (): TrackingCodeRecord[] => {
    if (typeof window === 'undefined') return [];
    const codes: TrackingCodeRecord[] = [];
    for (const [key, value] of Object.entries(localStorage)) {
      if (key.startsWith('tracking_code_')) {
        try {
          const code = JSON.parse(value);
          codes.push(code);
        } catch (e) {
          console.error('Failed to parse tracking code from localStorage:', key);
        }
      }
    }
    return codes;
  },

  saveToStorage: (code: TrackingCodeRecord) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(mockSupabaseClient.getStorageKey(code.code), JSON.stringify(code));
  },

  getFromStorage: (code: string): TrackingCodeRecord | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(mockSupabaseClient.getStorageKey(code));
    return stored ? JSON.parse(stored) : null;
  },

  deleteFromStorage: (code: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(mockSupabaseClient.getStorageKey(code));
  },
};

/**
 * Initialize Supabase client
 * Currently uses localStorage as fallback
 * Replace with actual Supabase client when configured
 */
export const supabase = mockSupabaseClient;

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = (): boolean => {
  return supabase.checkConfiguration();
};

/**
 * Note: When Supabase is configured, replace this with:
 * import { createClient } from '@supabase/supabase-js';
 *
 * export const supabase = createClient(
 *   import.meta.env.VITE_SUPABASE_URL!,
 *   import.meta.env.VITE_SUPABASE_ANON_KEY!
 * );
 */
