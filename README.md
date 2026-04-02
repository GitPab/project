# SACMA - Student Abroad Cost Management Application

**Version:** 2.1.0  
**Status:** 🟢 Production Ready  
**Last Updated:** April 3, 2026

---

## 📱 Overview

SACMA is a comprehensive cost management platform for Vietnamese students studying abroad in Korea. It provides student onboarding, cost tracking, admin dashboards, real-time notifications, payment management, and multilingual support (Vietnamese, Korean, English).

### ✨ Key Features

- ✅ **Student Tracking System** - Unique tracking codes (SACMA-YYYYMMDD-XXXXXX)
- ✅ **VND-Based Pricing** - All costs stored in Vietnamese Dong
- ✅ **Admin Dashboard** - 22 admin pages for comprehensive management
- ✅ **Student Portal** - 6 student-facing pages with progress tracking
- ✅ **Cost Calculator** - Multi-currency support (VND, USD, KRW, JPY, CNY)
- ✅ **Multilingual UI** - Vietnamese (vi) - Full support, Korean and English planned
- ✅ **Public Onboarding** - No login required for initial registration
- ✅ **Real-time Updates** - SSE infrastructure ready (API implemented)
- ✅ **Payment Management** - Track payments and invoices
- ✅ **Document Management** - Upload and review student documents
- ✅ **Messaging System** - Internal student-admin communication
- ✅ **Appointment Scheduling** - Calendar-based meeting system
- ✅ **Scholarship Management** - Apply and manage scholarships
- ✅ **Visa Application Tracking** - Track visa status through embassy process
- ✅ **Offline-First Architecture** - SQLite sync with background queue
- ✅ **RBAC** - Role-based access control (Admin, Student, Staff, 6 roles)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (LTS)
- npm 9+
- PostgreSQL 14+ (or Supabase)
- Git

### Installation
```bash
# Clone repository
git clone <repository-url>
cd project

# Install dependencies
npm install
cd server && npm install && cd ..

# Setup environment
cp .env.example .env.local
cp server/.env.example server/.env

# Run both frontend and backend together
npm run dev:full

# Or run separately:
# Terminal 1: Backend
cd server && npm start
# Terminal 2: Frontend
npm run dev

# Build for production
npm run build
```

### Environment Variables
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001/api
```

#### Backend (server/.env)
```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/sacma
DB_TYPE=postgresql

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379

# Optional: Email (SendGrid/SMTP)
SENDGRID_API_KEY=your-sendgrid-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Development Workflow
```bash
# Check TypeScript
npm run typecheck

# Preview production build
npm run preview

# Deploy (example: Netlify)
netlify deploy --prod --dir=dist
```

---

## 📊 Features by Phase

### Phase 1: Tracking Code Infrastructure ✅
- Unique code format: `SACMA-YYYYMMDD-XXXXXX`
- Supabase integration with localStorage fallback
- Complete tracking code service layer

### Phase 2: Demo Access Removal ✅
- Removed quick demo buttons
- Eliminated demo user data
- Cleaned up 270+ lines of demo code

### Phase 3: Description Validation ✅
- Removed 100-word minimum
- Kept 250-word maximum
- Live word counter

### Phase 4: VND Default Currency ✅
- All costs stored in VND internationally
- Removed 25+ USD hardcordings
- Flexible display currency

### Phase 5: Global Currency System ✅
- Single currency selector
- Conversions through VND base
- Support: VND, USD, KRW, JPY, CNY

### Phase 6: Tracking Code Generation ✅
- Auto-generates on registration
- Persists student information
- Email-based lookup

### Phase 7: Student Tracking Page ✅
- Route: `/student/tracking/:code`
- Public access (no login)
- Multilingual support

### Phase 8: Success Confirmation ✅
- Success message on registration
- Email confirmation ready
- Clear completion flow

### Phase 9: Admin Features ✅
- Tracking codes in registrations view
- Student monitoring integration
- Status tracking

### Phase 10: Multilingual UI ✅
- Vietnamese labels default
- Korean language support
- English fallback

### Phase 11: Testing & Verification ✅
- All features tested
- Zero TypeScript errors
- Production build verified

---

## 🏗️ Project Structure

