import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { topUniversities } from '../data/top-universities';
import { initDatabase } from '../services/sqliteDatabase';
import { FeatureAPI } from '../services/featureApi';
import { startBackgroundSync } from '../services/offlineSyncService';
import {
  saveContactRequest,
  saveRegistration,
  getContactRequests,
  getRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
  saveStudentProgress,
  getStudentProgress,
  updateProgressStatus,
  saveDocument,
  getDocuments,
  verifyDocument,
  savePayment,
  getPayments,
  updatePaymentStatus,
  createNotification,
  getNotifications,
  markNotificationAsRead,
  createAuditLog,
  saveStudentApplication,
  getStudentApplications,
  // Calendar & Appointments
  saveAppointment,
  getAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  // Scholarships
  saveScholarship,
  getScholarships,
  saveScholarshipApplication,
  // Visa
  saveVisaApplication,
  getVisaApplications,
  // Reminders
  saveScheduledReminder,
  getScheduledReminders,
  markReminderAsSent,
  // Analytics
  saveAnalyticsMetric,
  getAnalyticsMetrics,
  // RBAC
  saveRole,
  getRoles,
  assignRoleToUser,
  getUserRoles,
  // Communication
  saveCommunicationLog,
  getCommunicationLogs,
  // Feedback
  saveUniversityRating,
  getUniversityRatings,
  approveRating,
  saveServiceFeedback,
  getServiceFeedback,
  resolveFeedback,
  // Email Templates
  saveEmailTemplate,
  getEmailTemplates,
  getEmailTemplateByName,
  deleteEmailTemplate,
  // Workflow
  saveWorkflowRule,
  getWorkflowRules,
  deleteWorkflowRule,
  // User Preferences
  saveUserPreferences,
  getUserPreferences,
  // 2FA
  save2FASecret,
  get2FASettings,
  enable2FA,
  disable2FA,
  // Sessions
  saveUserSession,
  getUserSessions,
  updateSessionActivity,
  invalidateSession,
  invalidateAllUserSessions,
  // Bulk Operations
  saveBulkOperation,
  updateBulkOperationStatus,
  getBulkOperations,
  // Saved Filters
  saveFilter,
  getSavedFilters,
  deleteSavedFilter,
} from '../services/sqliteDatabase';
import { 
  fetchUniversitiesFromAPI, 
  fetchUniversityByIdFromAPI,
  updateUniversityInAPI,
  bulkCreateUniversitiesInAPI 
} from '../services/universityApi';
import {
  University,
  User,
  Registration,
  StudentProgress,
  StudentProfile,
  StudentOnboardingData,
  ProgressStage,
  Document,
  Payment,
  Notification,
  StudentApplication,
  AuditLog,
  Appointment,
  Scholarship,
  ScholarshipApplication,
  VisaApplication,
  ScheduledReminder,
  AnalyticsMetric,
  Role,
  UserRole,
  CommunicationLog,
  UniversityRating,
  ServiceFeedback,
  EmailTemplate,
  WorkflowRule,
  UserPreferences,
  User2FA,
  UserSession,
  BulkOperation,
  SavedFilter,
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
  Document,
  Payment,
  Notification,
  StudentApplication,
  AuditLog,
  Appointment,
  Scholarship,
  ScholarshipApplication,
  VisaApplication,
  ScheduledReminder,
  AnalyticsMetric,
  Role,
  UserRole,
  CommunicationLog,
  UniversityRating,
  ServiceFeedback,
  EmailTemplate,
  WorkflowRule,
  UserPreferences,
  User2FA,
  UserSession,
  BulkOperation,
  SavedFilter,
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
  loadStudentProgress: (studentEmail: string, universityId?: string) => Promise<ProgressStage[]>;
  saveProgressToDatabase: (studentEmail: string, universityId: string, stages: ProgressStage[], updatedBy?: string) => void;
  // Documents
  documents: Document[];
  uploadDocument: (data: Omit<Document, 'id' | 'createdAt' | 'verified'>) => Promise<string>;
  getStudentDocuments: (studentEmail: string) => Document[];
  verifyDocument: (id: string, verifiedBy: string) => void;
  deleteDocument: (id: string) => void;
  // Payments
  payments: Payment[];
  addPayment: (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getStudentPayments: (studentEmail: string) => Payment[];
  updatePaymentStatus: (id: string, status: Payment['status']) => void;
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  createNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  getNotifications: (recipientEmail?: string) => Notification[];
  // Student Applications (Multi-university)
  studentApplications: StudentApplication[];
  addStudentApplication: (data: Omit<StudentApplication, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateApplicationStatus: (id: string, status: string) => void;
  getStudentApplications: (studentEmail: string) => StudentApplication[];
  getAllApplications: () => Promise<any[]>;
  // Audit Log
  createAuditLog: (data: Omit<AuditLog, 'id' | 'createdAt'>) => void;
  getAuditLogs: (entityType?: string, studentEmail?: string, performedBy?: string, limit?: number) => Promise<any[]>;
  // Analytics
  saveAnalyticsMetric: (data: Omit<AnalyticsMetric, 'id' | 'recordedAt'>) => void;
  getAnalyticsMetrics: (metricName?: string, startDate?: string, endDate?: string) => Promise<any[]>;
  // Calendar & Appointments
  appointments: Appointment[];
  scheduleAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getAppointments: (studentEmail?: string, adminEmail?: string) => Promise<Appointment[]>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  cancelAppointment: (id: string) => void;
  // Scholarships
  scholarships: Scholarship[];
  addScholarship: (data: Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateScholarship: (id: string, data: Partial<Scholarship>) => void;
  deleteScholarship: (id: string) => void;
  getScholarships: (universityId?: string) => Promise<Scholarship[]>;
  applyForScholarship: (data: Omit<ScholarshipApplication, 'id' | 'appliedAt'>) => Promise<string>;
  // Visa Applications
  visaApplications: VisaApplication[];
  addVisaApplication: (data: Omit<VisaApplication, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getVisaApplications: (studentEmail?: string) => Promise<VisaApplication[]>;
  updateVisaStatus: (id: string, status: VisaApplication['status']) => void;
  deleteVisaApplication: (id: string) => void;
  // Scheduled Reminders
  scheduledReminders: ScheduledReminder[];
  scheduleReminder: (data: Omit<ScheduledReminder, 'id' | 'createdAt' | 'isSent'>) => Promise<string>;
  getScheduledReminders: (recipientEmail?: string) => ScheduledReminder[];
  // Role-Based Access Control
  roles: Role[];
  userRoles: UserRole[];
  createRole: (data: Omit<Role, 'id' | 'createdAt'>) => Promise<string>;
  updateRole: (id: string, data: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  assignUserRole: (data: Omit<UserRole, 'id' | 'assignedAt'>) => void;
  getUserRoles: (userEmail: string) => Role[];
  // Communication Logs
  communicationLogs: CommunicationLog[];
  logCommunication: (data: Omit<CommunicationLog, 'id' | 'createdAt'>) => Promise<string>;
  // Student Feedback
  universityRatings: UniversityRating[];
  serviceFeedback: ServiceFeedback[];
  submitUniversityRating: (data: Omit<UniversityRating, 'id' | 'createdAt' | 'isApproved'>) => Promise<string>;
  submitServiceFeedback: (data: Omit<ServiceFeedback, 'id' | 'createdAt' | 'isResolved'>) => Promise<string>;
  approveRating: (id: string, approvedBy: string) => void;
  resolveFeedback: (id: string, resolvedBy: string, notes?: string) => void;
  // Email Templates
  emailTemplates: EmailTemplate[];
  createEmailTemplate: (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEmailTemplate: (id: string, data: Partial<EmailTemplate>) => void;
  getEmailTemplates: (templateType?: string) => EmailTemplate[];
  getEmailTemplateByName: (name: string) => EmailTemplate | undefined;
  deleteEmailTemplate: (id: string) => void;
  // Workflow Automation
  workflowRules: WorkflowRule[];
  createWorkflowRule: (data: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateWorkflowRule: (id: string, data: Partial<WorkflowRule>) => void;
  getWorkflowRules: (triggerType?: string) => WorkflowRule[];
  deleteWorkflowRule: (id: string) => void;
  // User Preferences
  userPreferences: UserPreferences | null;
  saveUserPreferences: (data: Omit<UserPreferences, 'id' | 'updatedAt'>) => void;
  getUserPreferences: (userEmail: string) => UserPreferences | null;
  // 2FA
  enable2FA: (userEmail: string, secret: string, backupCodes: string[]) => Promise<string>;
  disable2FA: (userEmail: string) => void;
  get2FASettings: (userEmail: string) => User2FA | null;
  // Sessions
  userSessions: UserSession[];
  saveUserSession: (data: Omit<UserSession, 'id' | 'createdAt' | 'lastActivityAt'>) => Promise<string>;
  getUserSessions: (userEmail: string) => UserSession[];
  invalidateSession: (sessionToken: string) => void;
  invalidateAllSessions: (userEmail: string, exceptToken?: string) => void;
  // Bulk Operations
  bulkOperations: BulkOperation[];
  createBulkOperation: (data: Omit<BulkOperation, 'id' | 'startedAt' | 'operationStatus' | 'processedRecords' | 'successRecords' | 'failedRecords'>) => Promise<string>;
  updateBulkOperationStatus: (id: string, status: BulkOperation['operationStatus'], processed?: number, success?: number, failed?: number) => void;
  getBulkOperations: (limit?: number) => BulkOperation[];
  // Saved Filters
  savedFilters: SavedFilter[];
  saveFilter: (data: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getSavedFilters: (filterType?: string) => SavedFilter[];
  deleteSavedFilter: (id: string) => void;
  // Legacy
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
  
  // Extract display properties from korean_data or fallback to database fields
  const thumbnail = koreanData?.thumbnail ?? u?.thumbnail ?? koreanData?.bannerImage ?? u?.banner_url ?? 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80';
  const tagline = koreanData?.tagline ?? u?.tagline ?? u?.description ?? '';
  const heroImage = koreanData?.heroImage ?? koreanData?.bannerImage ?? u?.banner_url ?? 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&q=80';
  
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
    tagline: tagline,
    thumbnail: thumbnail,
    heroImage: heroImage,
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
      thumbnail: thumbnail,
      tagline: tagline,
      heroImage: heroImage,
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
  const [documents, setDocuments] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [studentApplications, setStudentApplications] = useState<StudentApplication[]>([]);
  // New state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipApplications, setScholarshipApplications] = useState<ScholarshipApplication[]>([]);
  const [visaApplications, setVisaApplications] = useState<VisaApplication[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [communicationLogs, setCommunicationLogs] = useState<CommunicationLog[]>([]);
  const [universityRatings, setUniversityRatings] = useState<UniversityRating[]>([]);
  const [serviceFeedback, setServiceFeedback] = useState<ServiceFeedback[]>([]);
  // New state for additional features
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [userSessions, setUserSessions] = useState<UserSession[]>([]);

  // Sync user state with AuthContext localStorage
  useEffect(() => {
    const syncFromAuthStorage = () => {
      const stored = localStorage.getItem('auth_user');
      if (!stored) {
        setUser((prev) => (prev ? null : prev));
        return;
      }
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setUser((prev) => {
            const next = {
              email: parsed.email,
              role: parsed.role || prev?.role || 'student',
              name: parsed.name || prev?.name || parsed.email.split('@')[0],
              phone: parsed.phone || prev?.phone,
              displayName: parsed.displayName || prev?.displayName,
              trackingCode: parsed.trackingCode || prev?.trackingCode
            };
            if (
              prev &&
              prev.email === next.email &&
              prev.role === next.role &&
              prev.name === next.name &&
              prev.phone === next.phone &&
              prev.displayName === next.displayName &&
              prev.trackingCode === next.trackingCode
            ) {
              return prev;
            }
            return next;
          });
        }
      } catch {
        // ignore invalid storage
      }
    };

    syncFromAuthStorage();
    const handler = () => syncFromAuthStorage();
    window.addEventListener('auth-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('auth-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [dbInitialized, setDbInitialized] = useState(false);

  // PostgreSQL-first, SQLite-offline-fallback architecture
  // PRIMARY: PostgreSQL (via API) - for all online reads and writes
  // FALLBACK: SQLite (local) - for offline caching only
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize SQLite for offline fallback
        await initDatabase();
        
        // PRIMARY: Try to fetch from PostgreSQL API
        try {
          console.log('[AppContext] Fetching universities from PostgreSQL...');
          const apiUniversities = await fetchUniversitiesFromAPI();
          if (apiUniversities.length > 0) {
            setUniversities(apiUniversities.map(parseUniversity));
            console.log('[AppContext] Loaded', apiUniversities.length, 'universities from PostgreSQL');
            
            // Cache to SQLite for offline fallback
            const { bulkInsertUniversities } = await import('../services/universityService');
            const dbData = apiUniversities.map(u => ({
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
            setDbInitialized(true);
            return;
          }
        } catch (apiError) {
          console.warn('[AppContext] PostgreSQL API failed, falling back to SQLite:', apiError);
        }
        
        // FALLBACK: Load from SQLite (offline mode)
        const { getAllUniversities } = await import('../services/universityService');
        const existingUniversities = await getAllUniversities();
        
        if (existingUniversities.length === 0) {
          console.log('[AppContext] No universities found, seeding with CSV data...');
          const { bulkInsertUniversities } = await import('../services/universityService');
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
          setUniversities(allUniversitiesData);
        } else {
          console.log('[AppContext] Loaded', existingUniversities.length, 'universities from SQLite (offline fallback)');
          setUniversities(existingUniversities.map(parseUniversity));
        }
        
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize:', error);
        // Final fallback to memory-only
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
    // Update React state immediately (optimistic update)
    setUniversities(prev =>
      prev.map(uni => uni.id === id ? parseUniversity({ ...uni, ...updates }) : uni)
    );
    
    // PRIMARY: Save to PostgreSQL
    try {
      await updateUniversityInAPI(id, updates);
    } catch (apiError) {
      console.error('[AppContext] PostgreSQL update failed:', apiError);
    }
    
    // FALLBACK: Save to SQLite for offline caching
    if (dbInitialized) {
      try {
        const { saveUniversity } = await import('../services/universityService');
        const saveData = {
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
        };
        await saveUniversity(saveData);
      } catch (error) {
        console.error('[AppContext] SQLite cache update failed:', error);
      }
    }
  };

  const fetchUniversity = useCallback(async (id: string) => {
    try {
      // PRIMARY: Fetch from PostgreSQL API
      const apiUniversity = await fetchUniversityByIdFromAPI(id);
      
      if (apiUniversity) {
        const parsed = parseUniversity(apiUniversity);
        setUniversities(prev => prev.map(u => u.id === id ? parsed : u));
        return parsed;
      }
    } catch (apiError) {
      console.warn('[fetchUniversity] PostgreSQL failed, trying SQLite:', apiError);
    }
    
    // FALLBACK: Fetch from SQLite
    try {
      const { getUniversityById } = await import('../services/universityService');
      const dbUniversity = await getUniversityById(id);
      
      if (dbUniversity) {
        const parsed = parseUniversity({
          ...dbUniversity,
          koreanData: dbUniversity.korean_data
        });
        setUniversities(prev => prev.map(u => u.id === id ? parsed : u));
        return parsed;
      }
    } catch (error) {
      console.error('[fetchUniversity] Both PostgreSQL and SQLite failed:', error);
    }
    
    return null;
  }, []);

  const addUniversities = async (newUniversities: University[]) => {
    const parsed = newUniversities.map(parseUniversity);
    setUniversities(prev => [...prev, ...parsed]);
    
    // PRIMARY: Save to PostgreSQL
    try {
      await bulkCreateUniversitiesInAPI(newUniversities);
    } catch (apiError) {
      console.error('[AppContext] PostgreSQL bulk insert failed:', apiError);
    }
    
    // FALLBACK: Save to SQLite for offline caching
    if (dbInitialized) {
      try {
        const { bulkInsertUniversities } = await import('../services/universityService');
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
        console.error('[AppContext] SQLite cache update failed:', error);
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

  // ============================================
  // ENHANCED PROGRESS TRACKING WITH DATABASE
  // ============================================

  const loadStudentProgress = async (studentEmail: string, universityId?: string): Promise<ProgressStage[]> => {
    if (!dbInitialized) return [];
    
    try {
      const dbProgress = await import('../services/sqliteDatabase').then(m => m.getStudentProgress(studentEmail, universityId));
      
      if (dbProgress && dbProgress.length > 0) {
        // Convert DB format to ProgressStage format
        const stages: ProgressStage[] = dbProgress.map((p: any) => ({
          id: p.stage_id,
          status: p.status,
          startDate: p.start_date,
          completedDate: p.completed_date,
          notes: p.notes
        }));
        
        // Update local state
        const existing = studentProgress.find(sp => sp.studentEmail === studentEmail && sp.universityId === universityId);
        if (existing) {
          setStudentProgress(prev => prev.map(sp => 
            sp.studentEmail === studentEmail && sp.universityId === universityId
              ? { ...sp, stages, overallProgress: calculateOverallProgress(stages) }
              : sp
          ));
        } else {
          setStudentProgress(prev => [...prev, {
            studentEmail,
            universityId: universityId || '',
            stages,
            overallProgress: calculateOverallProgress(stages)
          }]);
        }
        
        return stages;
      }
      return [];
    } catch (error) {
      console.error('Failed to load student progress:', error);
      return [];
    }
  };

  const saveProgressToDatabase = (studentEmail: string, universityId: string, stages: ProgressStage[], updatedBy?: string) => {
    if (!dbInitialized) return;
    
    try {
      stages.forEach(stage => {
        saveStudentProgress({
          id: `${studentEmail}_${universityId}_${stage.id}`,
          studentEmail,
          universityId,
          stageId: stage.id,
          stageName: `Stage ${stage.id}`,
          status: stage.status as 'pending' | 'in-progress' | 'completed',
          startDate: stage.startDate,
          completedDate: stage.completedDate,
          notes: stage.notes,
          updatedBy
        });
      });
      
      // Also update local state
      updateProgress(studentEmail, universityId, stages);
    } catch (error) {
      console.error('Failed to save progress to database:', error);
    }
  };

  // ============================================
  // DOCUMENT FUNCTIONS
  // ============================================

  const uploadDocument = async (data: Omit<Document, 'id' | 'createdAt' | 'verified'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newDoc: Document = {
      ...data,
      id,
      verified: false,
      createdAt: new Date().toISOString()
    };
    
    setDocuments(prev => [newDoc, ...prev]);
    
    if (dbInitialized) {
      try {
        saveDocument({
          id,
          studentEmail: data.studentEmail,
          universityId: data.universityId,
          documentType: data.documentType,
          documentName: data.documentName,
          fileData: data.fileData,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          uploadType: data.uploadType,
          uploadedBy: data.uploadedBy,
          notes: data.notes
        });
      } catch (error) {
        console.error('Failed to save document to database:', error);
      }
    }
    
    return id;
  };

  const getStudentDocuments = (studentEmail: string): Document[] => {
    return documents.filter(d => d.studentEmail === studentEmail);
  };

  const handleVerifyDocument = (id: string, verifiedBy: string) => {
    setDocuments(prev => prev.map(d => 
      d.id === id ? { ...d, verified: true, verifiedBy, verifiedAt: new Date().toISOString() } : d
    ));
    
    if (dbInitialized) {
      try {
        verifyDocument(id, verifiedBy);
      } catch (error) {
        console.error('Failed to verify document:', error);
      }
    }
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    
    if (dbInitialized) {
      try {
        import('../services/sqliteDatabase').then(m => m.deleteDocument(id));
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  // ============================================
  // PAYMENT FUNCTIONS
  // ============================================

  const addPayment = async (data: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newPayment: Payment = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setPayments(prev => [newPayment, ...prev]);
    
    if (dbInitialized) {
      try {
        savePayment({
          id,
          studentEmail: data.studentEmail,
          universityId: data.universityId,
          paymentType: data.paymentType,
          amountVnd: data.amountVnd,
          amountKrw: data.amountKrw,
          amountUsd: data.amountUsd,
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId,
          paymentDate: data.paymentDate,
          dueDate: data.dueDate,
          status: data.status,
          proofDocumentId: data.proofDocumentId,
          notes: data.notes,
          createdBy: data.createdBy
        });
      } catch (error) {
        console.error('Failed to save payment to database:', error);
      }
    }
    
    return id;
  };

  const getStudentPayments = (studentEmail: string): Payment[] => {
    return payments.filter(p => p.studentEmail === studentEmail);
  };

  const handleUpdatePaymentStatus = (id: string, status: Payment['status']) => {
    setPayments(prev => prev.map(p => 
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    ));
    
    if (dbInitialized) {
      try {
        updatePaymentStatus(id, status);
      } catch (error) {
        console.error('Failed to update payment status:', error);
      }
    }
  };

  // ============================================
  // NOTIFICATION FUNCTIONS
  // ============================================

  const handleCreateNotification = async (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...data,
      id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Save to API (PostgreSQL)
    try {
      const { notificationApi } = await import('../services/api');
      await notificationApi.create({
        id,
        recipient_email: data.recipientEmail,
        recipient_role: data.recipientRole,
        title: data.title,
        message: data.message,
        type: data.type,
        related_entity_type: data.relatedEntityType,
        related_entity_id: data.relatedEntityId,
        created_by: data.createdBy
      });
    } catch (error) {
      console.error('Failed to create notification via API:', error);
      // Fallback to SQLite for offline
      if (dbInitialized) {
        try {
          createNotification({
            id,
            recipientEmail: data.recipientEmail,
            recipientRole: data.recipientRole,
            title: data.title,
            message: data.message,
            type: data.type,
            relatedEntityType: data.relatedEntityType,
            relatedEntityId: data.relatedEntityId,
            createdBy: data.createdBy
          });
        } catch (e) {
          console.error('SQLite fallback failed:', e);
        }
      }
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
    ));
    
    // Update via API (PostgreSQL) first
    try {
      const { notificationApi } = await import('../services/api');
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read via API:', error);
      // Fallback to SQLite for offline
      if (dbInitialized) {
        try {
          markNotificationAsRead(id);
        } catch (e) {
          console.error('SQLite fallback failed:', e);
        }
      }
    }
  };

  const handleGetNotifications = (recipientEmail?: string): Notification[] => {
    if (recipientEmail) {
      return notifications.filter(n => n.recipientEmail === recipientEmail);
    }
    return notifications;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ============================================
  // STUDENT APPLICATIONS (Multi-University)
  // ============================================

  const addStudentApplication = (data: Omit<StudentApplication, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newApp: StudentApplication = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setStudentApplications(prev => [newApp, ...prev]);
    
    if (dbInitialized) {
      try {
        saveStudentApplication({
          id,
          studentEmail: data.studentEmail,
          universityId: data.universityId,
          trackingCode: data.trackingCode,
          applicationStatus: data.applicationStatus,
          priority: data.priority,
          isPrimary: data.isPrimary,
          notes: data.notes
        });
      } catch (error) {
        console.error('Failed to save student application:', error);
      }
    }
  };

  const handleUpdateApplicationStatus = (id: string, status: string) => {
    setStudentApplications(prev => prev.map(a => 
      a.id === id ? { ...a, applicationStatus: status, updatedAt: new Date().toISOString() } : a
    ));
    
    if (dbInitialized) {
      try {
        import('../services/sqliteDatabase').then(m => m.updateApplicationStatus(id, status));
      } catch (error) {
        console.error('Failed to update application status:', error);
      }
    }
  };

  const handleGetAllApplications = async (): Promise<any[]> => {
    if (dbInitialized) {
      try {
        const result = await import('../services/sqliteDatabase').then(m => m.getAllApplications());
        return result || [];
      } catch (error) {
        console.error('Failed to get all applications:', error);
        return [];
      }
    }
    return [];
  };
  const handleGetStudentApplications = (studentEmail: string): StudentApplication[] => {
    return studentApplications.filter(a => a.studentEmail === studentEmail);
  };

  // ============================================
  // AUDIT LOG FUNCTIONS
  // ============================================

  const handleCreateAuditLog = (data: Omit<AuditLog, 'id' | 'createdAt'>) => {
    const id = crypto.randomUUID();
    
    if (dbInitialized) {
      try {
        createAuditLog({
          id,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          studentEmail: data.studentEmail,
          oldValues: data.oldValues,
          newValues: data.newValues,
          performedBy: data.performedBy,
          performedByEmail: data.performedByEmail,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        });
      } catch (error) {
        console.error('Failed to create audit log:', error);
      }
    }
  };

  // ============================================
  // CALENDAR & APPOINTMENTS FUNCTIONS (API)
  // ============================================

  const scheduleAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newAppointment: Appointment = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setAppointments(prev => [newAppointment, ...prev]);
    
    // Save to API (persistent)
    try {
      await FeatureAPI.Appointments.create({
        student_id: data.studentEmail,
        admin_id: data.adminEmail,
        title: data.title,
        description: data.description,
        appointment_type: data.appointmentType,
        start_time: data.startTime,
        end_time: data.endTime,
        location: data.location,
        is_online: data.isOnline,
        meeting_link: data.meetingLink
      });
    } catch (error) {
      console.error('Failed to save appointment to API:', error);
    }
    
    return id;
  };

  const handleGetAppointments = async (studentEmail?: string, adminEmail?: string): Promise<Appointment[]> => {
    try {
      const response = await FeatureAPI.Appointments.getAll(studentEmail ? { student_id: studentEmail } : {});
      if (response.appointments) {
        // Convert API response to Appointment type
        const mapped = response.appointments.map((a: any) => ({
          id: a.id,
          studentEmail: a.student_id,
          adminEmail: a.admin_id,
          title: a.title,
          description: a.description,
          type: a.appointment_type,
          startTime: a.start_time,
          endTime: a.end_time,
          location: a.location,
          isOnline: a.is_online,
          meetingLink: a.meeting_link,
          status: a.status,
          createdAt: a.created_at,
          updatedAt: a.updated_at
        }));
        setAppointments(mapped);
        return mapped;
      }
    } catch (error) {
      console.error('Failed to load appointments from API:', error);
    }
    // Fallback to local state
    if (studentEmail) {
      return appointments.filter(a => a.studentEmail === studentEmail);
    }
    return appointments;
  };

  const handleUpdateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
    ));
    // Note: API endpoint for update would need to be added
  };

  const cancelAppointment = async (id: string) => {
    handleUpdateAppointmentStatus(id, 'cancelled');
  };

  // ============================================
  // SCHOLARSHIP FUNCTIONS (API)
  // ============================================

  const addScholarship = async (data: Omit<Scholarship, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newScholarship: Scholarship = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setScholarships(prev => [newScholarship, ...prev]);
    
    // Save to API (persistent)
    try {
      await FeatureAPI.Scholarships.create({
        university_id: data.universityId,
        name: data.name,
        name_korean: data.nameKorean,
        description: data.description,
        amount_vnd: data.amountVnd,
        amount_krw: data.amountKrw,
        eligibility_criteria: data.eligibilityCriteria,
        application_deadline: data.applicationDeadline,
        requirements: data.requirements
      });
    } catch (error) {
      console.error('Failed to save scholarship to API:', error);
    }
    
    return id;
  };

  const handleGetScholarships = async (universityId?: string): Promise<Scholarship[]> => {
    try {
      const response = await FeatureAPI.Scholarships.getAll(universityId ? { university_id: universityId } : {});
      if (response.scholarships) {
        const mapped = response.scholarships.map((s: any) => ({
          id: s.id,
          universityId: s.university_id,
          name: s.name,
          nameKorean: s.name_korean,
          description: s.description,
          amountVnd: s.amount_vnd,
          amountKrw: s.amount_krw,
          eligibilityCriteria: s.eligibility_criteria,
          applicationDeadline: s.application_deadline,
          requirements: s.requirements,
          isActive: s.is_active,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
        setScholarships(mapped);
        return mapped;
      }
    } catch (error) {
      console.error('Failed to load scholarships from API:', error);
    }
    // Fallback to local state
    if (universityId) {
      return scholarships.filter(s => s.universityId === universityId);
    }
    return scholarships;
  };

  const handleDeleteScholarship = async (id: string) => {
    setScholarships(prev => prev.filter(s => s.id !== id));
    // Note: API endpoint for delete would need to be added
  };

  const handleUpdateScholarship = async (id: string, data: Partial<Scholarship>) => {
    setScholarships(prev => prev.map(s => 
      s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
    ));
    // Note: API endpoint for update would need to be added
  };

  const applyForScholarship = async (data: Omit<ScholarshipApplication, 'id' | 'appliedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newApplication: ScholarshipApplication = {
      ...data,
      id,
      appliedAt: new Date().toISOString()
    };
    
    setScholarshipApplications(prev => [newApplication, ...prev]);
    
    if (dbInitialized) {
      try {
        saveScholarshipApplication({
          id,
          scholarshipId: data.scholarshipId,
          studentEmail: data.studentEmail,
          studentApplicationId: data.studentApplicationId,
          status: data.status,
          documents: data.documents,
          amountAwardedVnd: data.amountAwardedVnd,
          amountAwardedKrw: data.amountAwardedKrw
        });
      } catch (error) {
        console.error('Failed to save scholarship application:', error);
      }
    }
    
    return id;
  };

  // ============================================
  // VISA APPLICATION FUNCTIONS (API)
  // ============================================

  const addVisaApplication = async (data: Omit<VisaApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newVisa: VisaApplication = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setVisaApplications(prev => [newVisa, ...prev]);
    
    // Save to API (persistent)
    try {
      await FeatureAPI.VisaApplications.create({
        student_id: data.studentEmail,
        registration_id: data.studentApplicationId,
        visa_type: data.visaType,
        embassy_location: data.embassyLocation,
        appointment_date: data.appointmentDate,
        appointment_time: data.appointmentTime,
        notes: data.notes
      });
    } catch (error) {
      console.error('Failed to save visa application to API:', error);
    }
    
    return id;
  };

  const handleGetVisaApplications = async (studentEmail?: string): Promise<VisaApplication[]> => {
    try {
      const response = await FeatureAPI.VisaApplications.getAll(studentEmail ? { student_id: studentEmail } : {});
      if (response.visa_applications) {
        const mapped = response.visa_applications.map((v: any) => ({
          id: v.id,
          studentEmail: v.student_id,
          studentApplicationId: v.registration_id,
          visaType: v.visa_type,
          embassyLocation: v.embassy_location,
          appointmentDate: v.appointment_date,
          appointmentTime: v.appointment_time,
          status: v.status,
          createdAt: v.created_at,
          updatedAt: v.updated_at
        }));
        setVisaApplications(mapped);
        return mapped;
      }
    } catch (error) {
      console.error('Failed to load visa applications from API:', error);
    }
    // Fallback to local state
    if (studentEmail) {
      return visaApplications.filter(v => v.studentEmail === studentEmail);
    }
    return visaApplications;
  };

  const handleUpdateVisaStatus = async (id: string, status: string) => {
    setVisaApplications(prev => prev.map(v => 
      v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v
    ));
    // Note: API endpoint for update would need to be added
  };

  const handleDeleteVisaApplication = async (id: string) => {
    setVisaApplications(prev => prev.filter(v => v.id !== id));
    // Note: API endpoint for delete would need to be added
  };

  // ============================================
  // SCHEDULED REMINDERS FUNCTIONS
  // ============================================

  const scheduleReminder = async (data: Omit<ScheduledReminder, 'id' | 'createdAt' | 'isSent'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newReminder: ScheduledReminder = {
      ...data,
      id,
      isSent: false,
      createdAt: new Date().toISOString()
    };
    
    setScheduledReminders(prev => [newReminder, ...prev]);
    
    if (dbInitialized) {
      try {
        saveScheduledReminder({
          id,
          recipientEmail: data.recipientEmail,
          recipientRole: data.recipientRole,
          title: data.title,
          message: data.message,
          reminderType: data.reminderType,
          relatedEntityType: data.relatedEntityType,
          relatedEntityId: data.relatedEntityId,
          scheduledDate: data.scheduledDate,
          isRecurring: data.isRecurring,
          recurrencePattern: data.recurrencePattern,
          createdBy: data.createdBy
        });
      } catch (error) {
        console.error('Failed to schedule reminder:', error);
      }
    }
    
    return id;
  };

  const handleGetScheduledReminders = (recipientEmail?: string): ScheduledReminder[] => {
    if (recipientEmail) {
      return scheduledReminders.filter(r => r.recipientEmail === recipientEmail);
    }
    return scheduledReminders;
  };

  // ============================================
  // ROLE-BASED ACCESS CONTROL FUNCTIONS
  // ============================================

  const createRole = async (data: Omit<Role, 'id' | 'createdAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newRole: Role = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    
    setRoles(prev => [newRole, ...prev]);
    
    if (dbInitialized) {
      try {
        saveRole({
          id,
          name: data.name,
          description: data.description,
          permissions: data.permissions
        });
      } catch (error) {
        console.error('Failed to create role:', error);
      }
    }
    
    return id;
  };

  const assignUserRole = (data: Omit<UserRole, 'id' | 'assignedAt'>) => {
    const id = crypto.randomUUID();
    const newUserRole: UserRole = {
      ...data,
      id,
      assignedAt: new Date().toISOString()
    };
    
    setUserRoles(prev => [newUserRole, ...prev]);
    
    if (dbInitialized) {
      try {
        assignRoleToUser({
          id,
          userEmail: data.userEmail,
          roleId: data.roleId,
          assignedBy: data.assignedBy
        });
      } catch (error) {
        console.error('Failed to assign user role:', error);
      }
    }
  };

  const handleGetUserRoles = (userEmail: string): Role[] => {
    const userRoleIds = userRoles
      .filter(ur => ur.userEmail === userEmail)
      .map(ur => ur.roleId);
    return roles.filter(r => userRoleIds.includes(r.id));
  };

  const handleUpdateRole = (id: string, data: Partial<Role>) => {
    setRoles(prev => prev.map(r => 
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
    ));
    
    if (dbInitialized) {
      try {
        import('../services/sqliteDatabase').then(m => {
          const db = m.getDatabase();
          const fields: string[] = [];
          const values: any[] = [];
          
          if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
          if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
          if (data.permissions !== undefined) { fields.push('permissions = ?'); values.push(JSON.stringify(data.permissions)); }
          
          if (fields.length > 0) {
            const stmt = db.prepare(`
              UPDATE roles SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `);
            stmt.bind([...values, id]);
            stmt.step();
            stmt.free();
            m.saveDatabase();
          }
        });
      } catch (error) {
        console.error('Failed to update role:', error);
      }
    }
  };

  const handleDeleteRole = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    
    if (dbInitialized) {
      try {
        import('../services/sqliteDatabase').then(m => {
          const stmt = m.getDatabase().prepare(`
            DELETE FROM roles WHERE id = ?
          `);
          stmt.bind([id]);
          stmt.step();
          stmt.free();
          m.saveDatabase();
        });
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  };

  // ============================================
  // COMMUNICATION LOGS FUNCTIONS
  // ============================================

  const logCommunication = async (data: Omit<CommunicationLog, 'id' | 'createdAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newLog: CommunicationLog = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    
    setCommunicationLogs(prev => [newLog, ...prev]);
    
    if (dbInitialized) {
      try {
        saveCommunicationLog({
          id,
          recipientEmail: data.recipientEmail,
          recipientPhone: data.recipientPhone,
          communicationType: data.communicationType,
          subject: data.subject,
          content: data.content,
          status: data.status,
          templateUsed: data.templateUsed
        });
      } catch (error) {
        console.error('Failed to log communication:', error);
      }
    }
    
    return id;
  };

  // ============================================
  // STUDENT FEEDBACK FUNCTIONS
  // ============================================

  const submitUniversityRating = async (data: Omit<UniversityRating, 'id' | 'createdAt' | 'isApproved'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newRating: UniversityRating = {
      ...data,
      id,
      isApproved: false,
      createdAt: new Date().toISOString()
    };
    
    setUniversityRatings(prev => [newRating, ...prev]);
    
    if (dbInitialized) {
      try {
        saveUniversityRating({
          id,
          universityId: data.universityId,
          studentEmail: data.studentEmail,
          studentApplicationId: data.studentApplicationId,
          overallRating: data.overallRating,
          teachingQuality: data.teachingQuality,
          facilities: data.facilities,
          supportServices: data.supportServices,
          valueForMoney: data.valueForMoney,
          reviewTitle: data.reviewTitle,
          reviewText: data.reviewText
        });
      } catch (error) {
        console.error('Failed to submit university rating:', error);
      }
    }
    
    return id;
  };

  const submitServiceFeedback = async (data: Omit<ServiceFeedback, 'id' | 'createdAt' | 'isResolved'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newFeedback: ServiceFeedback = {
      ...data,
      id,
      isResolved: false,
      createdAt: new Date().toISOString()
    };
    
    setServiceFeedback(prev => [newFeedback, ...prev]);
    
    if (dbInitialized) {
      try {
        saveServiceFeedback({
          id,
          studentEmail: data.studentEmail,
          feedbackType: data.feedbackType,
          rating: data.rating,
          feedbackText: data.feedbackText
        });
      } catch (error) {
        console.error('Failed to submit service feedback:', error);
      }
    }
    
    return id;
  };

  const handleApproveRating = (id: string, approvedBy: string) => {
    setUniversityRatings(prev => prev.map(r => 
      r.id === id ? { ...r, isApproved: true, approvedBy, approvedAt: new Date().toISOString() } : r
    ));
    
    if (dbInitialized) {
      try {
        approveRating(id, approvedBy);
      } catch (error) {
        console.error('Failed to approve rating:', error);
      }
    }
  };

  const handleResolveFeedback = (id: string, resolvedBy: string, notes?: string) => {
    setServiceFeedback(prev => prev.map(f => 
      f.id === id ? { ...f, isResolved: true, resolvedBy, resolvedAt: new Date().toISOString(), resolutionNotes: notes } : f
    ));
    
    if (dbInitialized) {
      try {
        resolveFeedback(id, resolvedBy, notes);
      } catch (error) {
        console.error('Failed to resolve feedback:', error);
      }
    }
  };

  // ============================================
  // EMAIL TEMPLATES FUNCTIONS
  // ============================================

  const createEmailTemplate = async (data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newTemplate: EmailTemplate = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setEmailTemplates(prev => [newTemplate, ...prev]);
    
    if (dbInitialized) {
      try {
        saveEmailTemplate({
          id,
          name: data.name,
          subject: data.subject,
          content: data.content,
          templateType: data.templateType,
          variables: data.variables,
          isActive: data.isActive,
          createdBy: data.createdBy
        });
      } catch (error) {
        console.error('Failed to save email template:', error);
      }
    }
    
    return id;
  };

  const handleGetEmailTemplates = (templateType?: string): EmailTemplate[] => {
    if (templateType) {
      return emailTemplates.filter(t => t.templateType === templateType);
    }
    return emailTemplates;
  };

  const handleGetEmailTemplateByName = (name: string): EmailTemplate | undefined => {
    return emailTemplates.find(t => t.name === name && t.isActive);
  };

  const handleDeleteEmailTemplate = (id: string) => {
    setEmailTemplates(prev => prev.filter(t => t.id !== id));
    
    if (dbInitialized) {
      try {
        deleteEmailTemplate(id);
      } catch (error) {
        console.error('Failed to delete email template:', error);
      }
    }
  };

  const handleUpdateEmailTemplate = (id: string, data: Partial<EmailTemplate>) => {
    setEmailTemplates(prev => prev.map(t => 
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    ));
    
    if (dbInitialized) {
      try {
        import('../services/sqliteDatabase').then(m => {
          const db = m.getDatabase();
          const fields: string[] = [];
          const values: any[] = [];
          
          if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
          if (data.subject !== undefined) { fields.push('subject = ?'); values.push(data.subject); }
          if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
          if (data.templateType !== undefined) { fields.push('template_type = ?'); values.push(data.templateType); }
          if (data.variables !== undefined) { fields.push('variables = ?'); values.push(JSON.stringify(data.variables)); }
          if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
          
          if (fields.length > 0) {
            const stmt = db.prepare(`UPDATE email_templates SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
            stmt.bind([...values, id]);
            stmt.step();
            stmt.free();
            m.saveDatabase();
          }
        });
      } catch (error) {
        console.error('Failed to update email template:', error);
      }
    }
  };

  // ============================================
  // WORKFLOW AUTOMATION FUNCTIONS
  // ============================================

  const createWorkflowRule = async (data: Omit<WorkflowRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newRule: WorkflowRule = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setWorkflowRules(prev => [newRule, ...prev]);
    
    if (dbInitialized) {
      try {
        saveWorkflowRule({
          id,
          name: data.name,
          description: data.description,
          triggerType: data.triggerType,
          triggerCondition: data.triggerCondition,
          actionType: data.actionType,
          actionConfig: data.actionConfig,
          isActive: data.isActive,
          priority: data.priority,
          createdBy: data.createdBy
        });
      } catch (error) {
        console.error('Failed to save workflow rule:', error);
      }
    }
    
    return id;
  };

  const handleGetWorkflowRules = (triggerType?: string): WorkflowRule[] => {
    if (triggerType) {
      return workflowRules.filter(r => r.triggerType === triggerType && r.isActive);
    }
    return workflowRules.filter(r => r.isActive);
  };

  const handleDeleteWorkflowRule = (id: string) => {
    setWorkflowRules(prev => prev.filter(r => r.id !== id));
    
    if (dbInitialized) {
      try {
        deleteWorkflowRule(id);
      } catch (error) {
        console.error('Failed to delete workflow rule:', error);
      }
    }
  };

  const handleUpdateWorkflowRule = (id: string, data: Partial<WorkflowRule>) => {
    setWorkflowRules(prev => prev.map(r => 
      r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
    ));
    
    if (dbInitialized) {
      try {
        import('../services/sqliteDatabase').then(m => {
          const db = m.getDatabase();
          const fields: string[] = [];
          const values: any[] = [];
          
          if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
          if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
          if (data.triggerType !== undefined) { fields.push('trigger_type = ?'); values.push(data.triggerType); }
          if (data.triggerCondition !== undefined) { fields.push('trigger_condition = ?'); values.push(data.triggerCondition); }
          if (data.actionType !== undefined) { fields.push('action_type = ?'); values.push(data.actionType); }
          if (data.actionConfig !== undefined) { fields.push('action_config = ?'); values.push(JSON.stringify(data.actionConfig)); }
          if (data.isActive !== undefined) { fields.push('is_active = ?'); values.push(data.isActive ? 1 : 0); }
          if (data.priority !== undefined) { fields.push('priority = ?'); values.push(data.priority); }
          
          if (fields.length > 0) {
            const stmt = db.prepare(`UPDATE workflow_rules SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
            stmt.bind([...values, id]);
            stmt.step();
            stmt.free();
            m.saveDatabase();
          }
        });
      } catch (error) {
        console.error('Failed to update workflow rule:', error);
      }
    }
  };

  // ============================================
  // USER PREFERENCES FUNCTIONS
  // ============================================

  const handleSaveUserPreferences = (data: Partial<UserPreferences> & { userEmail: string }) => {
    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newPrefs: UserPreferences = {
      userEmail: data.userEmail,
      language: data.language || 'vi',
      theme: data.theme || 'light',
      emailNotifications: data.emailNotifications ?? true,
      smsNotifications: data.smsNotifications ?? false,
      pushNotifications: data.pushNotifications ?? true,
      timezone: data.timezone || 'Asia/Ho_Chi_Minh',
      dateFormat: data.dateFormat || 'DD/MM/YYYY',
      preferencesData: data.preferencesData || {},
      id,
      updatedAt: now
    };
    
    setUserPreferences(newPrefs);
    
    if (dbInitialized) {
      try {
        saveUserPreferences({
          id,
          userEmail: data.userEmail,
          language: data.language,
          theme: data.theme,
          emailNotifications: data.emailNotifications,
          smsNotifications: data.smsNotifications,
          pushNotifications: data.pushNotifications,
          timezone: data.timezone,
          dateFormat: data.dateFormat,
          preferencesData: data.preferencesData
        });
      } catch (error) {
        console.error('Failed to save user preferences:', error);
      }
    }
  };

  const handleGetUserPreferences = (userEmail: string): UserPreferences | null => {
    if (userPreferences?.userEmail === userEmail) {
      return userPreferences;
    }
    
    if (dbInitialized) {
      try {
        const prefs = getUserPreferences(userEmail);
        if (prefs) {
          setUserPreferences(prefs);
          return prefs;
        }
      } catch (error) {
        console.error('Failed to get user preferences:', error);
      }
    }
    return null;
  };

  // ============================================
  // 2FA FUNCTIONS
  // ============================================

  const handleEnable2FA = async (userEmail: string, secret: string, backupCodes: string[]): Promise<string> => {
    const id = crypto.randomUUID();
    
    if (dbInitialized) {
      try {
        save2FASecret({
          id,
          userEmail,
          secret,
          backupCodes,
          isEnabled: true
        });
      } catch (error) {
        console.error('Failed to enable 2FA:', error);
      }
    }
    
    return id;
  };

  const handleDisable2FA = (userEmail: string) => {
    if (dbInitialized) {
      try {
        disable2FA(userEmail);
      } catch (error) {
        console.error('Failed to disable 2FA:', error);
      }
    }
  };

  const handleGet2FASettings = (userEmail: string): User2FA | null => {
    if (dbInitialized) {
      try {
        return get2FASettings(userEmail);
      } catch (error) {
        console.error('Failed to get 2FA settings:', error);
      }
    }
    return null;
  };

  // ============================================
  // SESSIONS FUNCTIONS
  // ============================================

  const handleSaveUserSession = async (data: Omit<UserSession, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newSession: UserSession = {
      ...data,
      id,
      createdAt: now,
      lastActivityAt: now
    };
    
    setUserSessions(prev => [newSession, ...prev]);
    
    if (dbInitialized) {
      try {
        saveUserSession({
          id,
          userEmail: data.userEmail,
          sessionToken: data.sessionToken,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          deviceInfo: data.deviceInfo,
          expiresAt: data.expiresAt
        });
      } catch (error) {
        console.error('Failed to save user session:', error);
      }
    }
    
    return id;
  };

  const handleGetUserSessions = (userEmail: string): UserSession[] => {
    return userSessions.filter(s => s.userEmail === userEmail && s.isActive);
  };

  const handleInvalidateSession = (sessionToken: string) => {
    setUserSessions(prev => prev.map(s => 
      s.sessionToken === sessionToken ? { ...s, isActive: false } : s
    ));
    
    if (dbInitialized) {
      try {
        invalidateSession(sessionToken);
      } catch (error) {
        console.error('Failed to invalidate session:', error);
      }
    }
  };

  const handleInvalidateAllSessions = (userEmail: string, exceptToken?: string) => {
    setUserSessions(prev => prev.map(s => 
      s.userEmail === userEmail && s.sessionToken !== exceptToken ? { ...s, isActive: false } : s
    ));
    
    if (dbInitialized) {
      try {
        invalidateAllUserSessions(userEmail, exceptToken);
      } catch (error) {
        console.error('Failed to invalidate all sessions:', error);
      }
    }
  };

  // ============================================
  // BULK OPERATIONS FUNCTIONS
  // ============================================

  const createBulkOperation = async (data: Omit<BulkOperation, 'id' | 'startedAt' | 'operationStatus' | 'processedRecords' | 'successRecords' | 'failedRecords'>): Promise<string> => {
    const id = crypto.randomUUID();
    const newOperation: BulkOperation = {
      ...data,
      id,
      startedAt: new Date().toISOString(),
      operationStatus: 'pending',
      processedRecords: 0,
      successRecords: 0,
      failedRecords: 0
    };
    
    setBulkOperations(prev => [newOperation, ...prev]);
    
    if (dbInitialized) {
      try {
        saveBulkOperation({
          id,
          operationType: data.operationType,
          totalRecords: data.totalRecords,
          inputData: data.inputData,
          performedBy: data.performedBy
        });
      } catch (error) {
        console.error('Failed to save bulk operation:', error);
      }
    }
    
    return id;
  };

  const handleUpdateBulkOperationStatus = (id: string, status: BulkOperation['operationStatus'], processed?: number, success?: number, failed?: number) => {
    setBulkOperations(prev => prev.map(op => 
      op.id === id ? { 
        ...op, 
        operationStatus: status, 
        processedRecords: processed ?? op.processedRecords,
        successRecords: success ?? op.successRecords,
        failedRecords: failed ?? op.failedRecords
      } : op
    ));
    
    if (dbInitialized) {
      try {
        updateBulkOperationStatus(id, status, processed, success, failed);
      } catch (error) {
        console.error('Failed to update bulk operation status:', error);
      }
    }
  };

  const handleGetBulkOperations = (limit: number = 50): BulkOperation[] => {
    return bulkOperations.slice(0, limit);
  };

  // ============================================
  // SAVED FILTERS FUNCTIONS
  // ============================================

  const handleSaveFilter = async (data: Omit<SavedFilter, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newFilter: SavedFilter = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    setSavedFilters(prev => [newFilter, ...prev]);
    
    if (dbInitialized) {
      try {
        saveFilter({
          id,
          userEmail: data.userEmail,
          filterName: data.filterName,
          filterType: data.filterType,
          filterCriteria: data.filterCriteria,
          isDefault: data.isDefault
        });
      } catch (error) {
        console.error('Failed to save filter:', error);
      }
    }
    
    return id;
  };

  const handleGetSavedFilters = (filterType?: string): SavedFilter[] => {
    if (filterType) {
      return savedFilters.filter(f => f.filterType === filterType);
    }
    return savedFilters;
  };

  const handleDeleteSavedFilter = (id: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== id));
    
    if (dbInitialized) {
      try {
        deleteSavedFilter(id);
      } catch (error) {
        console.error('Failed to delete saved filter:', error);
      }
    }
  };

  // Load data on mount
  useEffect(() => {
    if (dbInitialized && user) {
      // Load notifications for current user
      const loadNotifications = async () => {
        try {
          const notifs = await import('../services/sqliteDatabase').then(m => 
            m.getNotifications(user.email)
          );
          if (notifs && notifs.length > 0) {
            setNotifications(notifs.map((n: any) => ({
              id: n.id,
              recipientEmail: n.recipient_email,
              recipientRole: n.recipient_role,
              title: n.title,
              message: n.message,
              type: n.type,
              relatedEntityType: n.related_entity_type,
              relatedEntityId: n.related_entity_id,
              isRead: !!n.is_read,
              readAt: n.read_at,
              createdBy: n.created_by,
              createdAt: n.created_at
            })));
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      };
      
      loadNotifications();
    }
  }, [dbInitialized, user]);

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
        loadStudentProgress,
        saveProgressToDatabase,
        studentProfiles,
        updateStudentProfile,
        studentOnboardings,
        addStudentOnboarding,
        updateStudentOnboardingStatus,
        deleteStudentOnboarding,
        // Documents
        documents,
        uploadDocument,
        getStudentDocuments,
        verifyDocument: handleVerifyDocument,
        deleteDocument: handleDeleteDocument,
        // Payments
        payments,
        addPayment,
        getStudentPayments,
        updatePaymentStatus: handleUpdatePaymentStatus,
        // Notifications
        notifications,
        unreadCount,
        createNotification: handleCreateNotification,
        markNotificationRead: handleMarkNotificationRead,
        getNotifications: handleGetNotifications,
        // Student Applications
        studentApplications,
        addStudentApplication,
        updateApplicationStatus: handleUpdateApplicationStatus,
        getStudentApplications: handleGetStudentApplications,
        getAllApplications: handleGetAllApplications,
        // Audit Log
        createAuditLog: handleCreateAuditLog,
        getAuditLogs: async (entityType?: string, studentEmail?: string, performedBy?: string, limit?: number) => {
          try {
            const result = await import('../services/sqliteDatabase').then(m => 
              m.getAuditLogs(entityType, studentEmail, performedBy, limit)
            );
            return result;
          } catch (error) {
            console.error('Failed to get audit logs:', error);
            return [];
          }
        },
        // Analytics
        saveAnalyticsMetric: (data: Omit<AnalyticsMetric, 'id' | 'recordedAt'>) => {
          if (dbInitialized) {
            try {
              import('../services/sqliteDatabase').then(m => {
                m.saveAnalyticsMetric({
                  id: crypto.randomUUID(),
                  metricName: data.metricName,
                  metricCategory: data.metricCategory,
                  metricValue: data.metricValue,
                  metricData: data.metricData,
                  dimension1: data.dimension1,
                  dimension2: data.dimension2
                });
              });
            } catch (error) {
              console.error('Failed to save analytics metric:', error);
            }
          }
        },
        getAnalyticsMetrics: async (metricName?: string, startDate?: string, endDate?: string) => {
          if (dbInitialized) {
            try {
              const result = await import('../services/sqliteDatabase').then(m => 
                m.getAnalyticsMetrics(metricName, startDate, endDate)
              );
              return result || [];
            } catch (error) {
              console.error('Failed to get analytics metrics:', error);
              return [];
            }
          }
          return [];
        },
        // Calendar & Appointments
        appointments,
        scheduleAppointment,
        getAppointments: handleGetAppointments,
        updateAppointmentStatus: handleUpdateAppointmentStatus,
        cancelAppointment,
        // Scholarships
        scholarships,
        addScholarship,
        updateScholarship: handleUpdateScholarship,
        deleteScholarship: handleDeleteScholarship,
        getScholarships: handleGetScholarships,
        applyForScholarship,
        // Visa Applications
        visaApplications,
        addVisaApplication,
        getVisaApplications: handleGetVisaApplications,
        updateVisaStatus: handleUpdateVisaStatus,
        deleteVisaApplication: handleDeleteVisaApplication,
        // Scheduled Reminders
        scheduledReminders,
        scheduleReminder,
        getScheduledReminders: handleGetScheduledReminders,
        // Role-Based Access Control
        roles,
        userRoles,
        createRole,
        updateRole: handleUpdateRole,
        deleteRole: handleDeleteRole,
        assignUserRole,
        getUserRoles: handleGetUserRoles,
        // Communication Logs
        communicationLogs,
        logCommunication,
        // Student Feedback
        universityRatings,
        serviceFeedback,
        submitUniversityRating,
        submitServiceFeedback,
        approveRating: handleApproveRating,
        resolveFeedback: handleResolveFeedback,
        // Email Templates
        emailTemplates,
        createEmailTemplate,
        updateEmailTemplate: handleUpdateEmailTemplate,
        getEmailTemplates: handleGetEmailTemplates,
        getEmailTemplateByName: handleGetEmailTemplateByName,
        deleteEmailTemplate: handleDeleteEmailTemplate,
        // Workflow Automation
        workflowRules,
        createWorkflowRule,
        updateWorkflowRule: handleUpdateWorkflowRule,
        getWorkflowRules: handleGetWorkflowRules,
        deleteWorkflowRule: handleDeleteWorkflowRule,
        // User Preferences
        userPreferences,
        saveUserPreferences: handleSaveUserPreferences,
        getUserPreferences: handleGetUserPreferences,
        // 2FA
        enable2FA: handleEnable2FA,
        disable2FA: handleDisable2FA,
        get2FASettings: handleGet2FASettings,
        // Sessions
        userSessions,
        saveUserSession: handleSaveUserSession,
        getUserSessions: handleGetUserSessions,
        invalidateSession: handleInvalidateSession,
        invalidateAllSessions: handleInvalidateAllSessions,
        // Bulk Operations
        bulkOperations,
        createBulkOperation,
        updateBulkOperationStatus: handleUpdateBulkOperationStatus,
        getBulkOperations: handleGetBulkOperations,
        // Saved Filters
        savedFilters,
        saveFilter: handleSaveFilter,
        getSavedFilters: handleGetSavedFilters,
        deleteSavedFilter: handleDeleteSavedFilter,
        // Contact
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
