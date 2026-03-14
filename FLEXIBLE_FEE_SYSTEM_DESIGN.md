# 🎓 Flexible Fee Management System for SACMA

## 📋 System Overview

A comprehensive flexible fee management system designed to handle the complex pricing structures of Korean university study abroad programs, including:
- Multiple accommodation options (room types, prices)
- Scholarships with percentage reductions based on TOPIK/IELTS levels
- Variable pricing (air tickets, timing-based fees)
- Optional vs required fees
- Multi-currency support (VND/USD/KRW/JPY/CNY)

## 🏗️ 1. JSON Data Model

### **Core Fee Structure**
```typescript
interface FlexibleFee {
  id: string;
  name: string;
  nameVi?: string;
  nameKo?: string;
  type: FeeType; // 'fixed' | 'optional' | 'optional_multiple' | 'percentage' | 'variable_time'
  base_value: number;
  currency: string;
  time_unit?: TimeUnit; // 'month' | 'year' | 'semester' | 'one_time'
  options?: FeeOption[];
  conditions?: FeeCondition[];
  default_selected?: string | string[];
  note?: string;
  category?: string;
  required?: boolean;
  min_value?: number;
  max_value?: number;
  applies_to?: string[];
}
```

### **Fee Types Explained**

#### **fixed** - Phí cố định
- Use: Required fees that don't change
- Example: Service fees, registration fees
- Structure: Single `base_value`

#### **optional** - Phí tùy chọn  
- Use: Fees students can choose to include
- Example: Health insurance, airport pickup
- Structure: Single `base_value` + checkbox

#### **optional_multiple** - Phí tùy chọn đa lựa chọn
- Use: Fees with multiple options (accommodation, transport)
- Example: Ký túc xá (2-person room, 1-person room, dorm)
- Structure: Array of `options` with different values

#### **percentage** - Phí theo phần trăm
- Use: Scholarships and discounts
- Example: TOPIK-based tuition reduction
- Structure: `base_value` + array of `conditions` with percentages

#### **variable_time** - Phí biến đổi theo thời gian
- Use: Time-based pricing (air tickets, seasonal fees)
- Example: Air tickets (early booking vs last minute)
- Structure: Array of `options` with time-based values

## 📊 2. CSV Data Mapping Examples

### **CSV 1: Chi phí hệ D4-1.csv (Accommodation)**
```json
[
  {
    "id": "accommodation-d4-1",
    "name": "Ký túc xá",
    "type": "optional_multiple",
    "base_value": 0,
    "currency": "VND",
    "time_unit": "month",
    "options": [
      {
        "id": "room-2p",
        "label": "Phòng 2 người",
        "value": 800000,
        "currency": "VND",
        "note": "Phòng ở chung 2 người"
      },
      {
        "id": "room-1p", 
        "label": "Phòng 1 người",
        "value": 1200000,
        "currency": "VND",
        "note": "Phòng riêng 1 người"
      }
    ],
    "default_selected": "room-2p",
    "category": "accommodation",
    "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
  }
]
```

### **CSV 2: Thông tin chung.csv (General Fees)**
```json
[
  {
    "id": "tuition-d4-1",
    "name": "Học phí hệ D4-1",
    "type": "fixed", 
    "base_value": 15000000,
    "currency": "VND",
    "category": "tuition",
    "applies_to": ["D4-1"]
  },
  {
    "id": "visa-fee",
    "name": "Phí visa",
    "type": "fixed",
    "base_value": 2000000,
    "currency": "VND", 
    "category": "visa",
    "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
  }
]
```

### **CSV 3: Chi phí hệ D2-2.csv (Multi-payment System)**
```json
[
  {
    "id": "tuition-d22-1",
    "name": "Học phí lần 1 hệ D2-2",
    "type": "fixed",
    "base_value": 12000000,
    "currency": "VND",
    "category": "tuition",
    "applies_to": ["D2-2"],
    "note": "Học phí lần 1 hệ D2-2"
  },
  {
    "id": "tuition-d22-2", 
    "name": "Học phí lần 2 hệ D2-2",
    "type": "fixed",
    "base_value": 10000000,
    "currency": "VND",
    "category": "tuition", 
    "applies_to": ["D2-2"],
    "note": "Học phí lần 2 hệ D2-2"
  }
]
```

