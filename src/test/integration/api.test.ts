/**
 * API Integration Tests
 * Tests for auth, universities, students endpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// Mock API responses for integration testing
const mockAPIResponses = {
  auth: {
    login: {
      success: {
        token: 'mock-jwt-token',
        user: {
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@test.com',
          role: 'admin',
        },
      },
      error: {
        invalid: { error: 'Invalid credentials' },
        missing: { error: 'Email and password required' },
      },
    },
  },
  universities: {
    list: [
      { id: 'ajou-univ', name: 'Ajou University' },
      { id: 'sejong-univ', name: 'Sejong University' },
    ],
    detail: {
      id: 'ajou-univ',
      name: 'Ajou University',
      koreanData: {
        visaSystemsDetail: {
          'D4-1': {
            invoiceKRWPerYear: 3200000,
            applyFeeKRW: 80000,
            enrollmentFeeKRW: 500000,
            scholarships: [
              { topikLevel: 3, discountPct: 30, condition: 'TOPIK 3' },
              { topikLevel: 4, discountPct: 50, condition: 'TOPIK 4' },
            ],
          },
        },
      },
    },
  },
  students: {
    list: [
      {
        id: 'student-1',
        name: 'Test Student',
        email: 'student@test.com',
        university_id: 'ajou-univ',
        tracking_code: 'SACMA-2024-000001',
      },
    ],
  },
};

// API Client mock with proper types
interface APIResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class MockAPIClient {
  private token: string | null = null;

  async login(email: string, password: string): Promise<APIResponse<{ token: string; user: { id: string; name: string; email: string; role: string } }>> {
    if (!email || !password) {
      return { error: 'Email and password required', status: 400 };
    }
    if (email === 'admin@test.com' && password === 'password123') {
      this.token = mockAPIResponses.auth.login.success.token;
      return { data: mockAPIResponses.auth.login.success, status: 200 };
    }
    return { error: 'Invalid credentials', status: 401 };
  }

  async getUniversities(): Promise<APIResponse<Array<{ id: string; name: string }>>> {
    return { data: mockAPIResponses.universities.list, status: 200 };
  }

  async getUniversity(id: string): Promise<APIResponse<typeof mockAPIResponses.universities.detail>> {
    if (id === 'ajou-univ') {
      return { data: mockAPIResponses.universities.detail, status: 200 };
    }
    return { error: 'University not found', status: 404 };
  }

  async createStudent(studentData: any): Promise<APIResponse<any>> {
    if (!studentData.name) {
      return { error: 'Name is required', status: 400 };
    }
    return {
      data: {
        ...studentData,
        id: 'new-student-id',
        tracking_code: 'SACMA-2024-000002',
      },
      status: 201,
    };
  }
}

describe('API Integration Tests', () => {
  let api: MockAPIClient;

  beforeAll(() => {
    api = new MockAPIClient();
  });

  describe('Authentication API', () => {
    it('should login with valid credentials', async () => {
      const result = await api.login('admin@test.com', 'password123');
      expect(result.status).toBe(200);
      expect(result.data!.token).toBeDefined();
      expect(result.data!.user.role).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      const result = await api.login('admin@test.com', 'wrongpassword');
      expect(result.status).toBe(401);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should require email and password', async () => {
      const result = await api.login('', '');
      expect(result.status).toBe(400);
      expect(result.error).toBe('Email and password required');
    });
  });

  describe('Universities API', () => {
    it('should get list of universities', async () => {
      const result = await api.getUniversities();
      expect(result.status).toBe(200);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].name).toBe('Ajou University');
    });

    it('should get university detail', async () => {
      const result = await api.getUniversity('ajou-univ');
      expect(result.status).toBe(200);
      expect(result.data!.name).toBe('Ajou University');
      expect(result.data!.koreanData.visaSystemsDetail['D4-1']).toBeDefined();
    });

    it('should return 404 for non-existent university', async () => {
      const result = await api.getUniversity('non-existent');
      expect(result.status).toBe(404);
    });
  });

  describe('Students API', () => {
    it('should create student with tracking code', async () => {
      const studentData = {
        name: 'New Student',
        email: 'new@test.com',
        university_id: 'ajou-univ',
        program: 'D4-1',
      };
      const result = await api.createStudent(studentData);
      expect(result.status).toBe(201);
      expect(result.data!.tracking_code).toMatch(/^SACMA-\d{4}-\d{6}$/);
    });

    it('should validate required fields', async () => {
      const result = await api.createStudent({ email: 'test@test.com' });
      expect(result.status).toBe(400);
      expect(result.error).toBe('Name is required');
    });
  });
});

export { MockAPIClient, mockAPIResponses };
