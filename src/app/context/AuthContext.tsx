import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { initDatabase, saveUser, getUserByEmail, getAllUsers } from '../services/sqliteDatabase';

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

// Default mock users - will be seeded to database
const DEFAULT_USERS: Array<AuthUser & { password: string }> = [
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [dbInitialized, setDbInitialized] = useState(false);
  const dbInitRef = useRef(false);

  // Initialize database and seed default users
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        
        // Seed default users if none exist
        const existingUsers = getAllUsers();
        if (existingUsers.length === 0) {
          DEFAULT_USERS.forEach(u => {
            saveUser({
              id: u.id,
              email: u.email,
              name: u.name,
              role: u.role,
              password_hash: u.password,
              phone: u.phone
            });
          });
        }
        
        dbInitRef.current = true;
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth database:', error);
      }
    };
    
    init();
  }, []);

  const waitForDb = async (timeout = 10000): Promise<boolean> => {
    const start = Date.now();
    while (!dbInitRef.current) {
      if (Date.now() - start > timeout) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return true;
  };

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // Wait for database to be initialized
    const isReady = await waitForDb();
    if (!isReady) {
      throw new Error('Database not initialized - please refresh the page and try again');
    }
    
    // Get user from database
    const dbUser = getUserByEmail(email);
    
    if (!dbUser || dbUser.password_hash !== password) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    const authUser: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone,
      role: dbUser.role
    };
    
    const mockToken = `mock_token_${dbUser.id}_${Date.now()}`;
    
    setUser(authUser);
    setToken(mockToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    window.location.href = '/';
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<void> => {
    // Wait for database to be initialized
    const isReady = await waitForDb();
    if (!isReady) {
      throw new Error('Database not initialized - please refresh the page and try again');
    }
    
    // Check if email exists
    const existingUser = getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }
    
    const newId = `student_${Date.now()}`;
    
    // Save to database
    saveUser({
      id: newId,
      email: userData.email,
      name: userData.name,
      role: 'student',
      password_hash: userData.password,
      phone: userData.phone
    });
    
    const authUser: AuthUser = {
      id: newId,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: 'student'
    };
    
    const mockToken = `mock_token_${newId}_${Date.now()}`;
    
    setUser(authUser);
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
