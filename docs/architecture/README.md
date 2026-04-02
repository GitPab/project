/**
 * Project Architecture Documentation
 * 
 * ## System Architecture (Updated April 2026)
 * 
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                        CLIENT LAYER                         │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
 * │  │   Browser    │  │   Browser    │  │   Mobile     │       │
 * │  │   (React)    │  │   (React)    │  │   (Future)   │       │
 * │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
 * └─────────┼─────────────────┼─────────────────┼───────────────┘
 *           │                 │                 │
 *           └─────────────────┴─────────────────┘
 *                             │
 *                    ┌────────▼────────┐
 *                    │   Nginx/CDN     │
 *                    └────────┬────────┘
 *                             │
 * ┌───────────────────────────▼─────────────────────────────────┐
 * │                      API LAYER (Node.js/Express)            │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
 * │  │  Auth API    │  │ University   │  │ Registration │       │
 * │  │              │  │    API       │  │    API       │       │
 * │  └──────────────┘  └──────────────┘  └──────────────┘       │
 * │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
 * │  │  Payment API │  │  Message API │  │ Notification │       │
 * │  │              │  │              │  │    API       │       │
 * │  └──────────────┘  └──────────────┘  └──────────────┘       │
 * └───────────────────────────┬─────────────────────────────────┘
 *                             │
 * ┌───────────────────────────▼─────────────────────────────────┐
 * │                    DATABASE LAYER                           │
 * │  ┌──────────────────────────────────────────────┐          │
 * │  │           PostgreSQL (Primary)               │          │
 * │  │  - Users, Universities, Registrations        │          │
 * │  │  - Payments, Messages, Notifications         │          │
 * │  │  - Audit Logs, Preferences                   │          │
 * │  └──────────────────────────────────────────────┘          │
 * │  ┌──────────────────────────────────────────────┐          │
 * │  │           Redis (Cache)                      │          │
 * │  │  - Sessions, Rate Limiting                   │          │
 * │  │  - Hot Data Caching                          │          │
 * │  └──────────────────────────────────────────────┘          │
 * └─────────────────────────────────────────────────────────────┘
 * ```
 * 
 * ## Frontend Architecture (Updated April 2026)
 * 
 * ### Component Organization
 * ```
 * src/app/
 * ├── components/              # Legacy components (50+ files)
 * │   ├── ui/                 # shadcn/ui components (47 files)
 * │   ├── AdminInvite.tsx
 * │   ├── CostCalculator.tsx
 * │   ├── EditUniversityModal.tsx
 * │   ├── PermissionGuard.tsx
 * │   ├── RegistrationModal.tsx
 * │   └── ... (40+ more)
 * ├── features/               # NEW Feature-based modules
 * │   ├── auth/              # Login, Register, ForgotPassword, AuthGuard
 * │   ├── students/           # StudentDashboard, StudentProfile, StudentList
 * │   ├── universities/       # UniversityList, UniversityDetail, UniversityForm
 * │   └── index.ts (barrel exports)
 * ├── layouts/                # NEW Layout components
 * │   ├── MainLayout.tsx
 * │   ├── AdminLayout.tsx
 * │   ├── StudentLayout.tsx
 * │   └── PublicLayout.tsx
 * ├── shared/                 # NEW Shared resources
 * │   ├── components/         # Button, Modal, Card, Table, Form, Loading, EmptyState
 * │   ├── hooks/              # useFetch, useLocalStorage, useDebounce, useForm
 * │   └── utils/              # Utility functions
 * └── context/               # Context providers
 *     ├── AuthContext.tsx    # Authentication state
 *     └── AppContext.tsx     # Application data
 * ```
 * 
 * ## Component Hierarchy
 * 
 * ```
 * App
 * ├── AuthProvider (authentication state)
 * ├── AppProvider (app data)
 * └── Router
 *     ├── Public Routes (MainLayout)
 *     │   ├── Home
 *     │   ├── Universities (UniversityList)
 *     │   ├── University Detail (UniversityDetail)
 *     │   ├── Login (Login)
 *     │   └── Register (Register)
 *     ├── Protected Admin Routes (AdminLayout)
 *     │   ├── Dashboard
 *     │   ├── Universities (with CRUD)
 *     │   ├── Students (StudentList)
 *     │   └── Settings
 *     └── Protected Student Routes (StudentLayout)
 *         ├── Dashboard (StudentDashboard)
 *         ├── Profile (StudentProfile)
 *         └── My Universities
 * ```
 * 
 * ## Shared Component Library
 * 
 * ### Components
 * | Component | Props | Description |
 * |-----------|-------|-------------|
 * | Button | variant, size, isLoading | Reusable button with variants |
 * | Modal | isOpen, onClose, title, footer | Dialog/modal component |
 * | Card | title, subtitle, footer | Container with sections |
 * | Table | data, columns, keyExtractor | Data table with sorting |
 * | Form | label, type, error | Form field wrapper |
 * | Loading | size, text, fullscreen | Loading spinner |
 * | EmptyState | title, description, action | Empty state illustration |
 * 
 * ### Hooks
 * | Hook | Returns | Description |
 * |------|---------|-------------|
 * | useFetch | { data, isLoading, error, refetch } | Data fetching with caching |
 * | useLocalStorage | [value, setValue, removeValue] | LocalStorage sync |
 * | useDebounce | debouncedValue | Debounced input values |
 * | useForm | { values, errors, handleSubmit } | Form state management |
 * 
 * ## Data Flow
 * 
 * 1. **Online Mode**: React → API → PostgreSQL → React
 * 2. **Offline Mode**: React → SQLite → Queue → (Sync when online)
 * 3. **Real-time**: Server → SSE → React (live updates)
 * 
 * ## Import Patterns
 * 
 * ```typescript
 * // Feature imports
 * import { Login, Register, AuthGuard } from '@/app/features/auth';
 * import { StudentDashboard, StudentList } from '@/app/features/students';
 * import { UniversityList, UniversityDetail } from '@/app/features/universities';
 * 
 * // Layout imports
 * import { MainLayout, AdminLayout } from '@/app/layouts';
 * 
 * // Shared imports
 * import { Button, Modal, Card, Table } from '@/app/shared/components';
 * import { useFetch, useForm } from '@/app/shared/hooks';
 * ```
 */

module.exports = {};
