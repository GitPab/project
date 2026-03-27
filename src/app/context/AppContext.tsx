import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { topUniversities } from '../data/top-universities';
import { initDatabase } from '../services/sqliteDatabase';
import {
  saveContactRequest,
  saveRegistration,
  getContactRequests,
  getRegistrations,
  updateRegistrationStatus,
  deleteRegistration
} from '../services/sqliteDatabase';
import { getAllUniversities, saveUniversity, bulkInsertUniversities, getUniversityById } from '../services/universityService';
import {
  University,
  User,
  Registration,
  StudentProgress,
  StudentProfile,
  StudentOnboardingData,
  ProgressStage,
} from '../../types';

export type {
  University,
  User,
  Registration,
  StudentProgress,
  StudentProfile,
  StudentOnboardingData,
  ProgressStage,
  AdditionalFee,
  VisaSystemCost,
  OptionalAddon,
  KoreanUniversityData,
  AcademicProgram,
} from '../../types';

interface AppContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'student', studentInfo?: { displayName?: string; phone?: string; trackingCode?: string }) => void;
  logout: () => void;
  universities: University[];
  setUniversities: (updater: (prev: University[]) => University[]) => void;
  updateUniversity: (id: string, updates: Partial<University>) => void;
  fetchUniversity: (id: string) => Promise<University | null>;
  addUniversities: (universities: University[]) => void;
  updateUniversitiesList: (updater: (prev: University[]) => University[]) => void;
  registrations: Registration[];
  setRegistrations: (updater: (prev: Registration[]) => Registration[]) => void;
  registerForUniversity: (universityId: string, selectedFees?: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }, totalCostVND?: number) => void;
  updateRegistration: (universityId: string, studentEmail: string, selectedFees: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }) => void;
  studentProgress: StudentProgress[];
  updateProgress: (studentEmail: string, universityId: string, stages: ProgressStage[]) => void;
  studentProfiles: StudentProfile[];
  updateStudentProfile: (email: string, updates: Partial<StudentProfile>) => void;
  studentOnboardings: StudentOnboardingData[];
  addStudentOnboarding: (data: Omit<StudentOnboardingData, 'id' | 'submittedAt' | 'status'>) => void;
  updateStudentOnboardingStatus: (id: string, status: StudentOnboardingData['status']) => void;
  deleteStudentOnboarding: (id: string) => void;
  // Contact requests
  saveContactRequest: (data: {
    id: string;
    studentName: string;
    studentPhone: string;
    studentEmail: string;
    note: string;
    universityId?: string;
    universityName?: string;
    visaSystem?: string;
  }) => void;
  getContactRequests: (universityId?: string) => any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Use only Korean universities from the provided CSV Top1/Top2/Top3 lists
const normalizeTier = (raw: any): 'Top1' | 'Top2' | 'Top3' => {
  const s = String(raw ?? '').toLowerCase().replace(/\s/g, '');
  if (s.includes('top3') || s === '3') return 'Top3';
  if (s.includes('top2') || s === '2') return 'Top2';
  if (s.includes('top1') || s === '1') return 'Top1';
  return 'Top1'; // Default to Top1
};

const parseMaybeJson = <T,>(value: any, fallback: T): T => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return (value ?? fallback) as T;
};

const parseUniversity = (u: any): University => {
  // Handle data from database (which has different field names)
  const normalizedTier = normalizeTier(u?.top_tier ?? u?.koreanData?.topTier ?? u?.topTier);
  
  // Parse korean_data if it's a string (from database)
  let koreanData = u?.koreanData;
  if (typeof koreanData === 'string') {
    try {
      koreanData = JSON.parse(koreanData);
    } catch {
      koreanData = { isKoreanUniversity: true };
    }
  }
  
  // Ensure systems array exists
  const systems = u?.systems ?? koreanData?.systems ?? [];
  
  return {
    id: u.id,
    name: u.name,
    koreanName: u.name_korean ?? u.koreanName,
    country: u.country ?? 'Hàn Quốc',
    countryCode: u.country_code ?? u.countryCode ?? '🇰🇷',
    region: u.region,
    top_tier: normalizedTier,
    ranking: u.ranking,
    description: u.description,
    systems: Array.isArray(systems) ? systems : [],
    koreanData: {
      isKoreanUniversity: true,
      topTier: normalizedTier,
      address: koreanData?.address ?? u.address,
      koreanRanking: koreanData?.koreanRanking ?? u.ranking,
      majors: koreanData?.majors ?? [],
      admission: koreanData?.admission ?? {},
      visaSystemsDetail: koreanData?.visaSystemsDetail ?? {},
      supportPolicies: koreanData?.supportPolicies ?? [],
      commonFeesVND: koreanData?.commonFeesVND ?? [],
      ...koreanData
    },
  };
};

