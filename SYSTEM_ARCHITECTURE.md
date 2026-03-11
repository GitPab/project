# System Architecture & Data Flow

## 📐 Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FIGMA MAKE APP                          │
│                 Study Abroad Cost Management                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL CONTEXTS                          │
├─────────────────────────────────────────────────────────────┤
│  AppContext         │  CurrencyContext  │  LanguageContext  │
│  - Universities     │  - USD/VND/KRW    │  - VI/EN/KR      │
│  - Student Data     │  - Exchange Rates │  - Translations  │
│  - Onboarding       │  - Formatters     │  - t() function  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│      ADMIN ROUTES         │   │     STUDENT ROUTES        │
├───────────────────────────┤   ├───────────────────────────┤
│ /admin/dashboard          │   │ /student/home             │
│ /admin/universities       │   │ /student/universities     │
│ /admin/students           │   │ /student/university/:id   │
│ /admin/registrations      │   │ /student/my-costs         │
│ /admin/university/:id     │   │ /student/my-progress      │
│                           │   │ /student/onboarding  ★NEW │
└───────────────────────────┘   └───────────────────────────┘
```

## 🔄 Student Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  STUDENT JOURNEY                            │
└─────────────────────────────────────────────────────────────┘

Step 1: Student Login
   │
   ▼
┌──────────────────────────┐
│   Student Home Page      │
│ ┌──────────────────────┐ │
│ │  🎯 CTA Banner       │ │
│ │  "Free Consultation" │ │
│ │  [Apply Now Button]  │ │
│ └──────────────────────┘ │
└──────────────────────────┘
   │
   │ Click "Apply Now"
   ▼
┌──────────────────────────┐
│ Student Onboarding Form  │
├──────────────────────────┤
│ 📝 Personal Info         │
│   - Name                 │
│   - Phone                │
│   - Email                │
│                          │
│ 🎓 Academic Info         │
│   - Desired University   │
│   - Visa System (D4/D2)  │
│   - TOPIK Level          │
│   - IELTS Score          │
│                          │
│ 💰 Cost Estimate (Auto)  │
│   - Fixed Costs          │
│   - Visa System Costs    │
│   - Total: $XX,XXX       │
│                          │
│ 📄 Notes (Optional)      │
│                          │
│ [Submit Button]          │
└──────────────────────────┘
   │
   │ Submit Form
   ▼
┌──────────────────────────┐
│   AppContext.add         │
│   StudentOnboarding()    │
│                          │
│ Creates new entry:       │
│ - ID: timestamp          │
│ - Status: 'pending'      │
│ - SubmittedAt: now       │
└──────────────────────────┘
   │
   │ Data stored in Context
   ▼
┌──────────────────────────┐
│ ✅ Success Toast         │
│ "Đã gửi thông tin!"      │
│                          │
│ Navigate to:             │
│ /student/universities    │
└──────────────────────────┘
```

## 👨‍💼 Admin Monitoring Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN DASHBOARD                           │
└─────────────────────────────────────────────────────────────┘

Step 1: Admin Login
   │
   ▼