```
project/
├── src/
│   ├── app/
│   │   ├── components/        # 50+ UI components (legacy)
│   │   │   ├── ui/           # 47 shadcn/ui components
│   │   │   ├── AdminInvite.tsx
│   │   │   ├── CostCalculator.tsx
│   │   │   ├── EditUniversityModal.tsx
│   │   │   └── ... (50+ more)
│   │   ├── features/         # NEW: Feature-based modules
│   │   │   ├── auth/        # Login, Register, ForgotPassword, AuthGuard
│   │   │   ├── students/     # StudentDashboard, StudentProfile, StudentList
│   │   │   └── universities/   # UniversityList, UniversityDetail, UniversityForm
│   │   ├── layouts/          # NEW: Layout components
│   │   │   ├── MainLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── StudentLayout.tsx
│   │   │   └── PublicLayout.tsx
│   │   ├── shared/           # NEW: Shared resources
│   │   │   ├── components/   # Button, Modal, Card, Table, Form, Loading, EmptyState
│   │   │   └── hooks/        # useFetch, useLocalStorage, useDebounce, useForm
│   │   ├── pages/            # 41 page components
│   │   │   ├── Admin*.tsx    # 22 admin pages
│   │   │   ├── Student*.tsx  # 10 student pages
│   │   │   └── Public*.tsx   # 9 public pages
│   │   ├── context/          # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── AppContext.tsx
│   │   │   ├── CurrencyContext.tsx
│   │   │   └── LanguageContext.tsx
│   │   ├── services/         # Business logic
│   │   │   ├── api.ts
│   │   │   ├── trackingCodeService.ts
│   │   │   └── sqliteDatabase.ts
│   │   └── routes.tsx        # 34 route definitions
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Global styles
├── server/                   # Backend API
│   ├── routes/               # 22 API route handlers
│   ├── server.js             # Express server entry
│   └── src/                  # Server source code
├── docs/                     # Documentation
│   ├── DISCREPANCY_ANALYSIS.md  # Analysis report
│   ├── ARCHITECTURE_PLANTUML.puml
│   └── architecture/
└── package.json
```

---

## 💾 Database Schema

### tracking_codes Table
```sql
CREATE TABLE tracking_codes (
  id UUID PRIMARY KEY,
  code VARCHAR(255) UNIQUE,           -- SACMA-YYYYMMDD-XXXXXX
  student_email VARCHAR(255),
  student_name VARCHAR(255),
  student_phone VARCHAR(20),
  desired_university_id VARCHAR(255),
  desired_university_name VARCHAR(255),
  visa_system VARCHAR(50),            -- D4-1, D2-2, D2-3, etc
  topik_level VARCHAR(10),            -- 0-6
  ielts_score VARCHAR(10),
  initial_total_cost_vnd BIGINT,      -- All costs in VND
  status VARCHAR(50),                 -- pending, in-review, approved, contacted
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_code ON tracking_codes(code);
CREATE INDEX idx_email ON tracking_codes(student_email);
CREATE INDEX idx_status ON tracking_codes(status);
```

---

## 🎯 User Flows

### 📱 Public/Anonymous User Flows (No Login Required)

#### 1. Student Registration Flow
```
1. Visit homepage (/)
2. View university partners, testimonials, statistics
3. Scroll to registration form (#onboarding-form)
4. Fill required fields:
   - Full name
   - Phone number (Vietnamese format validated)
   - Desired university (Korean universities only, searchable)
   - Visa system (D2-1, D2-2, D2-3, D4-1, etc.)
   - TOPIK level (0-6, affects scholarship %)
5. Submit form
6. System generates tracking code: SACMA-YYYYMMDD-XXXXXX
7. Store in SQLite (local) + Supabase (cloud)
8. Display success with tracking code
9. Auto-navigate to /student/tracking/{code}
10. Student can view:
    - Personal information
    - Selected university details
    - Estimated costs (VND base, displayed in selected currency)
    - Application status and timeline
    - Scholarship eligibility
```

#### 2. Direct University Registration Flow
```
1. Visit /universities - Browse all Korean universities
2. Filter by tier (Top1, Top2, Top3), region, ranking
3. Click university card → Navigate to /university/:id
4. View detailed information:
   - Overview, ranking, programs
   - Cost breakdown by visa system
   - Gallery and facilities
5. Click "Register Now" → Navigate to /?uni={id}#onboarding-form
6. University pre-selected in registration form
7. Complete registration (same as flow #1)
```

