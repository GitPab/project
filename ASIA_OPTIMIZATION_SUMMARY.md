# Asia-Focus and Ajou-Style UI Optimization

## Summary

This prototype has been optimized for Asia-focused study abroad cost management with Ajou University-style interface across all universities. The system now exclusively features Asian universities (~50 total) with comprehensive cost tracking and multi-currency support.

## Key Updates

### 1. Enhanced Currency System

**Updated Exchange Rates (March 3, 2026):**
- 1 USD = 26,169 VND
- 1 USD = 1,471 KRW

**Features:**
- **Auto-location detection**: Defaults to VND for Vietnamese users
- **Update Rates button**: Simulated API refresh with timestamp tracking
- **Multi-currency display**: Side-by-side conversions in USD, VND, and KRW
- **Smart formatting**: Precise number formatting for each currency
  - Example: 10,000 KRW → 210,000 VND → $7 USD

**Components:**
- `/src/app/context/CurrencyContext.tsx` - Enhanced with `formatMultipleCurrency()` and `updateRates()`
- `/src/app/components/MultiCurrencyDisplay.tsx` - Reusable multi-currency display components
- Currency switcher in header now includes "Update Rates" functionality

### 2. Asian Universities Only

**Regions Covered (~50 universities):**

**South Korea (6 universities):**
- Seoul National University (#1 in Korea)
- KAIST (#3 in Korea)
- Korea University (#5 in Korea)
- Yonsei University (#4 in Korea)
- Sungkyunkwan University (#6 in Korea)
- Ajou University (#15 in Korea) - with full Korean data structure

**China (6 universities):**
- Tsinghua University (#1 in China, #25 globally)
- Peking University (#2 in China, #26 globally)
- Fudan University (#3 in China, #50 globally)
- Shanghai Jiao Tong University (#4 in China)
- Zhejiang University (#5 in China)
- USTC (#6 in China)

**Japan (5 universities):**
- University of Tokyo (#1 in Japan, #28 globally)
- Kyoto University (#2 in Japan, #36 globally)
- Osaka University (#3 in Japan)
- Tohoku University (#4 in Japan)
- Nagoya University (#5 in Japan)

**Singapore (2 universities):**
- National University of Singapore (NUS) - #1 in Asia, #8 globally
- Nanyang Technological University (NTU) - #15 globally

**Vietnam (3 universities):**
- Vietnam National University Hanoi (VNU Hanoi)
- Ho Chi Minh City University of Technology (HCMUT)
- Hanoi University of Science and Technology (HUST)

**India (3 universities):**
- IIT Bombay (#1 in India)
- IIT Delhi (#2 in India)
- Indian Institute of Science (IISc Bangalore)

**Other Asian Countries (2 universities):**
- Chulalongkorn University (Thailand)
- University of Malaya (Malaysia)

**Data Files:**
- `/src/app/data/asian-universities.ts` - New comprehensive Asian universities data
- `/src/app/data/korean-universities.ts` - Korean universities with Ajou-style structure
- Removed: `universities-data.ts` and `additional-universities.ts` (US/UK/Europe schools)

### 3. Ajou-Style UI for ALL Universities

**University Detail Page Structure:**

**Top Section - Common Info (NO COSTS):**
- University name and location
- World and regional rankings
- Address (for Korean universities)
- Academic orientation (majors and programs)
- Overview and introduction

**For Korean Universities:**

1. **Visa System Selection Dropdown:**
   - D4-1: Language Program
   - D2-2: Undergraduate Program
   - D2-3: Postgraduate Program
   - Dynamically loads system-specific costs

2. **Cost Sections (Accordion/Tabs):**
   
   **a) Fixed Costs:**
   - Consulting Fee (Phí tư vấn): ~39,000,000 VND
   - Agency Fees (Phí môi giới): ~11,000,000 VND
   - Always included in total

   **b) Common Costs:**
   - Korean Language Course: ~13,000,000 VND
   - Informational only

   **c) System-Specific Costs:**
   - Application Fee
   - Enrollment Fee (for D2-3)
   - Tuition per term (D4-1) or range (D2-2, D2-3)
   - Base yearly fee

   **d) Optional Add-ons (Checkboxes):**
   - ☐ Dorm VN: 800,000 VND/month (dropdown for months: 1-6)
   - ☐ Dorm KR: Radio buttons (4-person: 747,000 KRW | 2-person: 1,102,000 KRW)
   - ☐ Savings Account: Dropdown (8M, 9M, or 10M KRW)
   - ☐ Flight Ticket: 8,000,000 VND (fixed)
   - ☐ Scholarship: Dropdown (30%, 50%, 70%, 100% reduction on tuition)

3. **Real-time Calculator:**
   - Total = Fixed + System-Specific + Selected Add-ons - Scholarship
   - Updates automatically on checkbox/dropdown changes
   - Shows conversions in all three currencies

**For Traditional Universities (China, Japan, Singapore, etc.):**
- Simple cost breakdown with tuition, visa, accommodation, insurance
- Multi-currency display for all costs
- Total calculator with conversions

**Components:**
- `/src/app/pages/UniversityDetail.tsx` - New unified detail page for all universities
- Replaces: `UniversityDetailKorean.tsx` (now handles both Korean and traditional styles)

### 4. Student Views

**Student Home (Student List):**
- ✅ Cards show ONLY intro info (name, country, thumbnail, tagline, ranking)
- ✅ NO costs displayed on cards
- ✅ "Xem chi tiết" (View Details) button to navigate to full breakdown
- ✅ Search and pagination
- ✅ Registration status badge

**University Detail:**
- ✅ Full Ajou-style cost breakdown
- ✅ Visa system selector (for Korean universities)
- ✅ Expandable cost sections (Fixed, System, Add-ons)
- ✅ Real-time calculator with multi-currency display
- ✅ Registration button (for students)

**My Costs (Chi phí của tôi):**
- ✅ Mirrors Ajou-style breakdown
- ✅ Editable checkboxes for add-ons post-registration
- ✅ Multi-currency display for all costs
- ✅ Breakdown by registered university
- ✅ Grand total with conversions

### 5. Responsive Design

**Mobile Optimization:**
- Collapsible sidebar on mobile devices
- Currency and language switchers in mobile header
- Responsive cost cards and tables
- Horizontal scroll for tables when needed

**Desktop Features:**
- Full sidebar navigation
- Multi-column layouts for cost breakdowns
- Expanded views for all sections

### 6. Multilingual Support

**Languages:**
- Vietnamese (VI) - Default
- English (EN)
- Korean (KR)

**Key Translated Labels:**
- "Đăng ký" (Register)
- "Chỉnh sửa" (Edit)
- "Chi phí của tôi" (My Costs)
- "Xem chi tiết" (View Details)
- Cost category labels in all three languages

### 7. Admin Features

**Admin Dashboard:**
- Overview cards with statistics
- Charts showing university distribution by region
- Recent registrations tracking
- Quick actions to manage universities

**Universities List:**
- ✅ Table view with Asian universities only
- ✅ Edit functionality for admin role
- ✅ CSV import for Korean universities
- ✅ Multi-currency display

**Import Modal:**
- Enhanced to handle Korean CSV data
- Supports Ajou-style cost structure
- Validates visa systems and optional add-ons

### 8. Success Notifications

**Toast Messages:**
- ✅ Currency rate updates
- ✅ Registration confirmations
- ✅ Edit save confirmations
- ✅ Import success/error messages

## Technical Implementation

### File Structure

```
/src/app/
├── components/
│   ├── Layout.tsx                    # Updated with currency refresh
│   ├── MultiCurrencyDisplay.tsx      # NEW - Multi-currency components
│   ├── ImportUniversitiesModal.tsx   # Enhanced for Korean data
│   └── ui/                           # Shadcn UI components
├── context/
│   ├── AppContext.tsx                # Updated to use Asian universities
│   ├── CurrencyContext.tsx           # Enhanced with new rates & features
│   └── LanguageContext.tsx           # Multilingual support
├── data/
│   ├── asian-universities.ts         # NEW - ~50 Asian universities
│   ├── korean-universities.ts        # Korean universities with full data
│   └── [REMOVED] universities-data.ts & additional-universities.ts
├── pages/
│   ├── AdminDashboard.tsx            # Admin overview
│   ├── UniversitiesList.tsx          # List view with Asian schools
│   ├── UniversityDetail.tsx          # NEW - Unified Ajou-style detail page
│   ├── StudentHome.tsx               # Student dashboard with intro cards
│   ├── MyCosts.tsx                   # Student cost tracking
│   └── ProgressTracker.tsx           # Application progress tracking
└── routes.tsx                        # Updated to use new UniversityDetail
```

### Key Technical Features

1. **Type Safety**: Full TypeScript support for all cost structures
2. **Performance**: Usememo and useCallback for expensive calculations
3. **State Management**: React Context for global state
4. **Routing**: React Router with protected routes
5. **UI Components**: Shadcn UI with Radix UI primitives
6. **Styling**: Tailwind CSS v4 with custom theme

## Usage Instructions

### For Administrators

1. **Login**: Use admin credentials to access admin dashboard
2. **View Universities**: Navigate to Universities List to see all Asian schools
3. **Edit Costs**: Click edit button to modify university costs
4. **Import Data**: Use CSV import to add more Korean universities
5. **Monitor Students**: View registrations and student progress

### For Students

1. **Login**: Use student credentials
2. **Browse Universities**: Explore Asian universities on Student Home
3. **View Details**: Click any university card to see full Ajou-style breakdown
4. **Select Options**: For Korean universities, choose visa system and add-ons
5. **Register**: Click "Đăng ký" to register for a program
6. **Track Costs**: View your registered programs in "Chi phí của tôi"
7. **Monitor Progress**: Check application progress in "My Progress"

### Currency Features

1. **Switch Currency**: Click currency selector in header (USD/VND/KRW)
2. **Update Rates**: Click "Update Rates" in currency dropdown
3. **View Conversions**: See side-by-side conversions in totals

## Demo Accounts

**Admin:**
- Email: admin@example.com
- Password: admin123

**Students:**
- Email: student@example.com
- Password: student123
- Email: nguyenvana@example.com (has demo data)
- Email: kimjihoon@example.com (has demo data)

## Future Enhancements

1. **Real API Integration**: Connect to actual exchange rate APIs
2. **More Universities**: Expand to 100+ Asian universities
3. **Payment Tracking**: Add payment gateway integration
4. **Document Management**: Upload and manage visa documents
5. **Chat Support**: Live chat with university representatives
6. **Scholarship Database**: Comprehensive scholarship search
7. **Comparison Tool**: Side-by-side university comparison

## Design Philosophy

This optimization follows the Ajou University model where:
- **Information is progressive**: Basic info → Detailed breakdown → Cost calculator
- **Transparency is key**: All costs are clearly categorized and explained
- **Flexibility matters**: Students can customize their cost estimates
- **Multi-currency is essential**: Asian students need local currency context
- **Mobile-first**: Responsive design for students on the go

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technologies Used

- **React 18.3.1**: UI framework
- **TypeScript**: Type safety
- **React Router 7**: Routing
- **Tailwind CSS 4**: Styling
- **Shadcn UI**: Component library
- **Lucide React**: Icons
- **Sonner**: Toast notifications
- **Recharts**: Data visualization

---

**Last Updated**: March 3, 2026
**Version**: 2.0 (Asia-Focus Optimization)