┌──────────────────────────────────────────────────────────────┐
│             Admin Student Monitoring Page                    │
├──────────────────────────────────────────────────────────────┤
│ 📊 Stats Cards                                               │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │Total │ │Pending│ │Review│ │Approved│Contacted│TotalCost   │
│ │  4   │ │  1   │ │  1   │ │  1   │ │  1   │ │$XX,XXX│     │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
│                                                              │
│ 🔍 Search & Filter                                           │
│ ┌────────────────────────────┐ ┌────────────────┐           │
│ │ Search by name, email...   │ │ Filter: [All] ▼│           │
│ └────────────────────────────┘ └────────────────┘           │
│                                                              │
│ 📋 Students Table                                            │
│ ┌──────────────────────────────────────────────────────────┐│
│ │Name     │Contact │University│Proficiency│Cost  │Status  ││
│ ├──────────────────────────────────────────────────────────┤│
│ │Nguyễn   │+84...  │Ajou      │TOPIK 4    │$18.5K│[Pending]││
│ │Trần     │+84...  │SNU       │TOPIK 5    │$20.8K│[Review] ││
│ │Kim      │+84...  │Ajou      │TOPIK 2    │$12.5K│[Approved││
│ │Lê       │+84...  │SNU       │TOPIK 6    │$19.2K│[Contacted││
│ └──────────────────────────────────────────────────────────┘│
│                                                              │
│ Actions: [Excel Export] [PDF Export]                        │
└──────────────────────────────────────────────────────────────┘
   │
   │ Click student row or 👁️ icon
   ▼
┌──────────────────────────────────────────────────────────────┐
│              Student Detail Modal                            │
├──────────────────────────────────────────────────────────────┤
│ 👤 Personal Information                                      │
│   Name: Nguyễn Văn Minh                                      │
│   Email: nguyenvanminh@example.com                           │
│   Phone: +84 987 654 321                                     │
│   Submitted: 2026-02-28                                      │
│                                                              │
│ 🎓 Academic Information                                      │
│   University: Ajou University                                │
│   Visa System: D2-2 (Undergraduate)                          │
│   TOPIK: 4 | IELTS: 6.5                                      │
│                                                              │
│ 💰 Cost Estimate                                             │
│   Initial Total: $18,500                                     │
│   (Auto-calculated based on selections)                      │
│                                                              │
│ 📝 Notes                                                     │
│   "Interested in Computer Engineering program..."            │
│                                                              │
│ 📊 Status Management                                         │
│   Current: [Pending ▼]                                       │
│   Change to: Pending | In Review | Approved | Contacted     │
│                                                              │
│ [Close]                                                      │
└──────────────────────────────────────────────────────────────┘
```

## 💱 Currency Conversion Flow

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-CURRENCY SYSTEM                          │
└─────────────────────────────────────────────────────────────┘

User clicks currency switcher
   │
   ▼
┌──────────────────────────┐
│  CurrencyContext         │
│  setCurrency(newCurrency)│
└──────────────────────────┘
   │
   ▼
┌──────────────────────────┐
│  Exchange Rates          │
│  USD → VND: × 26,169     │
│  USD → KRW: × 1,471      │
│  VND → USD: ÷ 26,169     │
│  KRW → USD: ÷ 1,471      │
└──────────────────────────┘
   │
   ▼
┌──────────────────────────┐
│  formatCurrency(amount)  │
│  - Converts to target    │
│  - Formats with symbol   │
│  - Returns string        │
└──────────────────────────┘
   │
   ▼
┌──────────────────────────┐
│  All UI Updates          │
│  - Tables                │
│  - Cards                 │
│  - Forms                 │
│  - Modals                │
│  ✅ Real-time            │
└──────────────────────────┘
```

## 🌐 Language Translation Flow

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-LANGUAGE SYSTEM                          │
└─────────────────────────────────────────────────────────────┘

User clicks language switcher
   │
   ▼
┌──────────────────────────┐
│  LanguageContext         │
│  setLanguage(newLang)    │
└──────────────────────────┘
   │
   ▼
┌──────────────────────────┐
│  Translation Dictionary  │
│  {                       │
│    vi: {...},            │
│    en: {...},            │
│    ko: {...}             │
│  }                       │
└──────────────────────────┘
   │
   ▼
┌──────────────────────────┐
│  t(key) function         │
│  - Looks up key          │
│  - Returns translation   │
│  - Fallback to key       │
└──────────────────────────┘
   │
   ▼
┌──────────────────────────┐
│  All UI Updates          │
│  - Headers               │
│  - Buttons               │
│  - Labels                │
│  - Messages              │
│  ✅ Real-time            │
└──────────────────────────┘
```

## 🎯 Data Structure

### StudentOnboardingData
```typescript
{
  id: string;                    // Timestamp-based
  name: string;                  // Full name
  phone: string;                 // Phone number
  email: string;                 // Email address
  desiredUniversity: string;     // University ID
  visaSystem: string;            // D4-1, D2-2, D2-3
  topikLevel?: string;           // 1-6 or "none"
  ieltsScore?: string;           // Score (e.g., "6.5")
  initialTotalCost: number;      // Calculated in USD
  notes?: string;                // Additional notes
  submittedAt: string;           // ISO timestamp
  status: 'pending' | 'in-review' | 'approved' | 'contacted';
}
```

### University (Korean Style)
```typescript
{
  id: string;
  name: string;
  country: string;
  
  // Fixed costs (always apply)
  fixedCosts: [
    { type: 'Consulting', amount: 39000000, currency: 'VND' },
    { type: 'Agency', amount: 11000000, currency: 'VND' }
  ];
  
  // Visa systems (student selects one)
  koreanData: {
    visaSystems: [
      {
        visaType: 'D4-1',
        tuitionPerTerm: 1450000,
        baseYearlyFee: 5800000,
        description: 'Korean Language Program'
      },
      {
        visaType: 'D2-2',
        tuitionRange: { min: 3736000, max: 4845000 },
        baseYearlyFee: 5800000,
        description: 'Undergraduate Program'
      }
    ]
  };
  
  // Optional add-ons (student can select)
  optionalAddons: [...];
}
```

## 🔄 State Management

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT CONTEXT API                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AppProvider (Wraps entire app)                             │
│  ├─ universities: University[]                              │
│  ├─ studentOnboardings: StudentOnboardingData[]            │
│  ├─ studentProfiles: StudentProfile[]                       │
│  ├─ registrations: Registration[]                           │
│  └─ studentProgress: StudentProgress[]                      │
│                                                             │
│  Methods:                                                   │
│  ├─ addStudentOnboarding(data)                             │
│  ├─ updateStudentOnboardingStatus(id, status)              │
│  ├─ deleteStudentOnboarding(id)                            │
│  └─ ... other methods                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Cost Calculation Logic

```javascript
// Onboarding form cost calculation

initialTotalCost = 0;

// 1. Add fixed costs
for (cost in university.fixedCosts) {
  initialTotalCost += convertToUSD(cost.amount, cost.currency);
}

// 2. Add visa system costs
if (selectedVisaSystem) {
  // Application fee
  if (visaSystem.applicationFee) {
    initialTotalCost += convertToUSD(applicationFee, 'KRW');
  }
  
  // Tuition (per term or average of range)
  if (visaSystem.tuitionPerTerm) {
    initialTotalCost += convertToUSD(tuitionPerTerm, 'KRW');
  } else if (visaSystem.tuitionRange) {
    avgTuition = (min + max) / 2;
    initialTotalCost += convertToUSD(avgTuition, 'KRW');
  }
  
  // Base yearly fee
  if (visaSystem.baseYearlyFee) {
    initialTotalCost += convertToUSD(baseYearlyFee, 'KRW');
  }
  
  // Enrollment fee
  if (visaSystem.enrollmentFee) {
    initialTotalCost += convertToUSD(enrollmentFee, 'KRW');
  }
}

return initialTotalCost; // In USD
```

---

## 🎨 UI Component Hierarchy

```
App
├── AppProvider (Context)
│   ├── CurrencyProvider
│   │   └── LanguageProvider
│   │       └── RouterProvider
│   │           ├── Login
│   │           ├── Layout
│   │           │   ├── Sidebar (Desktop)
│   │           │   ├── MobileSidebar
│   │           │   ├── Header
│   │           │   │   ├── CurrencySwitcher
│   │           │   │   └── LanguageSwitcher
│   │           │   └── Outlet
│   │           │       ├── [Admin Routes]
│   │           │       │   ├── Dashboard
│   │           │       │   ├── UniversitiesList
│   │           │       │   ├── UniversityDetail
│   │           │       │   ├── StudentMonitoring ★
│   │           │       │   └── Registrations
│   │           │       └── [Student Routes]
│   │           │           ├── StudentHome (with CTA)
│   │           │           ├── UniversitiesList
│   │           │           ├── UniversityDetail
│   │           │           ├── MyCosts
│   │           │           ├── ProgressTracker
│   │           │           └── StudentOnboarding ★
```

---

## 🎯 Key Integration Points

### Point 1: Onboarding → Monitoring
```
Student submits form
     ↓
addStudentOnboarding(data)
     ↓
AppContext updates studentOnboardings[]
     ↓
Admin's StudentMonitoring reads from studentOnboardings[]
     ↓
Table displays new entry immediately
```

### Point 2: Status Update
```
Admin changes status dropdown
     ↓
updateStudentOnboardingStatus(id, newStatus)
     ↓
AppContext updates specific entry
     ↓
UI reflects change (badge color, stats)
```

### Point 3: Currency Sync
```
User changes currency
     ↓
CurrencyContext.setCurrency(newCurrency)
     ↓
All components using formatCurrency() re-render
     ↓
Costs display in new currency
```

### Point 4: Language Sync
```
User changes language
     ↓
LanguageContext.setLanguage(newLang)
     ↓
All components using t(key) re-render
     ↓
UI displays in new language
```
