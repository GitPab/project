# Quick Start Guide

## 🚀 Getting Started

### Login Credentials
- **Admin**: `admin@example.com` / any password
- **Student**: `student@example.com` / any password

## 📋 Testing the Demo

### Test Scenario 1: Student Onboarding → Admin Monitoring
1. Login as **Student**
2. You'll see a blue CTA banner at the top saying "Đăng ký tư vấn miễn phí"
3. Click **"Đăng ký ngay"** button
4. Fill out the form:
   - Name: Your name
   - Phone: +84 123 456 789
   - Email: youremail@example.com
   - Select University: **Ajou University** or **Seoul National University**
   - Select Visa System: **D2-2** (Undergraduate)
   - TOPIK Level: **4** or **5**
   - IELTS Score: **6.5**
   - Notes: Add any comments
5. Watch the cost calculator update in real-time as you select options
6. Click **"Gửi thông tin"** (Submit)
7. Logout and login as **Admin**
8. Navigate to **"Student Monitoring"** (Theo dõi học viên)
9. You'll see your newly submitted entry in the table!
10. Click the eye icon to view full details
11. Update the status using the dropdown
12. Export to Excel or PDF

### Test Scenario 2: Multi-Currency
1. Click the **currency switcher** in the header (shows $ USD)
2. Change to **VND** (₫)
3. Notice all costs update instantly across the page
4. Change to **KRW** (₩)
5. All costs recalculate with new exchange rates

### Test Scenario 3: Multi-Language
1. Click the **language switcher** in the header (shows 🇻🇳 VI)
2. Change to **English** (🇬🇧 EN)
3. All text, labels, and buttons translate
4. Change to **Korean** (🇰🇷 KR)
5. UI fully translates to Korean

### Test Scenario 4: Admin Management
1. Login as **Admin**
2. Go to **Student Monitoring**
3. See stats at the top:
   - Total students
   - Pending, In Review, Approved, Contacted counts
   - Total estimated costs
4. Use the **filter dropdown** to filter by status
5. Use the **search bar** to find students by name/email/phone
6. Click on a student row to view details
7. Update status and see the badge change color
8. Click **Excel** or **PDF** button to export data

## 🎯 Key Features to Demonstrate

### 1. Real-time Sync
- Student submits form → Admin sees it immediately
- Admin updates status → Reflected instantly
- No page refresh needed

### 2. Cost Calculator
- Onboarding form calculates costs based on:
  - Selected university
  - Visa system (D4-1, D2-2, D2-3)
  - Fixed costs (consulting, agency)
  - Base tuition and fees

### 3. Status Workflow
Shows progression:
- **Pending** (Yellow) → New submission
- **In Review** (Blue) → Being evaluated
- **Approved** (Green) → Accepted
- **Contacted** (Purple) → Admin contacted student

### 4. Data Richness
Each student entry includes:
- Personal info (name, phone, email)
- Academic preferences (university, visa system)
- Language proficiency (TOPIK, IELTS)
- Cost estimates
- Notes and comments
- Submission timestamp

## 🌏 Sample Universities to Try

### Korean Universities (Featured)
- **Ajou University** - D4-1, D2-2, D2-3 visa systems
- **Seoul National University** - Top ranked in Korea
- **KAIST** - Engineering focused
- **Yonsei University** - Comprehensive programs

### Other Asian Universities
- University of Tokyo (Japan)
- Peking University (China)
- VNU Hanoi (Vietnam)
- NUS Singapore
- IIT Delhi (India)

## 💡 Pro Tips

1. **Compare Costs**: Open multiple browser tabs and compare costs between universities
2. **Test Filtering**: Try filtering by different statuses in Admin dashboard
3. **Export Data**: Test Excel and PDF export with different data sets
4. **Language Context**: Notice how status badges, table headers, and buttons all translate
5. **Mobile View**: Resize browser to see mobile-responsive design
6. **Search Speed**: Type in search bar - notice instant filtering

## 🔄 Exchange Rates Used
- **1 USD** = **26,169 VND**
- **1 USD** = **1,471 KRW**

All conversions happen automatically when you switch currencies!

## 📊 Pre-loaded Demo Data

### 4 Sample Students (Already in System)
1. **Nguyễn Văn Minh** - Ajou, D2-2, Pending
2. **Trần Thị Hương** - Seoul National, D2-2, In Review
3. **Kim Soo-jin** - Ajou, D4-1, Approved
4. **Lê Hoàng Anh** - Seoul National, D2-3, Contacted

You can view, edit, or delete these entries as an Admin!

## 🎨 Color System
- **Pending**: Yellow badge
- **In Review**: Blue badge
- **Approved**: Green badge
- **Contacted**: Purple badge

Each status has its own card color in the stats section.

---

## Need Help?
- All costs are in USD by default
- Language is Vietnamese by default
- Submit button is always at the bottom of forms
- Export buttons are at the top-right of tables