### **CSV 4: Scholarship Data (TOPIK-based)**
```json
[
  {
    "id": "scholarship-topik",
    "name": "Học bổng TOPIK",
    "type": "percentage",
    "base_value": 50000000,
    "currency": "VND",
    "category": "scholarship",
    "conditions": [
      {
        "id": "topik-6",
        "label": "TOPIK 6 cấp",
        "percentage": 100,
        "note": "Miễn 100% học phí"
      },
      {
        "id": "topik-5", 
        "label": "TOPIK 5 cấp",
        "percentage": 70,
        "note": "Giảm 70% học phí"
      },
      {
        "id": "topik-4",
        "label": "TOPIK 4 cấp", 
        "percentage": 50,
        "note": "Giảm 50% học phí"
      }
    ],
    "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
  }
]
```

## 🎛️ 3. Admin UI Components

### **FeeManager.tsx Features**
- ✅ Dynamic form with conditional fields based on fee type
- ✅ React Hook Form + Zod validation
- ✅ Add/remove options and conditions dynamically
- ✅ Real-time preview with Vietnamese language support
- ✅ Responsive design with Tailwind CSS
- ✅ Accordion-based interface for better organization

### **Key Admin Functions**
```typescript
// Add new fee
const addNewFee = () => {
  const newFee: FlexibleFee = {
    id: `fee-${Date.now()}`,
    name: '',
    type: 'fixed',
    base_value: 0,
    currency: 'VND',
    applies_to: visaTypes,
  };
  onChange([...fees, newFee]);
};

// Update existing fee
const updateFee = (index: number, field: string, value: any) => {
  const updatedFees = [...fees];
  updatedFees[index] = { ...updatedFees[index], [field]: value };
  onChange(updatedFees);
};
```

## 🧮 4. Student UI Components

### **CostCalculator.tsx Features**
- ✅ Real-time cost calculation with multi-currency conversion
- ✅ Interactive fee selection (checkboxes, radio buttons, sliders)
- ✅ Progress tracking with visual indicators
- ✅ Accordion-organized fee groups by category
- ✅ Automatic scholarship application
- ✅ Vietnamese/English/Korean language support

### **Student Interaction Patterns**

#### **Fixed Fees**
```typescript
// Display only
<div className="bg-slate-50 rounded p-3">
  <p className="text-lg font-medium">
    {formatFrom(fee.base_value)}
  </p>
</div>
```

#### **Optional Fees**
```typescript
// Checkbox selection
<Checkbox
  id={`optional-${fee.id}`}
  checked={optionalFees[fee.id] || false}
  onCheckedChange={(checked) => handleOptionalToggle(fee.id, checked)}
/>
```

#### **Multiple Options**
```typescript
// Radio button selection
<RadioGroup
  value={selectedOptions[fee.id] || ''}
  onValueChange={(value) => handleOptionSelect(fee.id, value)}
>
  {fee.options.map((option) => (
    <RadioGroupItem value={option.id}>
      <Label>{option.label}</Label>
    </RadioGroupItem>
  ))}
</RadioGroup>
```

#### **Percentage Discounts**
```typescript
// Scholarship selection with discount display
<RadioGroup
  value={selectedConditions[fee.id] || ''}
  onValueChange={(value) => handleConditionSelect(fee.id, value)}
>
  {fee.conditions.map((condition) => (
    <RadioGroupItem value={condition.id}>
      <div className="flex items-center justify-between">
        <span>{condition.label}</span>
        <span className="text-lg font-bold text-green-600">
          -{condition.percentage}%
        </span>
      </div>
    </RadioGroupItem>
  ))}
</RadioGroup>
```

## 📥 5. CSV Import Logic

### **Import Function Features**
- ✅ XLSX library for Excel file parsing
- ✅ Auto-detection of CSV type based on headers/content
- ✅ Separate parsers for different fee structures
- ✅ Error handling and validation
- ✅ Support for multiple visa systems (D4-1, D2-2, D2-3)

### **Import Process**
```typescript
const importFeesFromCSV = async (file: File): Promise<ParsedCSVData> => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'buffer' });
  const jsonData = XLSX.utils.sheet_to_json(worksheet.Sheets[workbook.SheetNames[0]]);
  
  // Auto-detect CSV type and parse accordingly
  const csvType = detectCSVType(jsonData[0]);
  const fees = parseCSVByType(jsonData, csvType);
  
  return { fees, errors: [], warnings: [] };
};
```

## 🎨 6. UI Design Suggestions (Figma-inspired)

