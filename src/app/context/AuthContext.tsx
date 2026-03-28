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

// Seed complete test profile for student
async function seedTestProfile() {
  try {
    const { saveTrackingCodeToDb, saveStudentProgress, savePayment, saveRegistration } = await import('../services/sqliteDatabase');
    
    // Check if tracking code already exists
    const { getTrackingCodeFromDb } = await import('../services/sqliteDatabase');
    const existingCode = await getTrackingCodeFromDb('SACMA-20250328-TEST01');
    if (existingCode) {
      console.log('[AuthContext] Test profile already exists');
      return;
    }
    
    console.log('[AuthContext] Seeding test profile for student@example.com...');
    
    // 1. Create tracking code
    const trackingCode = {
      id: 'test-tracking-001',
      code: 'SACMA-20250328-TEST01',
      studentEmail: 'student@example.com',
      studentName: 'Nguyễn Văn A',
      studentPhone: '+84-987-654-321',
      desiredUniversityId: 'konkuk-university',
      desiredUniversityName: 'Konkuk University',
      visaSystem: 'D4-1',
      topikLevel: '3',
      ieltsScore: '6.5',
      initialTotalCostVnd: 150000000,
      status: 'approved',
      notes: 'Hồ sơ mẫu cho demo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveTrackingCodeToDb(trackingCode);
    console.log('[AuthContext] Created tracking code:', trackingCode.code);
    
    // 2. Create progress stages (8-stage pipeline)
    const progressStages = [
      { id: 1, status: 'completed', completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 2, status: 'completed', completedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 3, status: 'completed', completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 4, status: 'completed', completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 5, status: 'completed', completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 6, status: 'in-progress', startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 7, status: 'pending' },
      { id: 8, status: 'pending' }
    ];
    
    for (const stage of progressStages) {
      await saveStudentProgress({
        id: `student@example.com_konkuk-university_${stage.id}`,
        studentEmail: 'student@example.com',
        universityId: 'konkuk-university',
        stageId: stage.id,
        stageName: `Stage ${stage.id}`,
        status: stage.status as 'pending' | 'in-progress' | 'completed',
        startDate: stage.startDate,
        completedDate: stage.completedDate,
        notes: stage.status === 'in-progress' ? 'Đang xử lý hồ sơ' : undefined
      });
    }
    console.log('[AuthContext] Created progress stages');
    
    // 3. Create payment records
    const payments = [
      {
        id: 'payment-001',
        studentEmail: 'student@example.com',
        universityId: 'konkuk-university',
        paymentType: 'Phí tư vấn',
        amountVnd: 5000000,
        status: 'completed' as const,
        paymentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-002',
        studentEmail: 'student@example.com',
        universityId: 'konkuk-university',
        paymentType: 'Phí hồ sơ',
        amountVnd: 15000000,
        status: 'completed' as const,
        paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-003',
        studentEmail: 'student@example.com',
        universityId: 'konkuk-university',
        paymentType: 'Học phí kỳ 1',
        amountVnd: 50000000,
        status: 'completed' as const,
        paymentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-004',
        studentEmail: 'student@example.com',
        universityId: 'konkuk-university',
        paymentType: 'Phí visa',
        amountVnd: 20000000,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-005',
        studentEmail: 'student@example.com',
        universityId: 'konkuk-university',
        paymentType: 'Phí chỗ ở',
        amountVnd: 30000000,
        status: 'pending' as const,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    for (const payment of payments) {
      await savePayment(payment);
    }
    console.log('[AuthContext] Created payment records');
    
    // 4. Create registration
    await saveRegistration({
      id: 'reg-001',
      studentId: 'student@example.com',
      universityId: 'konkuk-university',
      selectedFees: { visa: true, accommodation: true, insurance: true, additional: [true, true] },
      totalCostVND: 150000000
    });
    console.log('[AuthContext] Created registration');
    
    console.log('[AuthContext] Test profile seeding complete!');
  } catch (error) {
    console.error('[AuthContext] Failed to seed test profile:', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restore user from localStorage on init
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    // Restore token from localStorage on init
    return localStorage.getItem('auth_token');
  });
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
          console.log('[AuthContext] No users found, seeding defaults...');
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
          
          // Seed complete test profile for student account
          await seedTestProfile();
        } else {
          console.log('[AuthContext] Users already exist:', existingUsers.length);
          // Still check if test profile needs seeding
          await seedTestProfile();
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
    
    // Persist to localStorage
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    localStorage.setItem('auth_token', mockToken);
    
    setUser(authUser);
    setToken(mockToken);
  }, []);

  const logout = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    
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
    
    // Persist to localStorage
    localStorage.setItem('auth_user', JSON.stringify(authUser));
    localStorage.setItem('auth_token', mockToken);
    
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