#### 3. Tracking Code Lookup Flow
```
1. Visit /student/tracking
2. Enter tracking code (SACMA-YYYYMMDD-XXXXXX)
3. Or access directly via /student/tracking/{code}
4. System queries API: GET /api/public/tracking/{code}
5. Display comprehensive status:
   - Student info (name, phone, email)
   - University and visa system
   - TOPIK level and scholarship %
   - Cost breakdown (tuition, visa, accommodation, insurance)
   - Application timeline with current stage
   - Next steps and estimated completion
6. Option to return to homepage
```

---

### 🔐 Authentication Flows

#### 4. Login Flow
```
1. Visit /login
2. Enter email and password
3. System validates credentials via POST /api/auth/login
4. JWT token stored in memory (AuthContext)
5. Auto-redirect based on role:
   - Admin/Super Admin → /admin/dashboard
   - Student → /student/home
6. Layout renders with role-appropriate navigation
7. PermissionGuard protects restricted routes
```

#### 5. First-Time Setup Flow
```
1. Access /first-time-setup (protected route)
2. Create initial admin account
3. Configure system settings
4. Set up email templates
5. Initialize exchange rates
6. Redirect to /admin/dashboard
```

---

### 👨‍🎓 Student Portal Flows (Authentication Required)

#### 6. Student Dashboard Flow
```
1. Login → Redirect to /student/home
2. View dashboard widgets:
   - Welcome message with student name
   - Quick stats (applications, costs, progress)
   - Recent activity notifications
   - Upcoming deadlines
3. Navigation options:
   - Dashboard (/student/dashboard)
   - My Universities (/student/universities)
   - My Costs (/student/my-costs)
   - My Progress (/student/my-progress)
   - Submit Feedback (/student/feedback)
```

#### 7. Cost Calculator Flow
```
1. Navigate to /student/my-costs
2. System loads saved costs or creates new calculation
3. View cost breakdown by category:
   - Tuition fees (by semester/year)
   - Visa application fees
   - Accommodation (dormitory/off-campus)
   - Health insurance
   - Living expenses
   - Flight and initial setup
4. Currency converter available (VND, USD, KRW, JPY, CNY)
5. All costs stored in VND base, displayed in preference
6. Save calculation to profile
7. Export to PDF option
```

#### 8. Progress Tracking Flow
```
1. Navigate to /student/my-progress
2. View 8-stage application timeline:
   - Stage 1: Registration (Completed)
   - Stage 2: Academic Preparation
   - Stage 3: Course Completion
   - Stage 4: Admission Qualification
   - Stage 5: Visa Application
   - Stage 6: Visa Processing
   - Stage 7: Visa Received
   - Stage 8: Departure
3. Current stage highlighted with status:
   - Not Started (gray)
   - In Progress (blue)
   - Completed (green)
   - Delayed (orange)
4. Upload documents for each stage:
   - Click stage → Open modal
   - Drag & drop or select files (max 5MB)
   - Supported: JPG, PNG, PDF
   - Upload to cloud storage
   - View uploaded documents list
5. Add notes and comments per stage
6. Admin updates visible in real-time
```

#### 9. University Browsing Flow
```
1. Navigate to /student/universities
2. View list of all Korean universities
3. Filter and search:
   - By name (fuzzy search)
   - By tier (Top1, Top2, Top3)
   - By region (Seoul, Busan, etc.)
   - By ranking range
4. Sort by: Ranking, Name, Tuition (low-high)
5. Click university → View detail page
6. Compare multiple universities
7. Save favorites to profile
```

#### 10. Student Feedback Flow
```
1. Navigate to /student/feedback
2. Select feedback type:
   - General inquiry
   - Technical issue
   - Service complaint
   - Suggestion
3. Fill feedback form:
   - Subject
   - Category
   - Priority (Low, Medium, High)
   - Message
   - Attachments (optional)
4. Submit to system
5. Track feedback status:
   - Submitted → Under Review → In Progress → Resolved
6. Receive notifications on updates
```

---

### 👨‍💼 Admin Portal Flows (Role-Based Access)

#### 11. Admin Dashboard Flow
```
1. Login as Admin → Redirect to /admin/dashboard
2. View system overview:
   - Total universities count
   - Active student registrations
   - System health status
   - Recent activity feed
   - Quick action buttons
3. Access management panels:
   - Import universities (CSV/Excel)
   - Export database backup
   - View system analytics
4. Monitor key metrics:
   - Top-tier university distribution
   - Visa system configuration status
   - Students by status
```

