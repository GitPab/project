/**
 * Tracking Code Service
 * Handles generation, storage, and retrieval of tracking codes
 * Now uses SQLite database for persistence
 */

import {
  saveTrackingCodeToDb,
  getTrackingCodeFromDb,
  getAllTrackingCodesFromDb,
  searchTrackingCodesByEmailFromDb,
  updateTrackingCodeStatusInDb,
  deleteTrackingCodeFromDb,
} from './sqliteDatabase';
import type { TrackingCode, TrackingCodePayload } from '@/types/tracking';

const ERROR_CHECKING_UNIQUENESS = 'Error checking code uniqueness';
const ERROR_SAVING_CODE = 'Error saving tracking code';
const ERROR_RETRIEVING_CODE = 'Error retrieving tracking code';
const ERROR_UPDATING_CODE = 'Error updating tracking code';
const ERROR_RETRIEVING_ALL_CODES = 'Error retrieving all tracking codes';
const ERROR_SEARCHING_CODES = 'Error searching tracking codes';

/**
 * Convert database format (snake_case) to TrackingCode interface (camelCase)
 */
const convertFromDbFormat = (data: Record<string, any>): TrackingCode => {
  return {
    id: data.id,
    code: data.code,
    studentEmail: data.student_email,
    studentName: data.student_name,
    studentPhone: data.student_phone,
    desiredUniversityId: data.desired_university_id,
    desiredUniversityName: data.desired_university_name,
    visaSystem: data.visa_system,
    topikLevel: data.topik_level,
    ieltsScore: data.ielts_score,
    initialTotalCostVnd: data.initial_total_cost_vnd,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
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
    const existing = await getTrackingCodeFromDb(code);
    return !existing;
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

    saveTrackingCodeToDb({
      id: trackingCode.id,
      code: trackingCode.code,
      studentEmail: trackingCode.studentEmail,
      studentName: trackingCode.studentName,
      studentPhone: trackingCode.studentPhone,
      desiredUniversityId: trackingCode.desiredUniversityId,
      desiredUniversityName: trackingCode.desiredUniversityName,
      visaSystem: trackingCode.visaSystem,
      topikLevel: trackingCode.topikLevel,
      ieltsScore: trackingCode.ieltsScore,
      initialTotalCostVnd: trackingCode.initialTotalCostVnd,
      status: trackingCode.status,
      notes: trackingCode.notes,
    });

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
    const stored = await getTrackingCodeFromDb(code);
    if (stored) {
      return convertFromDbFormat(stored);
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
    const existing = await getTrackingCodeFromDb(code);
    if (!existing) {
      return null;
    }

    updateTrackingCodeStatusInDb(code, status);
    
    // Return updated tracking code
    const updated = await getTrackingCodeFromDb(code);
    return updated ? convertFromDbFormat(updated) : null;
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
    const codes = await getAllTrackingCodesFromDb();
    return codes.map(convertFromDbFormat);
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
    const codes = await searchTrackingCodesByEmailFromDb(email);
    return codes.map(convertFromDbFormat);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(ERROR_SEARCHING_CODES, error);
    }
    return [];
  }
};

/**
 * Delete tracking code by ID (admin only)
 */
export const deleteTrackingCode = async (code: string): Promise<boolean> => {
  try {
    const existing = await getTrackingCodeFromDb(code);
    if (!existing) {
      return false;
    }
    deleteTrackingCodeFromDb(code);
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting tracking code:', error);
    }
    return false;
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
