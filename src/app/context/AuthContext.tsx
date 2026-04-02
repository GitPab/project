import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getApiUrl, resetServerPort } from '../services/portDetector';

let cachedApiUrl: string | null = null;

// Clear cache on page load to ensure fresh port detection
localStorage.removeItem('sacma_server_port');
cachedApiUrl = null;
console.log('[AuthContext] Cleared port cache on load');

async function getDynamicApiUrl(): Promise<string> {
  if (!cachedApiUrl) {
    cachedApiUrl = await getApiUrl();
  }
  return cachedApiUrl;
}

// Helper for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const API_URL = await getDynamicApiUrl();
  const url = `${API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {})
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error: any) {
    // If connection fails, reset cache and try to redetect port
    if (error.message?.includes('fetch') || error.message?.includes('Failed')) {
      console.log('[AuthContext] Connection failed, redetecting server port...');
      resetServerPort();
      cachedApiUrl = null;
      // Try once more with fresh detection
      const newUrl = await getDynamicApiUrl();
      if (newUrl !== API_URL) {
        console.log('[AuthContext] Retrying with new port:', newUrl);
        const response = await fetch(`${newUrl}${endpoint}`, { ...options, headers });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(error.error || `HTTP ${response.status}`);
        }
        return response.json();
      }
    }
    throw error;
  }
}

export type UserRole = 'student' | 'admin' | 'super_admin' | 'admin_manager' | 'content_editor' | 'finance_admin' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restore user from localStorage on init - try both keys
    const stored = localStorage.getItem('auth_user') || localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    // Restore token from localStorage on init - try both keys
    return localStorage.getItem('auth_token') || localStorage.getItem('adminToken');
  });
  const [isLoading, setIsLoading] = useState(false);

  const notifyAuthChanged = () => {
    window.dispatchEvent(new Event('auth-changed'));
  };

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      // Accept both { success, user, token } and { user, token } response shapes
      if (response.success === false) {
        throw new Error(response.error || 'Đăng nhập thất bại');
      }
      
      const { user: authUser, token: authToken } = response;
      if (!authUser || !authToken) {
        throw new Error(response.error || 'Đăng nhập thất bại');
      }
      
      // Persist to localStorage
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      localStorage.setItem('auth_token', authToken);
      
      setUser(authUser);
      setToken(authToken);
      notifyAuthChanged();
    } catch (error: any) {
      throw new Error(error.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    // Clear ALL localStorage keys (both old and new naming)
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
    
    setUser(null);
    setToken(null);
    notifyAuthChanged();
    window.location.href = '/';
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      // Accept both { success, user, token } and { user, token } response shapes
      if (response.success === false) {
        throw new Error(response.error || 'Đăng ký thất bại');
      }
      
      const { user: authUser, token: authToken } = response;
      if (!authUser || !authToken) {
        throw new Error(response.error || 'Đăng ký thất bại');
      }
      
      // Persist to localStorage
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      localStorage.setItem('auth_token', authToken);
      
      setUser(authUser);
      setToken(authToken);
      notifyAuthChanged();
    } catch (error: any) {
      throw new Error(error.message || 'Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const adminRoles: UserRole[] = ['admin', 'super_admin', 'admin_manager', 'content_editor', 'finance_admin', 'viewer'];

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: !!user?.role && adminRoles.includes(user.role),
    isStudent: user?.role === 'student',
    isLoading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
