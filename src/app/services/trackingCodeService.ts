/**
 * Tracking Code Service
 * Handles generation, storage, and retrieval of tracking codes
 */

import { supabase } from '@/config/supabase';
import type { TrackingCode, TrackingCodePayload } from '@/types/tracking';

/**
 * Convert snake_case storage format to camelCase TrackingCode interface
 */
const convertToTrackingCode = (data: Record<string, any>): TrackingCode => {
  return {
    id: data.id,
    code: data.code,
    studentEmail: data.student_email || data.studentEmail,
    studentName: data.student_name || data.studentName,
    studentPhone: data.student_phone || data.studentPhone,
    desiredUniversityId: data.desired_university_id || data.desiredUniversityId,
    desiredUniversityName: data.desired_university_name || data.desiredUniversityName,
    visaSystem: data.visa_system || data.visaSystem,
    topikLevel: data.topik_level || data.topikLevel,
    ieltsScore: data.ielts_score || data.ieltsScore,
    initialTotalCostVnd: data.initial_total_cost_vnd || data.initialTotalCostVnd,
    status: data.status as any,
    notes: data.notes,
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };
};

/**
 * Convert camelCase TrackingCode to snake_case for storage
 */
const convertToStorageFormat = (code: TrackingCode): Record<string, any> => {
  return {
    id: code.id,
    code: code.code,
    student_email: code.studentEmail,
    student_name: code.studentName,
    student_phone: code.studentPhone,
    desired_university_id: code.desiredUniversityId,
    desired_university_name: code.desiredUniversityName,
    visa_system: code.visaSystem,
    topik_level: code.topikLevel,
    ielts_score: code.ieltsScore,
    initial_total_cost_vnd: code.initialTotalCostVnd,
    status: code.status,
    notes: code.notes,
    created_at: code.createdAt,
    updated_at: code.updatedAt,
  };
};

/**
 * Generate a unique tracking code
 * Format: SACMA-YYYYMMDD-XXXXXX
 */
export const generateTrackingCode = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  // Generate 6 random alphanumeric characters
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `SACMA-${yyyy}${mm}${dd}-${randomPart}`;
};

/**
 * Check if a tracking code is unique (doesn't exist yet)
 */
export const isCodeUnique = async (code: string): Promise<boolean> => {
  try {
    // Check localStorage first
    const existing = supabase.getFromStorage(code);
    if (existing) {
      return false;
    }

    // If Supabase is configured, check database
    // This will be implemented when Supabase is set up
    return true;
  } catch (error) {
    console.error('Error checking code uniqueness:', error);
    return false;
  }
};

/**
 * Generate a unique tracking code (with uniqueness check)
 */
export const generateUniqueTrackingCode = async (): Promise<string> => {
  let code: string;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    code = generateTrackingCode();
    const isUnique = await isCodeUnique(code);
    if (isUnique) {
      return code;
    }
    attempts++;
  } while (attempts < maxAttempts);

  throw new Error('Failed to generate unique tracking code after 50 attempts');
};

/**
 * Save tracking code to database
 */
export const saveTrackingCode = async (payload: TrackingCodePayload): Promise<TrackingCode | null> => {
  try {
    const trackingCode: TrackingCode = {
      id: crypto.randomUUID(),
      code: payload.code,
      studentEmail: payload.studentEmail,
      studentName: payload.studentName,
      studentPhone: payload.studentPhone,
      desiredUniversityId: payload.desiredUniversityId,
      desiredUniversityName: payload.desiredUniversityName,
      visaSystem: payload.visaSystem,
      topikLevel: payload.topikLevel,
      ieltsScore: payload.ieltsScore,
      initialTotalCostVnd: payload.initialTotalCostVnd,
      status: payload.status || 'pending',
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Convert to storage format and save
    const storageFormat = convertToStorageFormat(trackingCode);
    supabase.saveToStorage(storageFormat as any);

    // TODO: When Supabase is configured, use:
    // const { data, error } = await supabase
    //   .from('tracking_codes')
    //   .insert([storageFormat]);
    // if (error) throw error;

    return trackingCode;
  } catch (error) {
    console.error('Error saving tracking code:', error);
    return null;
  }
};

/**
 * Retrieve tracking code by code string
 */
export const getTrackingCode = async (code: string): Promise<TrackingCode | null> => {
  try {
    // Check localStorage first
    const stored = supabase.getFromStorage(code);
    if (stored) {
      return convertToTrackingCode(stored);
    }

    // TODO: When Supabase is configured, use:
    // const { data, error } = await supabase
    //   .from('tracking_codes')
    //   .select('*')
    //   .eq('code', code)
    //   .single();
    // if (error) throw error;
    // return convertToTrackingCode(data);

    return null;
  } catch (error) {
    console.error('Error retrieving tracking code:', error);
    return null;
  }
};

/**
 * Update tracking code status (admin only)
 */
export const updateTrackingCodeStatus = async (
  code: string,
  status: 'pending' | 'in-review' | 'approved' | 'contacted'
): Promise<TrackingCode | null> => {
  try {
    const existing = supabase.getFromStorage(code);
    if (!existing) {
      return null;
    }

    const updated = {
      ...existing,
      status,
      updated_at: new Date().toISOString(),
    };

    supabase.saveToStorage(updated);

    // TODO: When Supabase is configured, use:
    // const { data, error } = await supabase
    //   .from('tracking_codes')
    //   .update({ status, updated_at: new Date().toISOString() })
    //   .eq('code', code);
    // if (error) throw error;

    return convertToTrackingCode(updated);
  } catch (error) {
    console.error('Error updating tracking code:', error);
    return null;
  }
};

/**
 * Get all tracking codes (admin only)
 */
export const getAllTrackingCodes = async (): Promise<TrackingCode[]> => {
  try {
    // Get from localStorage
    const codes = supabase.getAllCodesInStorage();

    // TODO: When Supabase is configured, use:
    // const { data, error } = await supabase
    //   .from('tracking_codes')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // if (error) throw error;
    // return data.map(convertToTrackingCode);

    return codes.map(convertToTrackingCode);
  } catch (error) {
    console.error('Error retrieving all tracking codes:', error);
    return [];
  }
};

/**
 * Search tracking codes by email (admin only)
 */
export const searchTrackingCodesByEmail = async (email: string): Promise<TrackingCode[]> => {
  try {
    const codes = supabase.getAllCodesInStorage();
    const filtered = codes
      .filter((code) => code.student_email.toLowerCase().includes(email.toLowerCase()))
      .map(convertToTrackingCode);

    // TODO: When Supabase is configured, use:
    // const { data, error } = await supabase
    //   .from('tracking_codes')
    //   .select('*')
    //   .ilike('student_email', `%${email}%`);
    // if (error) throw error;
    // return data.map(convertToTrackingCode);

    return filtered;
  } catch (error) {
    console.error('Error searching tracking codes:', error);
    return [];
  }
};

/**
 * Format tracking code for display
 */
export const formatTrackingCode = (code: string): string => {
  // Format: SACMA-YYYYMMDD-XXXXXX -> SACMA-YYYY-MM-DD-XXXXXX (for readability)
  if (code.length === 22) {
    // SACMA-YYYYMMDD-XXXXXX
    return `${code.substring(0, 5)}-${code.substring(5, 9)}-${code.substring(9, 11)}-${code.substring(11, 13)}-${code.substring(14)}`;
  }
  return code;
};