#### 12. University Management Flow
```
1. Navigate to /admin/universities
2. View enhanced university list:
   - Quick filters (tier, status, region)
   - Bulk operations (select multiple)
   - Export to Excel
3. Add new university:
   - Manual entry form
   - Import from CSV
   - Clone existing template
4. Edit university (/admin/university/:id):
   - Basic info (name, Korean name, ranking)
   - Hero image and gallery
   - Academic programs
   - Cost configuration by visa system:
     * Tuition per semester
     * Scholarship tiers by TOPIK
     * Additional fees
   - Korean-specific data (koreanData JSON)
5. Bulk import via modal:
   - Upload CSV/Excel
   - Map columns
   - Preview changes
   - Execute import
   - View import log
```

#### 13. Student Monitoring Flow
```
1. Navigate to /admin/students
2. View all registered students:
   - Search by name, email, phone
   - Filter by status, university, visa system
   - Sort by registration date, cost, progress
3. Click student → View detailed profile:
   - Personal information
   - Registration history
   - Cost breakdown
   - Progress timeline
   - Uploaded documents
   - Communication history
4. Update student status:
   - Change application stage
   - Add admin notes
   - Upload internal documents
5. Export student data (CSV/PDF)
```

#### 14. Registration Management Flow
```
1. Navigate to /admin/registrations
2. View all applications:
   - Pending review
   - Approved
   - Rejected
   - Contacted
3. Process new registration:
   - Review student info
   - Verify documents
   - Update status with comment
   - Send notification (email/SMS)
4. Bulk operations:
   - Approve multiple
   - Export list
   - Generate reports
```

#### 15. System Administration Flows

**Audit Trail (/admin/audit)**
```
1. View system audit logs
2. Filter by:
   - User (who performed action)
   - Action type (CREATE, UPDATE, DELETE)
   - Entity type (university, student, registration)
   - Date range
3. View change details:
   - Old values
   - New values
   - IP address
   - Timestamp
4. Export audit report
```

**Email Templates (/admin/templates)**
```
1. Manage email templates:
   - Welcome email
   - Registration confirmation
   - Status update
   - Document request
   - Scholarship award
2. Edit with variables:
   - {{studentName}}
   - {{trackingCode}}
   - {{universityName}}
   - {{status}}
3. Preview before saving
4. Test send to admin
```

**Workflow Configuration (/admin/workflow)**
```
1. Define application stages:
   - Stage order
   - Required documents per stage
   - Auto-triggers
   - SLA timeframes
2. Configure notifications:
   - When to notify student
   - When to notify admin
   - Escalation rules
3. Set up approval chains
```

**User & Role Management (/admin/users, /admin/roles)**
```
1. Manage users:
   - Create new user
   - Edit permissions
   - Reset password
   - Disable/enable account
2. Role-based access control:
   - Super Admin: All permissions
   - Admin: Most permissions
   - Manager: Limited admin
   - Staff: View only
   - Student: Self-service only
3. Permission matrix:
   - university:view, create, edit, delete
   - student:view, edit, progress
   - application:view, manage
   - payment:view, create, approve
   - settings:view, edit
```

**Scholarship Management (/admin/scholarships)**
```
1. Define scholarship programs:
   - Name and description
   - Eligibility criteria
   - Award amounts
   - Application period
2. Review applications
3. Award scholarships
4. Track disbursement
```

**Visa Tracking (/admin/visa)**
```
1. Track visa applications:
   - Embassy submission
   - Processing status
   - Interview scheduling
   - Visa issuance
2. Update status per student
3. Generate visa reports
```

**Calendar & Appointments (/admin/calendar)**
```
1. View appointment calendar
2. Schedule:
   - Student consultations
   - Document reviews
   - Embassy appointments
3. Send reminders
4. Handle rescheduling
```

**Analytics & Reports (/admin/analytics)**
```
1. View dashboards:
   - Registration trends
   - University popularity
   - Cost distribution
   - Conversion rates
2. Generate reports:
   - Monthly summary
   - University performance
   - Student demographics
3. Export data (CSV, Excel, PDF)
4. Schedule automated reports
```

---

### 🔄 Data Synchronization Flows

#### 16. Offline-First Sync Flow
```
1. Student submits form offline
2. Data stored in local SQLite
3. SyncIndicator shows pending count
4. When connection restored:
   - Sync queue processes
   - Upload to Supabase
   - Update local status
   - Notify user of success
```