const allUniversitiesData = topUniversities.map(parseUniversity);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [universities, setUniversities] = useState<University[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [studentOnboardings, setStudentOnboardings] = useState<StudentOnboardingData[]>([]);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize SQLite database and load universities
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        
        // Load universities from SQLite
        let dbUniversities = await getAllUniversities();
        
        // If no universities in DB, seed with default data
        if (dbUniversities.length === 0) {
          const seedData = allUniversitiesData.map(u => ({
            id: u.id,
            name: u.name,
            name_korean: u.koreanName,
            region: u.region,
            top_tier: u.top_tier,
            ranking: u.ranking,
            country: u.country,
            country_code: u.countryCode,
            address: u.koreanData?.address,
            korean_data: JSON.stringify(u.koreanData)
          }));
          await bulkInsertUniversities(seedData);
          dbUniversities = await getAllUniversities();
        }
        
        setUniversities(dbUniversities.map(parseUniversity));
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Fallback to memory-only mode
        setUniversities(allUniversitiesData);
        setDbInitialized(true);
      }
    };
    
    init();
  }, []);

  const login = (email: string, password: string, role: 'admin' | 'student', studentInfo?: { displayName?: string; phone?: string; trackingCode?: string }) => {
    // Login creates a user session
    const userName = email.split('@')[0];

    setUser({
      email,
      role,
      name: userName,
      displayName: studentInfo?.displayName,
      phone: studentInfo?.phone,
      trackingCode: studentInfo?.trackingCode
    });
  };

  const logout = () => {
    setUser(null);
    setRegistrations([]);
    // Also clear AuthContext localStorage keys
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  const updateUniversity = async (id: string, updates: Partial<University>) => {
    setUniversities(prev =>
      prev.map(uni => uni.id === id ? parseUniversity({ ...uni, ...updates }) : uni)
    );
    
    // Save to SQLite
    if (dbInitialized) {
      try {
        await saveUniversity({
          id,
          name: updates.name || '',
          name_korean: updates.koreanName,
          region: updates.region,
          top_tier: updates.top_tier,
          ranking: updates.ranking,
          country: updates.country,
          country_code: updates.countryCode,
          address: updates.koreanData?.address,
          korean_data: JSON.stringify(updates.koreanData)
        });
      } catch (error) {
        console.error('Failed to save university to SQLite:', error);
      }
    }
  };

  const fetchUniversity = useCallback(async (id: string) => {
    try {
      // Fetch fresh data from SQLite database
      const dbUniversity = await getUniversityById(id);
      
      if (!dbUniversity) {
        console.error('University not found in database:', id);
        return null;
      }
      
      const parsed = parseUniversity(dbUniversity);
      
      // Update the specific university in the list with fresh data
      setUniversities(prev =>
        prev.map(uni => uni.id === id ? parsed : uni)
      );
      
      return parsed;
    } catch (error) {
      console.error('Error fetching university from database:', error);
      return null;
    }
  }, []);

  const addUniversities = async (newUniversities: University[]) => {
    const parsed = newUniversities.map(parseUniversity);
    setUniversities(prev => [...prev, ...parsed]);
    
    // Save to SQLite
    if (dbInitialized) {
      try {
        const dbData = parsed.map(u => ({
          id: u.id,
          name: u.name,
          name_korean: u.koreanName,
          region: u.region,
          top_tier: u.top_tier,
          ranking: u.ranking,
          country: u.country,
          country_code: u.countryCode,
          address: u.koreanData?.address,
          korean_data: JSON.stringify(u.koreanData)
        }));
        await bulkInsertUniversities(dbData);
      } catch (error) {
        console.error('Failed to add universities to SQLite:', error);
      }
    }
  };

  const updateUniversitiesList = async (updater: (prev: University[]) => University[]) => {
    setUniversities(prev => {
      const updated = updater(prev).map(parseUniversity);
      return updated;
    });
  };

  const registerForUniversity = (universityId: string, selectedFees?: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }, totalCostVND?: number) => {
    const id = Date.now().toString();
    
    if (!registrations.find(r => r.universityId === universityId)) {
      setRegistrations(prev => [
        ...prev,
        { universityId, registeredAt: new Date().toISOString(), studentEmail: user?.email || '', selectedFees }
      ]);
    }
    
    // Save to SQLite
    if (dbInitialized && selectedFees) {
      try {
        saveRegistration({
          id,
          studentId: user?.email,
          universityId,
          selectedFees,
          totalCostVND: totalCostVND || 0
        });
      } catch (error) {
        console.error('Failed to save registration to SQLite:', error);
      }
    }
  };

  const updateRegistration = (universityId: string, studentEmail: string, selectedFees: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }) => {
    const existingRegistration = registrations.find(r => r.universityId === universityId && r.studentEmail === studentEmail);
    if (existingRegistration) {
      setRegistrations(prev =>
        prev.map(r => r.universityId === universityId && r.studentEmail === studentEmail ? { ...r, selectedFees } : r)
      );
    }
  };

  const updateProgress = (studentEmail: string, universityId: string, stages: ProgressStage[]) => {
    const existingProgress = studentProgress.find(sp => sp.studentEmail === studentEmail && sp.universityId === universityId);
    if (existingProgress) {
      setStudentProgress(prev =>
        prev.map(sp => sp.studentEmail === studentEmail && sp.universityId === universityId ? { ...sp, stages, overallProgress: calculateOverallProgress(stages) } : sp)
      );
    } else {
      setStudentProgress(prev => [
        ...prev,
        { studentEmail, universityId, stages, overallProgress: calculateOverallProgress(stages) }
      ]);
    }
  };

  const calculateOverallProgress = (stages: ProgressStage[]): number => {
    const totalStages = stages.length;
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
  };

  const updateStudentProfile = (email: string, updates: Partial<StudentProfile>) => {
    const existingProfile = studentProfiles.find(sp => sp.email === email);
    if (existingProfile) {
      setStudentProfiles(prev =>
        prev.map(sp => sp.email === email ? { ...sp, ...updates } : sp)
      );
    } else {
      // Create new profile with default values
      const newProfile: StudentProfile = {
        email,
        name: updates.name || email.split('@')[0],
        phone: updates.phone || '',
        photoUrl: updates.photoUrl || '',
        registeredUniversities: updates.registeredUniversities || [],
        totalPersonalCost: updates.totalPersonalCost || 0,
        paymentHistory: updates.paymentHistory || []
      };
      setStudentProfiles(prev => [...prev, newProfile]);
    }
  };

  const addStudentOnboarding = (data: Omit<StudentOnboardingData, 'id' | 'submittedAt' | 'status'>) => {
    const newOnboarding: StudentOnboardingData = {
      id: Date.now().toString(),
      submittedAt: new Date().toISOString(),
      status: 'pending',
      ...data
    };
    setStudentOnboardings(prev => [...prev, newOnboarding]);
  };

  const updateStudentOnboardingStatus = (id: string, status: StudentOnboardingData['status']) => {
    const existingOnboarding = studentOnboardings.find(onboarding => onboarding.id === id);
    if (existingOnboarding) {
      setStudentOnboardings(prev =>
        prev.map(onboarding => onboarding.id === id ? { ...onboarding, status } : onboarding)
      );
    }
  };

  const deleteStudentOnboarding = (id: string) => {
    setStudentOnboardings(prev => prev.filter(onboarding => onboarding.id !== id));
  };

  // Contact requests functions
  const handleSaveContactRequest = (data: {
    id: string;
    studentName: string;
    studentPhone: string;
    studentEmail: string;
    note: string;
    universityId?: string;
    universityName?: string;
    visaSystem?: string;
  }) => {
    if (dbInitialized) {
      try {
        saveContactRequest(data);
      } catch (error) {
        console.error('Failed to save contact request to SQLite:', error);
      }
    }
  };

  const handleGetContactRequests = (universityId?: string) => {
    if (dbInitialized) {
      try {
        return getContactRequests(universityId);
      } catch (error) {
        console.error('Failed to get contact requests from SQLite:', error);
        return [];
      }
    }
    return [];
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        universities,
        setUniversities: updateUniversitiesList,
        updateUniversity,
        fetchUniversity,
        addUniversities,
        updateUniversitiesList,
        registrations,
        setRegistrations,
        registerForUniversity,
        updateRegistration,
        studentProgress,
        updateProgress,
        studentProfiles,
        updateStudentProfile,
        studentOnboardings,
        addStudentOnboarding,
        updateStudentOnboardingStatus,
        deleteStudentOnboarding,
        saveContactRequest: handleSaveContactRequest,
        getContactRequests: handleGetContactRequests
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
