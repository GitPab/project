/**
 * Tracking Code Service
 * Handles generation, storage, and retrieval of tracking codes
 */

import { supabase } from '@/config/supabase';
import type { TrackingCode, TrackingCodePayload } from '@/types/tracking';

const ERROR_CHECKING_UNIQUENESS = 'Error checking code uniqueness';
const ERROR_SAVING_CODE = 'Error saving tracking code';
const ERROR_RETRIEVING_CODE = 'Error retrieving tracking code';
const ERROR_UPDATING_CODE = 'Error updating tracking code';
const ERROR_RETRIEVING_ALL_CODES = 'Error retrieving all tracking codes';
const ERROR_SEARCHING_CODES = 'Error searching tracking codes';

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
    const existing = supabase.getFromStorage(code);
    if (existing) {
      return false;
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_CHECKING_UNIQUENESS, error);
    }
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

    const storageFormat = convertToStorageFormat(trackingCode);
    supabase.saveToStorage(storageFormat as any);

    return trackingCode;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_SAVING_CODE, error);
    }
    return null;
  }
};

/**
 * Retrieve tracking code by code string
 */
export const getTrackingCode = async (code: string): Promise<TrackingCode | null> => {
  try {
    const stored = supabase.getFromStorage(code);
    if (stored) {
      return convertToTrackingCode(stored);
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_RETRIEVING_CODE, error);
    }
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
    return convertToTrackingCode(updated);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_UPDATING_CODE, error);
    }
    return null;
  }
};

/**
 * Get all tracking codes (admin only)
 */
export const getAllTrackingCodes = async (): Promise<TrackingCode[]> => {
  try {
    const codes = supabase.getAllCodesInStorage();
    return codes.map(convertToTrackingCode);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_RETRIEVING_ALL_CODES, error);
    }
    return [];
  }
};

/**
 * Search tracking codes by email (admin only)
 */
export const searchTrackingCodesByEmail = async (email: string): Promise<TrackingCode[]> => {
  try {
    const codes = supabase.getAllCodesInStorage();
    return codes
      .filter((code) => code.student_email.toLowerCase().includes(email.toLowerCase()))
      .map(convertToTrackingCode);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_SEARCHING_CODES, error);
    }
    return [];
  }
};

/**
 * Format tracking code for display
 */
export const formatTrackingCode = (code: string): string => {
  if (code.length === 22) {
    return `${code.substring(0, 5)}-${code.substring(5, 9)}-${code.substring(9, 11)}-${code.substring(11, 13)}-${code.substring(14)}`;
  }
  return code;
};