#### 17. Real-Time Updates (SSE)
```
1. Admin makes change
2. Server emits SSE event
3. Connected clients receive update
4. UI refreshes automatically
5. Student sees update without reload
```

---

## 🔐 Security Features

- **Hash Routing** - Works on static hosting
- **RLS Policies** - Row Level Security in Supabase
- **Environment Variables** - Sensitive data protected
- **Input Validation** - All forms validated
- **HTTPS Ready** - Secure deployment ready

---

## 📈 Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Build Time** | ~6s | Vite 6.x with optimized config |
| **Bundle Size** | ~850 KB | Includes all 120+ components |
| **Gzipped Size** | ~260 KB | Production optimized |
| **TypeScript Errors** | 0 | Clean build |
| **ESLint Errors** | 0 | All rules passing |
| **Routes** | 34 | Public + Student + Admin |
| **Components** | 120+ | shadcn/ui + Legacy + Features |
| **Test Coverage** | Manual testing | Unit tests planned |
| **Lighthouse Score** | 85+ | Varies by page |
| **API Response Time** | <200ms | Average for cached endpoints |
| **Database** | PostgreSQL + SQLite | Dual storage strategy |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18.3.1 with TypeScript 5.x
- **Routing:** React Router v7 (hash-based for static hosting)
- **State Management:** 
  - React Context (Auth, App, Currency, Language)
  - Zustand (optional, available in deps)
- **Build Tool:** Vite 6.x
- **Styling:** Tailwind CSS 4.x
- **UI Components:** 
  - shadcn/ui (47 Radix-based components)
  - Lucide React (icons)
  - Custom components (50+ legacy + 15 feature-based)
- **Forms:** React Hook Form + Zod validation
- **Data Fetching:** TanStack Query (React Query)
- **Notifications:** Sonner (toast notifications)
- **Charts:** Recharts
- **QR/Barcode:** html5-qrcode, qrcode.react
- **PDF:** jspdf

### Backend
- **Runtime:** Node.js 18+ (LTS)
- **Framework:** Express.js
- **Database:**
  - PostgreSQL (production, via Supabase or self-hosted)
  - SQLite (local/offline cache)
  - MySQL (legacy support via adapter)
- **Caching:** Redis (optional, ioredis)
- **Auth:** JWT (custom implementation)
- **Email:** SendGrid API + Nodemailer (SMTP)
- **Logging:** Pino + Winston
- **API Docs:** Swagger (swagger-jsdoc, swagger-ui-express)
- **Real-Time:** Server-Sent Events (SSE)
- **Excel/CSV:** ExcelJS, xlsx, csvSanitizer

### DevOps & Tools
- **Package Manager:** pnpm (preferred) or npm
- **Linting:** ESLint 9.x with TypeScript plugin
- **Formatting:** Prettier 3.x
- **Testing:** Vitest (configured, tests in progress)
- **Type Checking:** TypeScript 5.x (strict mode)
- **Scripts:**
  - `dev:full` - Start frontend + backend
  - `typecheck` - TypeScript validation
  - `smoke` - Post-deployment health check
  - `backup` - Database backup
  - `maintenance:daily` - Automated daily tasks

---

## 📦 Dependencies

### Key Production Dependencies
```json
{
  "react": "18.3.1",
  "react-router": "7.13.0",
  "typescript": "^5.4.0",
  "tailwindcss": "4.1.12",
  "vite": "6.4.1",
  "@tanstack/react-query": "^5.95.2",
  "react-hook-form": "7.55.0",
  "zod": "^3.23.8",
  "sonner": "2.0.3",
  "lucide-react": "0.487.0",
  "recharts": "2.15.2",
  "axios": "^1.13.6",
  "date-fns": "3.6.0"
}
```

### Key Backend Dependencies
```json
{
  "express": "latest",
  "pg": "latest (PostgreSQL)",
  "mysql2": "^3.20.0",
  "redis": "^5.11.0",
  "ioredis": "^5.10.1",
  "@sendgrid/mail": "^8.1.6",
  "nodemailer": "^8.0.4",
  "jsonwebtoken": "latest",
  "bcryptjs": "latest",
  "pino": "^10.3.1",
  "winston": "^3.19.0",
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.1"
}
```

---

## 🚀 Deployment Options

### Recommended: Netlify (Frontend) + Render/Railway (Backend)
```bash
# Build frontend
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist

# Backend auto-deploys via Git push to Render
```

