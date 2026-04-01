import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getApiUrl, resetServerPort } from './portDetector';

let cachedApiUrl: string | null = null;

// Clear cache on load to ensure fresh detection
localStorage.removeItem('sacma_server_port');
cachedApiUrl = null;

async function getDynamicBaseUrl(): Promise<string> {
  if (!cachedApiUrl) {
    cachedApiUrl = await getApiUrl();
    console.log('[API] Using base URL:', cachedApiUrl);
  }
  return cachedApiUrl;
}

// Create axios instance with dynamic base URL
async function getApi() {
  const baseURL = await getDynamicBaseUrl();
  
  const apiInstance = axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  // Request interceptor
  apiInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
      console.log('[API] Token found:', !!token, 'Key:', token ? (localStorage.getItem('auth_token') ? 'auth_token' : 'adminToken') : 'none');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Sending with Authorization header');
      } else {
        console.log('[API] No token, sending without auth');
      }
      return config;
    },
    (error: AxiosError) => Promise.reject(error)
  );
  
  // Response interceptor
  apiInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/login';
      }
      // If connection error, reset and retry once
      if (!error.response && error.message?.includes('Network Error')) {
        console.log('[API] Network error, resetting port cache...');
        resetServerPort();
        cachedApiUrl = null;
      }
      return Promise.reject(error);
    }
  );
  
  return apiInstance;
}

// Helper for making API calls
async function apiCall(method: 'get' | 'post' | 'put' | 'patch' | 'delete', endpoint: string, data?: any, config?: any) {
  const api = await getApi();
  try {
    let response;
    switch (method) {
      case 'get':
        response = await api.get(endpoint, config);
        break;
      case 'post':
        response = await api.post(endpoint, data, config);
        break;
      case 'put':
        response = await api.put(endpoint, data, config);
        break;
      case 'patch':
        response = await api.patch(endpoint, data, config);
        break;
      case 'delete':
        response = await api.delete(endpoint, config);
        break;
    }
    return response;
  } catch (error: any) {
    // Retry once if connection error
    if (!error.response && error.message?.includes('Network Error')) {
      const api = await getApi();
      switch (method) {
        case 'get':
          return api.get(endpoint, config);
        case 'post':
          return api.post(endpoint, data, config);
        case 'put':
          return api.put(endpoint, data, config);
        case 'patch':
          return api.patch(endpoint, data, config);
        case 'delete':
          return api.delete(endpoint, config);
      }
    }
    throw error;
  }
}

export default {
  get: (url: string) => apiCall('get', url),
  post: (url: string, data?: any) => apiCall('post', url, data),
  put: (url: string, data?: any) => apiCall('put', url, data),
  patch: (url: string, data?: any) => apiCall('patch', url, data),
  delete: (url: string, config?: any) => apiCall('delete', url, undefined, config)
};

// Auth API helpers
export const authApi = {
  login: async (email: string, password: string) => {
    const api = await getApi();
    return api.post('/auth/login', { email, password });
  },
  
  register: async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: string;
  }) => {
    const api = await getApi();
    return api.post('/auth/register', { ...data, role: data.role || 'student' });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
  
  getCurrentUser: async () => {
    const api = await getApi();
    return api.get('/auth/me');
  }
};

// Universities API
export const universityApi = {
  getAll: async () => {
    const api = await getApi();
    return api.get('/universities');
  },
  getById: async (id: string) => {
    const api = await getApi();
    return api.get(`/universities/${id}`);
  },
  create: async (data: any) => {
    const api = await getApi();
    return api.post('/universities', data);
  },
  update: async (id: string, data: any) => {
    const api = await getApi();
    return api.put(`/universities/${id}`, data);
  },
  delete: async (id: string) => {
    const api = await getApi();
    return api.delete(`/universities/${id}`);
  }
};

// Registrations API
export const registrationApi = {
  getAll: async () => {
    const api = await getApi();
    return api.get('/registrations');
  },
  getByStudent: async () => {
    const api = await getApi();
    return api.get('/registrations/student');
  },
  create: async (data: any) => {
    const api = await getApi();
    return api.post('/registrations', data);
  },
  update: async (id: string, data: any) => {
    const api = await getApi();
    return api.put(`/registrations/${id}`, data);
  }
};

// Upload API - for images to Cloudflare R2
export const uploadApi = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const baseURL = await getDynamicBaseUrl();
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(`${baseURL}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }
    
    const data = await response.json();
    return data.url;
  },
  
  deleteImage: async (url: string) => {
    const api = await getApi();
    return api.delete('/upload', { data: { url } });
  }
};
