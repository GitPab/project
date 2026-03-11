# Study Abroad Cost Management Prototype - Demo Summary

## Overview
This is a modern, fully-functional web application prototype for managing study abroad costs with tight integration between **Admin** and **Student** sections. The prototype focuses on Korean/Asian universities (specifically Ajou University style) with ~50 universities across South Korea, China, Japan, Vietnam, Singapore, India, Thailand, and Malaysia.

## Key Features

### 🎯 Tight Integration Between Admin & Student

#### Student Section
1. **Student Onboarding Form** (`/student/onboarding`)
   - Students can register their interest in studying abroad
   - Captures: Name, Phone, Email, Desired University, Visa System, TOPIK Level, IELTS Score, Notes
   - Real-time cost calculation based on selected university and visa system
   - Automatically syncs to Admin's Student Monitoring dashboard

2. **Student Home Page** (`/student/home`)
   - Prominent CTA banner for free consultation
   - Browse ~50 Asian universities
   - View-only mode (students cannot edit university data)
   - Multi-language support (Vietnamese, English, Korean)

#### Admin Section
1. **Student Monitoring Dashboard** (`/admin/students`)
   - Real-time view of all student consultation requests
   - Status tracking: Pending, In Review, Approved, Contacted
   - Comprehensive student information with multi-currency display
   - Filter by status and search functionality
   - Export to Excel/PDF
   - Inline status updates
   - Detailed student modal with all information

### 💱 Multi-Currency System
- **Supported Currencies**: USD, VND, KRW
- **Exchange Rates** (Updated March 3, 2026):
  - 1 USD = 26,169 VND
  - 1 USD = 1,471 KRW
- Real-time currency conversion across all costs
- Currency switcher in header (persistent across all pages)

### 🌏 Multi-Language Support
- **Supported Languages**: Vietnamese (VI), English (EN), Korean (KR)
- Language switcher in header
- All UI elements, labels, and messages fully translated
- Language preference persists across pages

### 🏫 Ajou University Style - Korean University Data Structure

#### University Cost Structure
Each Korean university includes:

1. **Common Info**
   - Name (e.g., "ĐẠI HỌC AJOU (아주대학교)")
   - Address
   - Ranking (e.g., "15/200 Korea")
   - Majors & Major Categories
   - Scholarships

2. **Fixed Costs** (Always Apply)
   - Consulting Fee: 39M VND
   - Agency Fees: 11M VND
   - Application Fee: 100K KRW

3. **Visa System Costs** (Select One)
   - **D4-1 (Korean Language)**: 
     - Tuition: 1.45M KRW/term
     - Base Yearly: 5.8M KRW
   - **D2-2 (Undergraduate)**:
     - Tuition Range: 3.7-4.8M KRW/term
     - Base Yearly: 5.8M KRW
   - **D2-3 (Postgraduate)**:
     - Tuition Range: 2.6-4M KRW/term
     - Enrollment Fee: 900K KRW

4. **Optional Add-ons** (Student Selectable)
   - Korean Language Course: 13M VND
   - Dorm VN: 800K VND/month (1-6 months)
   - Dorm KR: 747K-1.44M KRW (3 room types)
   - Savings Account: 8-10M KRW
   - Flight: 8M VND

### 📊 Data Flow & Sync

```
Student Onboarding Form
        ↓
  Submits Information
        ↓
AppContext (Global State)
        ↓
Student Monitoring Dashboard (Admin)
        ↓
Admin can view, update status, export
```

#### Real-time Sync Features:
- ✅ Student submits form → Immediately appears in Admin dashboard
- ✅ Admin updates status → Reflected instantly
- ✅ All costs calculated in real-time using exchange rates
- ✅ Currency changes apply across entire app
- ✅ Language changes translate all text

### 🎨 Design System
- **Primary Color**: #1E40AF (Education Blue)
- **Background**: #EFF6FF (Light Blue)
- **Style**: Clean cards, responsive design, desktop-first
- **UI Library**: Radix UI components with Tailwind CSS v4
- **Icons**: Lucide React

### 📈 Demo Data

#### Sample Universities (~50 total)
1. **Ajou University** (kr-ajou-1) - Featured
2. **Seoul National University** (kr-snu-1)
3. **KAIST** (kr-kaist-1)
4. **Yonsei University** (kr-yonsei-1)
5. **Tokyo University** (jp-tokyo-1)
6. **VNU Hanoi** (vn-vnu-hanoi-1)
7. **NUS Singapore** (sg-nus-1)
8. ... and ~43 more across Asia

