/**
 * API Service Tests
 * Tests for the API service layer
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

// Import after mocking
import { 
  paymentApi, 
  messageApi, 
  documentApi, 
  appointmentApi,
  notificationApi 
} from '../src/app/services/api';

describe('Payment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('should have all required methods', () => {
    expect(paymentApi.getAll).toBeDefined();
    expect(paymentApi.getById).toBeDefined();
    expect(paymentApi.create).toBeDefined();
    expect(paymentApi.update).toBeDefined();
    expect(paymentApi.delete).toBeDefined();
    expect(paymentApi.getSummary).toBeDefined();
  });
});

describe('Message API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all required methods', () => {
    expect(messageApi.getAll).toBeDefined();
    expect(messageApi.getById).toBeDefined();
    expect(messageApi.create).toBeDefined();
    expect(messageApi.delete).toBeDefined();
  });
});

describe('Document API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all required methods', () => {
    expect(documentApi.getAll).toBeDefined();
    expect(documentApi.getById).toBeDefined();
    expect(documentApi.create).toBeDefined();
    expect(documentApi.review).toBeDefined();
    expect(documentApi.delete).toBeDefined();
  });
});

describe('Appointment API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all required methods', () => {
    expect(appointmentApi.getAll).toBeDefined();
    expect(appointmentApi.getById).toBeDefined();
    expect(appointmentApi.create).toBeDefined();
    expect(appointmentApi.update).toBeDefined();
    expect(appointmentApi.delete).toBeDefined();
    expect(appointmentApi.updateStatus).toBeDefined();
  });
});

describe('Notification API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have all required methods', () => {
    expect(notificationApi.getAll).toBeDefined();
    expect(notificationApi.getById).toBeDefined();
    expect(notificationApi.create).toBeDefined();
    expect(notificationApi.markAsRead).toBeDefined();
    expect(notificationApi.markAllAsRead).toBeDefined();
    expect(notificationApi.delete).toBeDefined();
  });
});
