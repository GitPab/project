import { useState, useCallback, useEffect } from 'react';

export interface University {
  id: string;
  name: string;
  koreanName?: string;
  country: string;
  ranking?: number;
  topTier?: 'Top1' | 'Top2' | 'Top3';
  region?: string;
  address?: string;
  description?: string;
  majors: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseUniversitiesOptions {
  autoFetch?: boolean;
}

export function useUniversities(options: UseUniversitiesOptions = {}) {
  const { autoFetch = true } = options;
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUniversities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/universities');
      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }
      const data = await response.json();
      setUniversities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUniversity = useCallback(async (universityData: Omit<University, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/universities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(universityData),
      });
      if (!response.ok) {
        throw new Error('Failed to create university');
      }
      const newUniversity = await response.json();
      setUniversities((prev) => [...prev, newUniversity]);
      return newUniversity;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateUniversity = useCallback(async (id: string, updates: Partial<University>) => {
    try {
      const response = await fetch(`/api/universities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update university');
      }
      const updatedUniversity = await response.json();
      setUniversities((prev) =>
        prev.map((u) => (u.id === id ? updatedUniversity : u))
      );
      return updatedUniversity;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteUniversity = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/universities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete university');
      }
      setUniversities((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchUniversities();
    }
  }, [autoFetch, fetchUniversities]);

  return {
    universities,
    isLoading,
    error,
    fetchUniversities,
    createUniversity,
    updateUniversity,
    deleteUniversity,
  };
}
