import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type UserRole = 'student' | 'admin';

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

const STORAGE_KEYS = {
  USER: 'auth_user',
  TOKEN: 'auth_token'
};

const MOCK_USERS: Array<AuthUser & { password: string }> = [
  {
    id: '1',
    email: 'admin@duhoccost.vn',
    password: 'admin123',
    name: 'Admin',
    phone: '+84-123-456-789',
    role: 'admin'
  },
  {
    id: '2',
    email: 'student@example.com',
    password: 'student123',
    name: 'Nguyễn Văn A',
    phone: '+84-987-654-321',
    role: 'student'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => 
    localStorage.getItem(STORAGE_KEYS.TOKEN)
  );

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (!foundUser) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    const { password: _, ...userWithoutPassword } = foundUser;
    const mockToken = `mock_token_${foundUser.id}_${Date.now()}`;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    
    setUser(userWithoutPassword);
    setToken(mockToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    setUser(null);
    setToken(null);
    window.location.href = '/';
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    const existingUser = MOCK_USERS.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }
    
    const newUser: AuthUser & { password: string } = {
      id: `student_${Date.now()}`,
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
      role: 'student'
    };
    
    MOCK_USERS.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    const mockToken = `mock_token_${newUser.id}_${Date.now()}`;
    
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
    localStorage.setItem(STORAGE_KEYS.TOKEN, mockToken);
    
    setUser(userWithoutPassword);
    setToken(mockToken);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
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
