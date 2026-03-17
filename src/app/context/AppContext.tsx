import React, { createContext, useContext, useState, ReactNode } from 'react';
import { topUniversities } from '../data/top-universities';
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

// Use only Korean universities from the provided CSV Top1/Top2/Top3 lists
const allUniversitiesData = topUniversities;

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [universities, setUniversities] = useState<University[]>(allUniversitiesData);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<StudentProfile[]>([]);
  const [studentOnboardings, setStudentOnboardings] = useState<StudentOnboardingData[]>([]);

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
  };

  const updateUniversity = (id: string, updates: Partial<University>) => {
    setUniversities(prev =>
      prev.map(uni => uni.id === id ? { ...uni, ...updates } : uni)
    );
  };

  const fetchUniversity = async (id: string) => {
    try {
      const response = await fetch(`/api/universities/${id}`);
      const data = await response.json();
      
      // Update the specific university in the list
      updateUniversity(id, data);
      
      return data;
    } catch (error) {
      console.error('Error fetching university:', error);
      return null;
    }
  };

  const addUniversities = (universities: University[]) => {
    setUniversities(prev => [...prev, ...universities]);
  };

  const updateUniversitiesList = (updater: (prev: University[]) => University[]) => {
    setUniversities(prev => updater(prev));
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
