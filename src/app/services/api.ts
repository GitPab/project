import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add auth token to every request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 unauthorized
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API helpers
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) => api.post('/auth/register', { ...data, role: data.role || 'student' }),
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
  
  getCurrentUser: () => api.get('/auth/me')
};

// Universities API
export const universityApi = {
  getAll: () => api.get('/universities'),
  getById: (id: string) => api.get(`/universities/${id}`),
  create: (data: any) => api.post('/universities', data),
  update: (id: string, data: any) => api.put(`/universities/${id}`, data),
  delete: (id: string) => api.delete(`/universities/${id}`)
};

// Registrations API
export const registrationApi = {
  getAll: () => api.get('/registrations'),
  getByStudent: () => api.get('/registrations/student'),
  create: (data: any) => api.post('/registrations', data),
  update: (id: string, data: any) => api.put(`/registrations/${id}`, data)
};
