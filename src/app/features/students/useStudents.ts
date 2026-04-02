import { useState, useCallback, useEffect } from 'react';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'pending';
  university?: string;
  program?: string;
  createdAt: string;
}

interface UseStudentsOptions {
  autoFetch?: boolean;
}

export function useStudents(options: UseStudentsOptions = {}) {
  const { autoFetch = true } = options;
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace with actual API call
      const response = await fetch('/api/students');
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createStudent = useCallback(async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
      });
      if (!response.ok) {
        throw new Error('Failed to create student');
      }
      const newStudent = await response.json();
      setStudents((prev) => [...prev, newStudent]);
      return newStudent;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateStudent = useCallback(async (id: string, updates: Partial<Student>) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update student');
      }
      const updatedStudent = await response.json();
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? updatedStudent : s))
      );
      return updatedStudent;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteStudent = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchStudents();
    }
  }, [autoFetch, fetchStudents]);

  return {
    students,
    isLoading,
    error,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
}
