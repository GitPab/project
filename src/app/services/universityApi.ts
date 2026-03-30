import { University } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============================================
// UNIVERSITY API - PostgreSQL Backend
// ============================================

export const fetchUniversitiesFromAPI = async (): Promise<University[]> => {
  const response = await fetch(`${API_URL}/api/universities`);
  if (!response.ok) {
    throw new Error('Failed to fetch universities');
  }
  return response.json();
};

export const fetchUniversityByIdFromAPI = async (id: string): Promise<University | null> => {
  const response = await fetch(`${API_URL}/api/universities/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch university');
  }
  return response.json();
};

export const createUniversityInAPI = async (data: Partial<University>): Promise<University> => {
  const response = await fetch(`${API_URL}/api/universities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create university');
  }
  return response.json();
};

export const updateUniversityInAPI = async (id: string, data: Partial<University>): Promise<University> => {
  const response = await fetch(`${API_URL}/api/universities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update university');
  }
  return response.json();
};

export const deleteUniversityFromAPI = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/universities/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete university');
  }
};

// ============================================
// BULK OPERATIONS
// ============================================

export const bulkCreateUniversitiesInAPI = async (universities: Partial<University>[]): Promise<University[]> => {
  const response = await fetch(`${API_URL}/api/universities/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ universities }),
  });
  if (!response.ok) {
    throw new Error('Failed to bulk create universities');
  }
  return response.json();
};
