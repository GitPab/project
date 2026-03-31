import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { University } from '../context/AppContext';

// Auth State
interface AuthState {
  user: { id: string; name: string; email: string; role: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: AuthState['user'], token: string) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<NonNullable<AuthState['user']>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) => set({ user, token, isAuthenticated: true }),
      clearUser: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// UI State
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  notifications: Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }>;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  addNotification: (message: string, type: UIState['notifications'][0]['type']) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'system',
  notifications: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  addNotification: (message, type) =>
    set((state) => ({
      notifications: [...state.notifications, { id: Date.now().toString(), message, type }],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));

// Universities State
interface UniversitiesState {
  universities: University[];
  selectedIds: string[];
  filters: {
    search: string;
    country: string;
    region: string;
    topTier: string;
  };
  setUniversities: (universities: University[]) => void;
  addUniversity: (university: University) => void;
  updateUniversity: (id: string, updates: Partial<University>) => void;
  removeUniversity: (id: string) => void;
  toggleSelection: (id: string) => void;
  setSelectedIds: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  setFilters: (filters: Partial<UniversitiesState['filters']>) => void;
  resetFilters: () => void;
}

export const useUniversitiesStore = create<UniversitiesState>((set) => ({
  universities: [],
  selectedIds: [],
  filters: {
    search: '',
    country: '',
    region: '',
    topTier: '',
  },
  setUniversities: (universities) => set({ universities }),
  addUniversity: (university) =>
    set((state) => ({ universities: [...state.universities, university] })),
  updateUniversity: (id, updates) =>
    set((state) => ({
      universities: state.universities.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    })),
  removeUniversity: (id) =>
    set((state) => ({
      universities: state.universities.filter((u) => u.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    })),
  toggleSelection: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.includes(id)
        ? state.selectedIds.filter((sid) => sid !== id)
        : [...state.selectedIds, id],
    })),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  selectAll: (ids) => set({ selectedIds: ids }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () =>
    set({
      filters: { search: '', country: '', region: '', topTier: '' },
      selectedIds: [],
    }),
}));

// Cache State for React Query-like caching
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheState {
  cache: Map<string, CacheEntry<any>>;
  setCache: <T>(key: string, data: T, ttlMs?: number) => void;
  getCache: <T>(key: string) => T | null;
  invalidateCache: (pattern?: string) => void;
}

export const useCacheStore = create<CacheState>((set, get) => ({
  cache: new Map(),
  setCache: <T>(key: string, data: T, ttlMs = 5 * 60 * 1000) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    };
    set((state) => {
      const newCache = new Map(state.cache);
      newCache.set(key, entry);
      return { cache: newCache };
    });
  },
  getCache: <T>(key: string): T | null => {
    const entry = get().cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      get().cache.delete(key);
      return null;
    }
    
    return entry.data;
  },
  invalidateCache: (pattern) => {
    set((state) => {
      const newCache = new Map(state.cache);
      if (pattern) {
        for (const key of newCache.keys()) {
          if (key.includes(pattern)) {
            newCache.delete(key);
          }
        }
      } else {
        newCache.clear();
      }
      return { cache: newCache };
    });
  },
}));