### Alternative Platforms
- **Vercel:** `vercel --prod` (frontend only)
- **GitHub Pages:** Static hosting with `gh-pages` branch
- **AWS:** S3 + CloudFront for frontend, EC2/ECS for backend
- **Docker:** Multi-stage build with Node.js 18+ Alpine

### Database Options
- **Supabase:** Managed PostgreSQL (recommended)
- **Self-hosted:** PostgreSQL 14+ on VPS
- **Development:** SQLite (zero config)

---

## 🧪 Testing Strategy

### Current Testing
- ✅ **TypeScript:** Strict mode, 0 errors
- ✅ **ESLint:** All rules passing
- ✅ **Manual Testing:** End-to-end flows verified
- ✅ **Build Verification:** Production builds tested

### Planned Testing
- 🚧 **Unit Tests:** Vitest + React Testing Library
- 🚧 **Integration Tests:** API endpoint testing
- 🚧 **E2E Tests:** Playwright/Cypress for critical flows
- 🚧 **Visual Regression:** Storybook + Chromatic

### Manual Testing Checklist
- [x] Student registration works end-to-end
- [x] Tracking code generates unique codes
- [x] Admin sees all registrations
- [x] Currency conversions accurate (VND base)
- [x] Vietnamese language displays correctly
- [x] Mobile responsive (tested on iOS/Android)
- [x] No demo access available (removed in Phase 2)
- [x] Database persistence works (SQLite + Supabase)
- [x] API health checks pass
- [x] RBAC permissions working
- [ ] Korean/English translations (pending)
- [ ] Automated test suite (in progress)

### Running Quality Checks
```bash
# TypeScript type check
npm run typecheck

# ESLint check
npm run lint

# Build verification
npm run build

# Preview production build
npm run preview

# Health check (after deploy)
npm run smoke

# Daily maintenance
npm run maintenance:daily
```

---

## 📋 Tracking Code Format

Format: `SACMA-YYYYMMDD-XXXXXX`

Example: `SACMA-20260312-ABC123`

**Components:**
- `SACMA` - Application prefix
- `YYYYMMDD` - Generation date
- `XXXXXX` - 6 random alphanumeric characters (A-Z, 0-9)

**Generation Logic:**
```typescript
const generateTrackingCode = (): string => {
  const date = new Date();
  const yyyy = date.getFullYear();           // 2026
  const mm = String(date.getMonth() + 1).padStart(2, '0');  // 03
  const dd = String(date.getDate()).padStart(2, '0');       // 12

  // Generate 6 random alphanumeric
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `SACMA-${yyyy}${mm}${dd}-${randomPart}`;
};
```

---

## 💱 Currency System

### Supported Currencies
- **VND** (Vietnamese Dong) - Base currency
- **USD** (US Dollar)
- **KRW** (Korean Won)
- **JPY** (Japanese Yen)
- **CNY** (Chinese Yuan)

### Exchange Rates (as of March 3, 2026)
```
1 USD = 26,192 VND
1 KRW = 17.77 VND
1 JPY = 166.67 VND
1 CNY = 3,792 VND
```

### Conversion Flow
```
Input Currency → VND (Base) → Output Currency
```

---

## 🌐 Language Support

### Supported Languages
- **Vietnamese** (vi) - ✅ Fully Implemented (180+ translated labels)
- **Korean** (ko) - 🚧 Planned (infrastructure ready)
- **English** (en) - 🚧 Planned (infrastructure ready)

### Current Implementation
The application has full i18n infrastructure with:
- `LanguageProvider` context wrapping the app
- `useLanguage()` hook for translations
- `t('key')` function for label lookup
- 180+ Vietnamese translations in `src/app/context/LanguageContext.tsx`

### Language Switching
Infrastructure is ready for language toggle, but currently only Vietnamese is available.  
Translation system supports easy addition of Korean and English.

### Label Examples (Vietnamese)
| Feature | VI |
|---------|----|
| Registration | Đăng ký |
| Tracking Code | Mã theo dõi |
| Status | Trạng thái |
| Cost | Chi phí |
| Dashboard | Trang chủ |
| Universities | Danh sách trường |
| Login | Đăng nhập |

---

## �️ Routes Reference

### Public Routes
| Route | Page | Description |
|-------|------|-------------|
| `/` | PublicOnboarding | Student registration form |
| `/universities` | UniversityInfo | List all universities |
| `/university/:id` | UniversityDetailRedesigned | University detail page |
| `/login` | Login | User authentication |
| `/first-time-setup` | FirstTimeSetup | Initial admin setup |
| `/student/tracking` | TrackingLookupSimple | Public tracking lookup |

