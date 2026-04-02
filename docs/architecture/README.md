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
 * ### Feature-Based Structure
 * ```
 * src/
 * ├── app/
 * │   ├── features/
 * │   │   ├── auth/              # Login, Register, ForgotPassword, AuthGuard, useAuth
 * │   │   ├── universities/        # UniversityList, UniversityDetail, UniversityForm, useUniversities
 * │   │   ├── students/           # StudentDashboard, StudentProfile, StudentList, useStudents
 * │   │   ├── registrations/      # Registration forms
 * │   │   ├── payments/           # Payments, invoices
 * │   │   ├── messages/           # Chat system
 * │   │   ├── notifications/      # Notifications
 * │   │   └── admin/              # Admin panel
 * │   ├── layouts/                # Page layouts
 * │   │   ├── MainLayout.tsx      # Public site layout
 * │   │   ├── AdminLayout.tsx     # Admin dashboard
 * │   │   ├── StudentLayout.tsx   # Student portal
 * │   │   └── PublicLayout.tsx    # Marketing pages
 * │   └── shared/                 # Shared resources
 * │       ├── components/         # Reusable UI components
 * │       │   ├── Button.tsx      # Button with variants
 * │       │   ├── Modal.tsx       # Dialog component
 * │       │   ├── Card.tsx        # Container component
 * │       │   ├── Table.tsx       # Data table
 * │       │   ├── Form.tsx        # Form fields
 * │       │   ├── Loading.tsx     # Loading spinner
 * │       │   └── EmptyState.tsx  # Empty state
 * │       ├── hooks/              # Custom React hooks
 * │       │   ├── useFetch.ts     # Data fetching
 * │       │   ├── useLocalStorage.ts
 * │       │   ├── useDebounce.ts
 * │       │   └── useForm.ts
 * │       └── utils/              # Utility functions
 * ├── assets/                     # Images, fonts
 * └── styles/                     # Global styles
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
