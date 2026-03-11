import React, { createContext, useContext, useState, ReactNode } from 'react';
import { koreanUniversities } from '../data/korean-universities';
import { asianUniversities } from '../data/asian-universities';

export interface AdditionalFee {
  type: string;
  amount: number;
  selected?: boolean; // For optional fees
}

// New interfaces for Korean university structure
export interface VisaSystemCost {
  visaType: 'D4-1' | 'D2-2' | 'D2-3';  // Korean visa types
  tuitionPerTerm?: number;
  tuitionRange?: { min: number; max: number };
  applicationFee?: number;
  enrollmentFee?: number;
  baseYearlyFee?: number;
  description?: string;
}

export interface OptionalAddon {
  id: string;
  name: string;
  nameKr?: string;
  nameVi?: string;
  type: 'dorm-vn' | 'dorm-kr' | 'savings' | 'flight' | 'scholarship' | 'other';
  amount?: number;
  amountRange?: { min: number; max: number };
  perMonth?: boolean;  // For dorm fees
  percentage?: number;  // For scholarships
  selectable: boolean;
  requiresInput?: boolean;  // If user needs to select months/type/etc
  options?: Array<{ label: string; value: number }>;
  conditional?: string;  // Conditions for eligibility
}

export interface KoreanUniversityData {
  isKoreanUniversity: boolean;
  address?: string;
  topVisa?: string;
  koreanRanking?: string;  // e.g., "15/200 trường đại học tại Hàn Quốc"
  visaSystems?: VisaSystemCost[];
  majors?: string[];
  majorCategories?: Array<{ category: string; subjects: string[] }>;
  scholarships?: Array<{ visaType: string; description: string }>;
  admissionRequirements?: Array<{ visaType: string; requirement: string }>;
  financialRequirements?: Array<{ visaType: string; requirement: string }>;
  dormOptions?: Array<{ type: string; priceKRW: number }>;
  languageCourse?: { available: boolean; priceVND?: number };
  studentSupport?: string[];
  jobOpportunities?: string;
}

export interface AcademicProgram {
  icon: string;
  title: string;
  description: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  tagline: string;
  thumbnail: string;
  heroImage: string;
  overview: string;
  academicPrograms: AcademicProgram[];
  galleryImages: string[];
  ranking: string;
  worldRanking: number;
  
  // Traditional cost structure (for non-Korean universities)
  generalTuition: number;
  visaFee: number;
  accommodationFee: number;
  insuranceFee: number;
  additionalFees: AdditionalFee[];
  
  // Korean university data (optional)
  koreanData?: KoreanUniversityData;
  
  // Fixed costs for Korean universities (always apply)
  fixedCosts?: Array<{ 
    type: string; 
    amount: number; 
    currency?: 'USD' | 'VND' | 'KRW' | 'JPY' | 'CNY'; 
    category?: string;
    description?: string;
  }>;
  
  // Optional add-ons for Korean universities
  optionalAddons?: OptionalAddon[];
  
  majors?: string[]; // For search filtering
}

export interface User {
  email: string;
  role: 'admin' | 'student';
  name: string;
}

export interface Registration {
  universityId: string;
  registeredAt: string;
  studentEmail: string;
  selectedFees?: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  };
}

export type ProgressStatus = 'pending' | 'in-progress' | 'completed' | 'delayed';

export interface ProgressStage {
  id: number;
  status: ProgressStatus;
  startDate?: string;
  completedDate?: string;
  notes?: string;
}

export interface StudentProgress {
  studentEmail: string;
  universityId: string;
  stages: ProgressStage[];
  overallProgress: number;
}

export interface PaymentHistory {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
}

export interface StudentProfile {
  email: string;
  name: string;
  phone: string;
  photoUrl: string;
  registeredUniversities: string[];
  totalPersonalCost: number;
  paymentHistory: PaymentHistory[];
}

// New interface for student onboarding data
export interface StudentOnboardingData {
  id: string;
  name: string;
  phone: string;
  email: string;
  desiredUniversity: string;
  visaSystem: string;
  topikLevel?: string;
  ieltsScore?: string;
  initialTotalCost: number;
  notes?: string;
  submittedAt: string;
  status: 'pending' | 'in-review' | 'approved' | 'contacted';
}