### Student Routes (Protected)
| Route | Page | Description |
|-------|------|-------------|
| `/student/dashboard` | StudentDashboard | Student home dashboard |
| `/student/home` | StudentHome | Alternative student view |
| `/student/universities` | StudentUniversities | Browse universities |
| `/student/my-costs` | StudentOnboarding | Cost calculator |
| `/student/my-progress` | ProgressTracker | Track application progress |
| `/student/feedback` | StudentFeedbackPage | Submit feedback |

### Admin Routes (Protected - 22 pages)
| Route | Page | Description |
|-------|------|-------------|
| `/admin/dashboard` | AdminDashboard | Admin overview |
| `/admin/universities` | UniversitiesListEnhancedRedesigned | Manage universities |
| `/admin/university/:id` | UniversityDetailAdmin | Edit university |
| `/admin/students` | StudentMonitoring | View all students |
| `/admin/registrations` | AdminRegistrations | Manage registrations |
| `/admin/audit` | AdminAuditTrail | System audit logs |
| `/admin/templates` | AdminEmailTemplates | Email template management |
| `/admin/workflow` | AdminWorkflow | Workflow configuration |
| `/admin/settings` | AdminSettings | System settings |
| `/admin/bulk` | AdminBulkOperations | Bulk data operations |
| `/admin/scholarships` | AdminScholarships | Scholarship management |
| `/admin/visa` | AdminVisaTracking | Visa application tracking |
| `/admin/calendar` | AdminCalendar | Appointment scheduling |
| `/admin/feedback` | AdminFeedback | View student feedback |
| `/admin/analytics` | AdminAnalyticsDashboard | Analytics & reports |
| `/admin/users` | AdminUsers | User management |
| `/admin/roles` | AdminRoles | Role & permission management |
| `/admin/maintenance` | AdminMaintenance | System maintenance |
| `/admin/media` | AdminMediaLibrary | Media file management |
| `/admin/exchange-rates` | AdminExchangeRates | Currency rate management |

---

## � API Endpoints Reference

### Tracking Code Service
```typescript
// Generate unique code
generateUniqueTrackingCode(): Promise<string>

// Save code
saveTrackingCode(payload: TrackingCodePayload): Promise<TrackingCode>

// Get code
getTrackingCode(code: string): Promise<TrackingCode>

// Search codes
searchTrackingCodesByEmail(email: string): Promise<TrackingCode[]>

// Update status
updateTrackingCodeStatus(code: string, status: string): Promise<TrackingCode>

// Get all codes
getAllTrackingCodes(): Promise<TrackingCode[]>
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Student registration works end-to-end
- [ ] Tracking code generates unique
- [ ] Admin sees all registrations
- [ ] Currency conversions accurate
- [ ] All languages display correctly
- [ ] Mobile responsive
- [ ] No demo access available
- [ ] Database persistence works
- [ ] Supabase integration ready

### Running Tests
```bash
# TypeScript check
npm run typecheck

# Build verification
npm run build

# Preview build
npm run preview
```

---

## 📞 Support & Troubleshooting

### Common Issues & Solutions

**Q: Student registration not saving**
- Check browser console for errors
- Verify SQLite is enabled in browser
- Check network connection for Supabase sync
- Clear localStorage and retry: `localStorage.clear()`

**Q: Tracking code lookup fails**
- Ensure code format: `SACMA-YYYYMMDD-XXXXXX`
- Check if code exists in database
- Try URL format: `/student/tracking/{code}`
- Verify backend API is running: `GET /api/health`

**Q: Admin cannot access dashboard**
- Verify JWT token not expired
- Check user role in AuthContext
- Clear browser cache and cookies
- Try re-login at `/login`

**Q: Currency conversion showing wrong values**
- Verify exchange rates in `CurrencyContext.tsx`
- Check VND base calculation
- Refresh page to reload rates
- Update rates via `/admin/exchange-rates`

**Q: Deployment shows blank page**
- Verify `base: './'` in `vite.config.ts`
- Check all routes use HashRouter
- Ensure `dist/` folder has all assets
- Check browser console for 404 errors

**Q: Images not loading**
- Check image URLs are absolute or properly relative
- Verify `public/` folder assets copied to `dist/`
- Check Content Security Policy headers
- Ensure images are in supported formats (jpg, png, webp)

**Q: API connection errors**
- Verify backend running on correct port (3001)
- Check `VITE_API_URL` in `.env.local`
- Review CORS configuration in `server.js`
- Test with `npm run smoke`

### Debug Mode

Enable verbose logging:
```bash
# Frontend
debug=true npm run dev

