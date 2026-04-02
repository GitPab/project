/**
 * 📁 PROJECT STRUCTURE ORGANIZATION
 * 
 * This document describes the organized structure of the Du Hoc Cost Manager project.
 * 
 * ### Phase 14: UI Components & Layouts ✅ (April 2026)
 * - ✅ **25+ New Components** - Complete UI infrastructure
 * - ✅ **Auth Components** - Login, Register, ForgotPassword, AuthGuard
 * - ✅ **Student Components** - Dashboard, Profile, List with hooks
 * - ✅ **University Components** - List, Detail, Form with hooks
 * - ✅ **Layout System** - Main, Admin, Student, Public layouts
 * - ✅ **Shared Components** - Button, Modal, Card, Table, Form, Loading, EmptyState
 * - ✅ **Shared Hooks** - useFetch, useLocalStorage, useDebounce, useForm
 * - ✅ **Clean Build** - 0 TypeScript errors, 0 ESLint errors
 * 
 * ### Phase 13: Project Organization ✅ (April 2026)
 * - ✅ **Feature-Based Structure** - Organized by domain
 * - ✅ **Clean Architecture** - Separated concerns
 * - ✅ **Documentation** - Comprehensive docs
 * - ✅ **Code Cleanup** - Removed 8 duplicate/old files
 * 
 * ### Phase 12: API Integration & Data Flow ✅ (April 2026)
 * - ✅ **15 New API Routes** - All features connected to database
 * - ✅ **Payment API** - Financial transactions management
 * - ✅ **Student Profiles API** - Extended student information
 * - ✅ **Notifications API** - Real-time notifications
 * - ✅ **Documents API** - File upload and management
 * - ✅ **Programs API** - Study programs management
 * - ✅ **Messages API** - Internal messaging system
 * - ✅ **Appointments API** - Calendar scheduling
 * - ✅ **Scholarships API** - Scholarship applications
 * - ✅ **Visa Applications API** - Visa tracking
 * - ✅ **User Preferences API** - User settings
 * - ✅ **SSE Real-time** - Live updates via Server-Sent Events
 * - ✅ **Offline Sync** - Queue offline changes, sync when online
 * 
 * ---
 * 
 * ## 🗂️ Root Directory Structure
 * 
 * ```
 * project/
 * ├── 📁 .github/                  # GitHub workflows & templates
 * ├── 📁 .vscode/                  # VS Code settings & extensions
 * ├── 📁 docs/                     # Documentation
 * │   ├── 📁 architecture/         # System architecture docs
 * │   ├── 📁 api/                  # API documentation
 * │   └── 📁 deployment/           # Deployment guides
 * ├── 📁 scripts/                  # Build & automation scripts
 * ├── 📁 server/                   # Backend (Node.js/Express)
 * │   ├── 📁 src/
 * │   │   ├── 📁 config/           # Configuration files
 * │   │   ├── 📁 middleware/       # Express middleware
 * │   │   ├── 📁 routes/           # API route handlers (15 files)
 * │   │   ├── 📁 controllers/      # Business logic controllers
 * │   │   ├── 📁 services/         # Database & external services
 * │   │   ├── 📁 utils/            # Helper functions
 * │   │   │   ├── helpers/
 * │   │   │   └── validators/
 * │   │   └── 📁 types/            # TypeScript type definitions
 * │   ├── 📁 tests/                # Server-side tests
 * │   ├── 📁 migrations/           # Database migrations
 * │   └── server.js                # Entry point
 * ├── 📁 src/                      # Frontend (React/TypeScript)
 * │   ├── 📁 app/
 * │   │   ├── 📁 features/         # Feature-based modules
 * │   │   │   ├── 📁 auth/          # Authentication (Login, Register, RBAC)
 * │   │   │   ├── 📁 universities/  # University management
 * │   │   │   ├── 📁 students/      # Student portal
 * │   │   │   ├── 📁 registrations/# Registration & tracking
 * │   │   │   ├── 📁 payments/      # Payment management
 * │   │   │   ├── 📁 messages/      # Messaging system
 * │   │   │   ├── 📁 notifications/ # Notifications
 * │   │   │   └── 📁 admin/         # Admin panel
 * │   │   ├── 📁 layouts/          # Layout components
 * │   │   │   ├── MainLayout.tsx
 * │   │   │   ├── AdminLayout.tsx
 * │   │   │   └── StudentLayout.tsx
 * │   │   ├── 📁 shared/            # Shared resources
 * │   │   │   ├── 📁 components/     # Reusable UI components
 * │   │   │   ├── 📁 hooks/          # Custom React hooks
 * │   │   │   └── 📁 utils/          # Utility functions
 * │   │   ├── App.tsx
 * │   │   └── routes.tsx
 * │   ├── 📁 assets/                # Static assets (images, fonts)
 * │   └── 📁 styles/                # Global styles & themes
 * ├── 📁 public/                   # Public static files
 * ├── 📁 tests/                    # E2E & integration tests
 * └── 📄 Configuration files
 *     ├── package.json
 *     ├── tsconfig.json
 *     ├── vite.config.ts
 *     └── README.md
 * ```
 * 
 * ## 📊 Statistics
 * 
 * | Category | Count |
 * |----------|-------|
 * | API Routes | 22 files |
 * | Database Tables | 31 |
 * | Frontend Features | 8 modules |
 * | Features Connected | 100% |
 * 
 * ## 🔗 Key Features
 * 
 * ### Backend (server/routes/)
 * - **Core APIs (7)**: auth, universities, students, registrations, public, health, database
 * - **Feature APIs (10)**: payments, student-profiles, notifications, documents, programs, messages, appointments, scholarships, visa-applications, user-preferences
 * - **Utility APIs (5)**: uploads, features, admin-invite, media, exchange-rates
 * - **Real-time**: SSE /api/sse/registrations
 * 
 * ### Frontend (src/app/features/)
 * - **auth/**: Login, Register, ForgotPassword, AuthGuard, useAuth
 * - **universities/**: UniversityList, UniversityDetail, UniversityForm, useUniversities
 * - **students/**: StudentDashboard, StudentProfile, StudentList, useStudents
 * - **registrations/**: RegistrationForm, RegistrationList, TrackingLookup
 * - **payments/**: PaymentList, PaymentForm, PaymentSummary
 * - **messages/**: MessageInbox, MessageThread, MessageCompose
 * - **notifications/**: NotificationBell, NotificationList
 * - **admin/**: AdminDashboard, UserManagement, Analytics, Settings
 * 
 * ### Layouts (src/app/layouts/)
 * - **MainLayout.tsx**: Public site with navigation
 * - **AdminLayout.tsx**: Admin dashboard with sidebar
 * - **StudentLayout.tsx**: Student portal layout
 * - **PublicLayout.tsx**: Marketing pages layout
 * 
 * ### Shared UI Components (shadcn/ui - 47 components)
 * - **Layout**: Layout, Header, EnhancedFooter, Sidebar, Navigation
 * - **Data Display**: Card, Table, DataTable, Chart, StatCard, Badge, Calendar
 * - **Forms**: Form, Input, Textarea, Select, Checkbox, RadioGroup, Switch, Label
 * - **Overlays**: Modal, Dialog, AlertDialog, Drawer, Sheet, Popover, Tooltip, HoverCard
 * - **Navigation**: Tabs, Breadcrumb, Command, NavigationMenu, Menubar, Pagination
 * - **Feedback**: Alert, Progress, Skeleton, Sonner (toast)
 * - **Advanced**: Accordion, Collapsible, ContextMenu, DropdownMenu, Resizable, ScrollArea, Slider, Toggle, ToggleGroup, InputOTP, AspectRatio, Avatar, Separator
 * 
 * ### Feature Components (src/app/components/)
 * - **Admin**: AdminInvite, RoleManagement, BulkOperationsPanel, PermissionGuard, PermissionRoute, PrivateRoute
 * - **Universities**: UniversityCard, SchoolCard, RecommendedSchools, UniversityPartners, UniversitySystemsManager, UniversitiesListEnhancedRedesigned, EditUniversityModal, ImportUniversitiesModal, QuickInfoModal, UniversityForm (legacy)
 * - **Students**: StudentInfoCard, StudentInfoSidebar, StudentFixedSidebar, StudentUniversityList
 * - **Cost Management**: CostCalculator, CostInputForm, FeeManager, SplitTuitionInput, PriceInput, TierBreakdownBar, TierMini, TierTab
 * - **Registration**: RegistrationModal, QuickSearchForm
 * - **Utilities**: ErrorBoundary, RouteError, RouteValidator, SyncIndicator, QRCodeModal, QRScannerModal
 * - **Marketing**: ScholarshipBanner, Testimonials, Logo (variants: TBTLogo, NewLogo, LogoTest), Statistics
 * 
 * ### Context & Providers (src/app/context/)
 * - AuthContext.tsx - Authentication state & useAuth hook
 * - AppContext.tsx - Application data management
 * 
 * ### Shared Components (src/app/shared/components/) - NEW
 * - Button, Modal, Card, Table, Form, Loading, EmptyState
 * 
 * ### Shared Hooks (src/app/shared/hooks/) - NEW
 * - useFetch, useLocalStorage, useDebounce, useForm
 * 
 * ## 🚀 Getting Started
 * 
 * 1. Install dependencies: `npm install`
 * 2. Start server: `cd server && npm start`
 * 3. Start frontend: `npm run dev`
 * 4. Access: http://localhost:5173
 */

export {};