interface AppContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'student') => void;
  logout: () => void;
  universities: University[];
  updateUniversity: (id: string, updates: Partial<University>) => void;
  addUniversities: (universities: University[]) => void;
  registrations: Registration[];
  registerForUniversity: (universityId: string, selectedFees?: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Combine Asian universities only (~50 universities)
const allUniversitiesData = [
  ...koreanUniversities, // Ajou and other Korean universities
  ...asianUniversities // All Asian universities (Korea, China, Japan, Singapore, Vietnam, India, Thailand, Malaysia)
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [universities, setUniversities] = useState<University[]>(allUniversitiesData);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [studentOnboardings, setStudentOnboardings] = useState<StudentOnboardingData[]>([
    // Demo onboarding data
    {
      id: '1',
      name: 'Nguyễn Văn Minh',
      phone: '+84 987 654 321',
      email: 'nguyenvanminh@example.com',
      desiredUniversity: 'kr-ajou-1',
      visaSystem: 'D2-2',
      topikLevel: '4',
      ieltsScore: '6.5',
      initialTotalCost: 18500,
      notes: 'Interested in Computer Engineering program. Would like to know more about scholarship opportunities.',
      submittedAt: '2026-02-28T08:30:00Z',
      status: 'pending'
    },
    {
      id: '2',
      name: 'Trần Thị Hương',
      phone: '+84 912 345 678',
      email: 'tranthuong@example.com',
      desiredUniversity: 'kr-snu-1',
      visaSystem: 'D2-2',
      topikLevel: '5',
      ieltsScore: '7.0',
      initialTotalCost: 20800,
      notes: 'Already completed Korean language course. Planning to start in Fall 2026.',
      submittedAt: '2026-02-27T14:15:00Z',
      status: 'in-review'
    },
    {
      id: '3',
      name: 'Kim Soo-jin',
      phone: '+84 901 234 567',
      email: 'kimsoojin@example.com',
      desiredUniversity: 'kr-ajou-1',
      visaSystem: 'D4-1',
      topikLevel: '2',
      ieltsScore: '',
      initialTotalCost: 12500,
      notes: 'Want to study Korean language first before undergraduate program.',
      submittedAt: '2026-02-26T10:00:00Z',
      status: 'approved'
    },
    {
      id: '4',
      name: 'Lê Hoàng Anh',
      phone: '+84 988 777 666',
      email: 'lehoanganh@example.com',
      desiredUniversity: 'kr-snu-1',
      visaSystem: 'D2-3',
      topikLevel: '6',
      ieltsScore: '7.5',
      initialTotalCost: 19200,
      notes: 'Applying for Master\'s program in Business Administration. Have bachelor\'s degree from Vietnam National University.',
      submittedAt: '2026-02-25T16:45:00Z',
      status: 'contacted'
    }
  ]);

  const login = (email: string, password: string, role: 'admin' | 'student') => {
    // Mock login - in real app would validate credentials
    let userName = email.split('@')[0];
    
    // Special handling for demo students with progress
    if (email === 'nguyenvana@example.com') {
      userName = 'Nguyễn Văn A';
    } else if (email === 'kimjihoon@example.com') {
      userName = 'Kim Ji-hoon';
    }
    
    setUser({
      email,
      role,
      name: userName
    });
    
    // Auto-setup demo student registrations and progress
    if (role === 'student') {
      if (email === 'nguyenvana@example.com') {
        // Student A registered for University of Melbourne
        setRegistrations([{
          universityId: '5',
          registeredAt: '2025-09-15T00:00:00Z',
          studentEmail: email
        }]);
        
        // Set up progress for Student A
        setStudentProgress([{
          studentEmail: email,
          universityId: '5',
          overallProgress: 65,
          stages: [
            { id: 1, status: 'completed', startDate: '2025-09-15', completedDate: '2025-09-15', notes: 'Application submitted successfully' },
            { id: 2, status: 'completed', startDate: '2025-09-20', completedDate: '2025-12-15', notes: 'Completed English language preparation (IELTS 7.5)' },
            { id: 3, status: 'completed', startDate: '2025-12-15', completedDate: '2026-01-20', notes: 'All preparation courses finished' },
            { id: 4, status: 'completed', startDate: '2026-01-20', completedDate: '2026-02-01', notes: 'Admission letter received' },
            { id: 5, status: 'completed', startDate: '2026-02-05', completedDate: '2026-02-05', notes: 'Student visa application submitted' },
            { id: 6, status: 'in-progress', startDate: '2026-02-05', notes: 'Visa processing - awaiting decision' },
            { id: 7, status: 'pending' },
            { id: 8, status: 'pending' },
          ]
        }]);
        
        // Set up profile for Student A
        setStudentProfiles([{
          email: email,
          name: 'Nguyễn Văn A',
          phone: '123-456-7890',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
          registeredUniversities: ['5'],
          totalPersonalCost: 65000,
          paymentHistory: [
            { id: '1', date: '2025-09-15', description: 'Application Fee', amount: 75, status: 'paid' },
            { id: '2', date: '2025-09-20', description: 'English Language Preparation', amount: 1500, status: 'paid' },
            { id: '3', date: '2025-12-15', description: 'Preparation Courses', amount: 3000, status: 'paid' },
            { id: '4', date: '2026-01-20', description: 'Admission Letter', amount: 0, status: 'paid' },
            { id: '5', date: '2026-02-05', description: 'Student Visa Application', amount: 185, status: 'paid' },
            { id: '6', date: '2026-02-05', description: 'Visa Processing', amount: 0, status: 'pending' },
          ]
        }]);
      } else if (email === 'kimjihoon@example.com') {
        // Student B registered for MIT
        setRegistrations([{
          universityId: '2',
          registeredAt: '2025-08-01T00:00:00Z',
          studentEmail: email
        }]);
        
        // Set up progress for Student B
        setStudentProgress([{
          studentEmail: email,
          universityId: '2',
          overallProgress: 40,
          stages: [
            { id: 1, status: 'completed', startDate: '2025-08-01', completedDate: '2025-08-01', notes: 'Application to MIT submitted' },
            { id: 2, status: 'completed', startDate: '2025-08-10', completedDate: '2025-12-20', notes: 'Academic preparation completed' },
            { id: 3, status: 'in-progress', startDate: '2025-12-20', notes: 'Final preparations in progress' },
            { id: 4, status: 'pending' },
            { id: 5, status: 'pending' },
            { id: 6, status: 'pending' },
            { id: 7, status: 'pending' },
            { id: 8, status: 'pending' },
          ]
        }]);
        
        // Set up profile for Student B
        setStudentProfiles([{
          email: email,
          name: 'Kim Ji-hoon',
          phone: '098-765-4321',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
          registeredUniversities: ['2'],
          totalPersonalCost: 58000,
          paymentHistory: [
            { id: '1', date: '2025-08-01', description: 'Application Fee', amount: 75, status: 'paid' },
            { id: '2', date: '2025-08-10', description: 'Academic Preparation', amount: 2000, status: 'paid' },
            { id: '3', date: '2025-12-20', description: 'Final Preparations', amount: 0, status: 'pending' },
          ]
        }]);
      } else {
        // Regular students start with empty registrations
        setRegistrations([]);
        setStudentProgress([]);
        setStudentProfiles([]);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setRegistrations([]);
  };

  const updateUniversity = (id: string, updates: Partial<University>) => {
    setUniversities(prev =>
      prev.map(uni => uni.id === id ? { ...uni, ...updates } : uni)
    );
  };

  const addUniversities = (universities: University[]) => {
    setUniversities(prev => [...prev, ...universities]);
  };

  const registerForUniversity = (universityId: string, selectedFees?: {
    visa: boolean;
    accommodation: boolean;
    insurance: boolean;
    additional: boolean[];
  }) => {
    if (!registrations.find(r => r.universityId === universityId)) {
      setRegistrations(prev => [
        ...prev,
        { universityId, registeredAt: new Date().toISOString(), studentEmail: user?.email || '', selectedFees }
      ]);
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

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        logout,
        universities,
        updateUniversity,
        addUniversities,
        registrations,
        registerForUniversity,
        updateRegistration,
        studentProgress,
        updateProgress,
        studentProfiles,
        updateStudentProfile,
        studentOnboardings,
        addStudentOnboarding,
        updateStudentOnboardingStatus,
        deleteStudentOnboarding
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