# Backend
DEBUG=* npm start
```

### Performance Issues

**Slow page load:**
- Check bundle size: `npm run build` → analyze `dist/`
- Enable code splitting for routes
- Lazy load heavy components
- Optimize images (use webp format)

**Database slow:**
- Check PostgreSQL indexes
- Enable Redis caching
- Review slow queries in logs
- Consider connection pooling

---

## 📚 Additional Resources

### Documentation
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment instructions
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Database setup and configuration
- [DISCREPANCY_ANALYSIS.md](./DISCREPANCY_ANALYSIS.md) - Current vs documented features
- [CHANGELOG.md](./CHANGELOG.md) - Version history and release notes

### Architecture
- [docs/architecture/README.md](./docs/architecture/README.md) - System architecture
- [docs/ARCHITECTURE_PLANTUML.puml](./docs/ARCHITECTURE_PLANTUML.puml) - UML diagrams
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development guidelines
- [docs/MAINTAINABILITY.md](./docs/MAINTAINABILITY.md) - Maintenance checklist

### External References
- [Vite Docs](https://vitejs.dev) - Build tool documentation
- [React Router Docs](https://reactrouter.com) - Routing documentation
- [Tailwind CSS Docs](https://tailwindcss.com) - Styling documentation
- [shadcn/ui](https://ui.shadcn.com) - UI component library
- [React Query](https://tanstack.com/query) - Data fetching
- [React Hook Form](https://react-hook-form.com) - Form management

### API Documentation
- Swagger UI: `http://localhost:3001/api-docs` (when backend running)
- OpenAPI Spec: `server/swagger.js`

### Community & Support
- **Email:** dev@sacma.com
- **Slack:** #sacma-dev
- **Issues:** GitHub Issues (for bug reports)
- **Wiki:** Internal Confluence (for detailed specs)

---

## 📄 License

Proprietary - SACMA Project 2026

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.0 | 2026-04-03 | 25+ UI components, layouts, shared hooks, clean build |
| 2.0.0 | 2026-04-02 | 22 API routes, feature organization, Phase 12 complete |
| 1.0.0 | 2026-03-12 | Initial release - Phase 1-11 complete |

---

## ✅ Completion Checklist

### Phase 1-11: Core Features (v1.0.0) ✅
- [x] Phase 1: Tracking infrastructure
- [x] Phase 2: Demo removal
- [x] Phase 3: Description validation
- [x] Phase 4: VND currency
- [x] Phase 5: Global currency system
- [x] Phase 6: Code generation
- [x] Phase 7: Tracking page
- [x] Phase 8: Success flow
- [x] Phase 9: Admin features
- [x] Phase 10: Multilingual infrastructure
- [x] Phase 11: Testing

### Phase 12: API Integration (v2.0.0) ✅
- [x] 22 API Routes implemented
- [x] Payment Management API
- [x] Student Profiles API
- [x] Notifications API (SSE)
- [x] Documents API
- [x] Programs API
- [x] Messages API
- [x] Appointments API
- [x] Scholarships API
- [x] Visa Applications API
- [x] User Preferences API

### Phase 13: Project Organization (v2.0.0) ✅
- [x] Feature-based structure
- [x] Server organization (src/)
- [x] Documentation structure
- [x] Code cleanup (8 files removed)

### Phase 14: UI Components (v2.1.0) ✅
- [x] Auth components (Login, Register, ForgotPassword, AuthGuard)
- [x] Student components (Dashboard, Profile, List)
- [x] University components (List, Detail, Form)
- [x] Layout system (Main, Admin, Student, Public)
- [x] Shared components (Button, Modal, Card, Table, Form, Loading, EmptyState)
- [x] Shared hooks (useFetch, useLocalStorage, useDebounce, useForm)
- [x] All barrel files updated
- [x] TypeScript: 0 errors
- [x] ESLint: 0 errors

---

**Status:** 🟢 **READY FOR PRODUCTION DEPLOYMENT**

Last updated: 2026-04-03
Next review: 2026-05-03