### **Admin Interface Layout**
```
┌─────────────────────────────────────────────────┐
│ 🎓 Fee Management System              │
├─────────────────────────────────────────┤
│ [+ Add New Fee] [📥 Import CSV] [📤 Export] │
├─────────────────────────────────────────┤
│ 📋 Fee List                          │
│ ┌─ 🏠 Accommodation ──────┐         │
│ │ ▼ Ký túc xá              │         │
│ │ • Phòng 2 người: 800,000   │         │
│ │ • Phòng 1 người: 1,200,000 │         │
│ │ • Ký túc trường: 600,000   │         │
│ │ [Edit] [Delete]             │         │
│ └─────────────────────────────┘         │
│ ┌─ 🎓 Scholarship ───────┐           │
│ │ ▼ Học bổng TOPIK          │           │
│ │ • TOPIK 6: 100%           │           │
│ │ • TOPIK 5: 70%            │           │
│ │ • TOPIK 4: 50%            │           │
│ │ [Edit] [Delete]             │           │
│ └─────────────────────────────┘           │
└─────────────────────────────────────────┘
```

### **Student Calculator Layout**
```
┌─────────────────────────────────────────┐
│ 💰 Cost Calculator                    │
├─────────────────────────────────────────┤
│ 📊 Total Summary                     │
│ ┌─────────────┬─────────────┬─────┐ │
│ │ Total Fees  │ Discounts   │ Final │ │
│ │ 50,000,000 │ -15,000,000 │ 35M  │ │
│ └─────────────┴─────────────┴─────┘ │
│ ████████████████████████████████████ │
│ 35% Complete                        │
└─────────────────────────────────────────┘

├─────────────────────────────────────────┤
│ 🏠 Accommodation (4 items)           │
│ ▼ Click to expand                  │
│ ◯ Phòng 2 người - 800,000/tháng   │
│ ◯ Phòng 1 người - 1,200,000/tháng   │
│ [📅 Duration: 12 months]           │
└─────────────────────────────────────────┘

├─────────────────────────────────────────┤
│ 🎓 Scholarship (TOPIK)              │
│ ▼ Click to expand                  │
│ ◯ TOPIK 6 cấp - 100% học phí     │
│ ◯ TOPIK 5 cấp - 70% học phí      │
│ ◯ TOPIK 4 cấp - 50% học phí      │
└─────────────────────────────────────────┘
```

## 🔧 7. Integration Points

### **Supabase Integration**
```typescript
// Database structure
universities {
  id: uuid,
  name: text,
  fees: flexible_fee[] // JSON column
}

// Row Level Security
const { data: fees, error } = await supabase
  .from('universities')
  .select('fees')
  .eq('id', universityId)
  .single();
```

### **Currency Conversion API**
```typescript
// Real-time exchange rates
const exchangeRates = await fetch('/api/exchange-rates');
const convertedAmount = baseAmount * rates[currency];

// Support for VND/USD/KRW/JPY/CNY
const formatFrom = (amount: number) => {
  const converted = amount * exchangeRates[currency];
  return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: currency
  }).format(converted);
};
```

### **JWT Authentication**
```typescript
// Protect fee editing
const canEditFees = user.role === 'admin' || user.permissions.includes('fee_management');

// API endpoints
POST /api/universities/:id/fees - Add/update fees
GET /api/universities/:id/fees - Get university fees
POST /api/fees/import - CSV import
GET /api/exchange-rates - Currency conversion
```

## 🚀 8. Implementation Benefits

### **For Admins**
- ✅ Easy fee management with visual interface
- ✅ CSV import/export for bulk operations
- ✅ Real-time validation and error handling
- ✅ Multi-language support (Vietnamese default)
- ✅ Flexible pricing for complex fee structures

### **For Students** 
- ✅ Interactive cost calculator with real-time updates
- ✅ Clear understanding of total costs and discounts
- ✅ Multi-currency support for international students
- ✅ Progress tracking for financial planning
- ✅ Mobile-responsive design

### **For Business**
- ✅ Scalable data model for future expansion
- ✅ Audit trail with fee change history
- ✅ Integration with existing university management
- ✅ Compliance with Korean education system requirements

## 📱 9. Responsive Design

### **Mobile-First Approach**
- ✅ Collapsible accordions for space efficiency
- ✅ Touch-friendly controls (checkboxes, radio buttons)
- ✅ Swipeable fee cards for mobile interaction
- ✅ Sticky summary section on mobile
- ✅ Optimized form layouts for small screens

### **Accessibility**
- ✅ ARIA labels for all interactive elements
- ✅ Keyboard navigation support
- ✅ High contrast colors for visibility
- ✅ Screen reader compatible structure
- ✅ Focus indicators for form elements

---

**🎯 This comprehensive system provides a flexible, scalable solution for managing the complex fee structures of Korean university study abroad programs, with full support for the CSV data structures you provided.**