#### Sample Student Onboarding Entries (Pre-loaded)
1. **Nguyễn Văn Minh** - Ajou University, D2-2, TOPIK 4
2. **Trần Thị Hương** - Seoul National, D2-2, TOPIK 5 (In Review)
3. **Kim Soo-jin** - Ajou University, D4-1, TOPIK 2 (Approved)
4. **Lê Hoàng Anh** - Seoul National, D2-3, TOPIK 6 (Contacted)

### 🔐 User Roles

#### Admin
- **Credentials**: `admin@example.com` / any password
- **Access**: Full edit access to all data
- **Pages**: Dashboard, Universities, Student Monitoring, Registrations

#### Student
- **Credentials**: `student@example.com` / any password
- **Access**: View-only mode (cannot edit universities)
- **Pages**: Home, Universities, My Costs, My Progress, Onboarding

### 🚀 Key Technologies
- **Frontend**: React 18.3.1
- **Routing**: React Router 7.13.0
- **Styling**: Tailwind CSS 4.1.12
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **State Management**: React Context API
- **Export**: jsPDF 4.2.0, xlsx 0.18.5

### 📱 Responsive Features
- Desktop-first design (optimized for 1440px+)
- Mobile sidebar with hamburger menu
- Responsive grid layouts
- Touch-friendly buttons and controls

### 🎯 Navigation Structure

```
/login
├── /admin
│   ├── /dashboard
│   ├── /universities
│   ├── /university/:id
│   ├── /students (Student Monitoring)
│   └── /registrations
└── /student
    ├── /home (with CTA banner)
    ├── /universities
    ├── /university/:id
    ├── /my-costs
    ├── /my-progress
    └── /onboarding (NEW)
```

### 💡 Highlights

1. **Real-time Cost Calculator**: Onboarding form calculates initial costs as student selects university and visa system
2. **Multi-currency Display**: All costs shown in selected currency with real-time conversion
3. **Status Workflow**: Pending → In Review → Approved → Contacted
4. **Export Functionality**: Admin can export student data to Excel or PDF
5. **Search & Filter**: Quick search and status filtering in Student Monitoring
6. **Detailed Modal**: Click any student to see full details with cost breakdown
7. **Inline Editing**: Update student status directly from table
8. **Persistent State**: All data stored in React Context (simulating database)

### 🎨 UI/UX Enhancements
- Gradient backgrounds for CTA elements
- Status badges with color coding
- Hover effects and transitions
- Loading states and animations
- Toast notifications for user actions
- Responsive tables with horizontal scroll
- Card-based layouts for mobile

### 🔄 Data Consistency
- Currency conversion uses consistent exchange rates across all pages
- Language translations are comprehensive and contextual
- Student onboarding data immediately available to admin
- No data loss between page navigations (Context API)

---

## How to Use the Prototype

### As a Student:
1. Login as student (`student@example.com`)
2. Click "Apply Now" button on home page
3. Fill out the onboarding form
4. Select desired university and visa system
5. See real-time cost calculation
6. Submit form
7. Your data immediately appears in Admin's dashboard

### As an Admin:
1. Login as admin (`admin@example.com`)
2. Navigate to "Student Monitoring" (Theo dõi học viên)
3. View all student consultation requests
4. Filter by status or search by name/email
5. Click on any student to see full details
6. Update status inline or in detail modal
7. Export data to Excel or PDF

### Testing Features:
- Switch currencies (USD/VND/KRW) to see real-time conversion
- Switch languages (VI/EN/KR) to see full translations
- Submit new student onboarding forms
- Update student statuses
- Export student data
- Browse ~50 Asian universities

---

## Future Enhancements (Not Implemented)
- Real database integration (Supabase/Firebase)
- Email notifications when admin updates status
- File upload for student documents
- Payment tracking integration
- Calendar for consultation appointments
- Advanced analytics and reporting
- SMS notifications
- Multi-step progress tracking for each student

---

## Notes
- All data is stored in memory (React Context)
- Refresh will reset demo data
- Mock authentication (any password works)
- Exchange rates are simulated (not from live API)
- ~50 universities pre-loaded (Asian focus)
- 4 sample student onboarding entries pre-loaded
