# 📊 Example Fees JSON from CSV Data

## **Complete University Fees Structure**

### **University: Korea National University**
```json
{
  "id": "korea-national-university",
  "name": "Korea National University",
  "fees": [
    {
      "id": "tuition-d4-1",
      "name": "Học phí hệ D4-1",
      "nameVi": "Học phí tiếng Hàn",
      "nameKo": "한국어 수업료",
      "type": "fixed",
      "base_value": 15000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D4-1"],
      "note": "Học phí 6 tháng tiếng Hàn"
    },
    {
      "id": "tuition-d22-1",
      "name": "Học phí lần 1 hệ D2-2",
      "nameVi": "Học phí đại học lần 1",
      "nameKo": "대학교 수업료 1차",
      "type": "fixed",
      "base_value": 25000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-2"],
      "note": "Học phí học kỳ đầu tiên"
    },
    {
      "id": "tuition-d22-2",
      "name": "Học phí lần 2 hệ D2-2",
      "nameVi": "Học phí đại học lần 2",
      "nameKo": "대학교 수업료 2차",
      "type": "fixed",
      "base_value": 22000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-2"],
      "note": "Học phí học kỳ thứ hai"
    },
    {
      "id": "tuition-d22-3",
      "name": "Học phí lần 3 hệ D2-2",
      "nameVi": "Học phí đại học lần 3",
      "nameKo": "대학교 수업료 3차",
      "type": "fixed",
      "base_value": 20000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-2"],
      "note": "Học phí học kỳ thứ ba"
    },
    {
      "id": "visa-fee",
      "name": "Phí visa",
      "nameVi": "Phí visa Hàn Quốc",
      "nameKo": "비자 비용",
      "type": "fixed",
      "base_value": 2000000,
      "currency": "VND",
      "time_unit": "one_time",
      "category": "visa",
      "required": true,
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Phí làm visa du học Hàn Quốc"
    },
    {
      "id": "service-fee",
      "name": "Phí tư vấn",
      "nameVi": "Phí dịch vụ tư vấn",
      "nameKo": "상담 서비스 수수료",
      "type": "fixed",
      "base_value": 39000000,
      "currency": "VND",
      "time_unit": "one_time",
      "category": "service",
      "required": true,
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Phí tư vấn toàn diện từ A-Z"
    },
    {
      "id": "accommodation-d4-1",
      "name": "Ký túc xá",
      "nameVi": "Ký túc xá",
      "nameKo": "기숙사",
      "type": "optional_multiple",
      "base_value": 0,
      "currency": "VND",
      "time_unit": "month",
      "category": "accommodation",
      "required": false,
      "options": [
        {
          "id": "room-2p",
          "label": "Phòng 2 người",
          "value": 800000,
          "currency": "VND",
          "note": "Phòng ở chung 2 người, tiết kiệm chi phí"
        },
        {
          "id": "room-1p",
          "label": "Phòng 1 người",
          "value": 1200000,
          "currency": "VND",
          "note": "Phòng riêng 1 người, không gian riêng tư"
        },
        {
          "id": "room-dorm",
          "label": "Ký túc xá trường",
          "value": 600000,
          "currency": "VND",
          "note": "Ký túc xá trong khuôn viên trường"
        },
        {
          "id": "room-outside",
          "label": "Ở ngoài tự tìm",
          "value": 1000000,
          "currency": "VND",
          "note": "Tự tìm phòng ở bên ngoài"
        }
      ],
      "default_selected": "room-2p",
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Lựa chọn loại phòng ở phù hợp"
    },
    {
      "id": "scholarship-topik",
      "name": "Học bổng TOPIK",
      "nameVi": "Học bổng TOPIK",
      "nameKo": "TOPIK 장학금",
      "type": "percentage",
      "base_value": 25000000,
      "currency": "VND",
      "category": "scholarship",
      "required": false,
      "conditions": [
        {
          "id": "topik-6",
          "label": "TOPIK 6 cấp",
          "percentage": 100,
          "note": "Miễn 100% học phí",
          "requirement": "Chứng chỉ TOPIK Level 6"
        },
        {
          "id": "topik-5",
          "label": "TOPIK 5 cấp",
          "percentage": 70,
          "note": "Giảm 70% học phí",
          "requirement": "Chứng chỉ TOPIK Level 5"
        },
        {
          "id": "topik-4",
          "label": "TOPIK 4 cấp",
          "percentage": 50,
          "note": "Giảm 50% học phí",
          "requirement": "Chứng chỉ TOPIK Level 4"
        },
        {
          "id": "topik-3",
          "label": "TOPIK 3 cấp",
          "percentage": 30,
          "note": "Giảm 30% học phí",
          "requirement": "Chứng chỉ TOPIK Level 3"
        },
        {
          "id": "no-topik",
          "label": "Không có TOPIK",
          "percentage": 0,
          "note": "Không có học bổng",
          "requirement": "Không yêu cầu chứng chỉ"
        }
      ],
      "default_selected": "no-topik",
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Học bổng dựa trên trình độ tiếng Hàn"
    },
    {
      "id": "air-ticket",
      "name": "Vé máy bay",
      "nameVi": "Vé máy bay",
      "nameKo": "항공권",
      "type": "variable_time",
      "base_value": 5000000,
      "currency": "VND",
      "time_unit": "one_time",
      "category": "travel",
      "required": false,
      "options": [
        {
          "id": "early-booking",
          "label": "Đặt sớm (trước 3 tháng)",
          "value": 4500000,
          "currency": "VND",
          "note": "Giảm 10% khi đặt vé sớm",
          "condition": "Đặt vé trước 3 tháng"
        },
        {
          "id": "standard-booking",
          "label": "Đặt vé tiêu chuẩn",
          "value": 5000000,
          "currency": "VND",
          "note": "Giá vé thông thường",
          "condition": "Đặt vé trong vòng 1-3 tháng"
        },
        {
          "id": "last-minute",
          "label": "Đặt gấp (dưới 1 tháng)",
          "value": 6000000,
          "currency": "VND",
          "note": "Phụ thu 20% khi đặt gấp",
          "condition": "Đặt vé dưới 1 tháng"
        }
      ],
      "default_selected": "standard-booking",
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Chi phí vé máy bay thay đổi theo thời điểm đặt"
    },
    {
      "id": "health-insurance",
      "name": "Bảo hiểm y tế",
      "nameVi": "Bảo hiểm y tế Hàn Quốc",
      "nameKo": "건강보험",
      "type": "optional",
      "base_value": 2000000,
      "currency": "VND",
      "time_unit": "year",
      "category": "insurance",
      "required": false,
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Bảo hiểm y tế bắt buộc cho người nước ngoài"
    },
    {
      "id": "savings-account",
      "name": "Tài khoản tiết kiệm",
      "nameVi": "Tài khoản tiết kiệm chứng minh tài chính",
      "nameKo": "예금 계좌",
      "type": "optional",
      "base_value": 10000000,
      "currency": "VND",
      "time_unit": "one_time",
      "category": "other",
      "required": false,
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Chứng minh tài chính cho visa"
    },
    {
      "id": "airport-pickup",
      "name": "Đón sân bay",
      "nameVi": "Dịch vụ đón sân bay",
      "nameKo": "공항 픽업 서비스",
      "type": "optional",
      "base_value": 1500000,
      "currency": "VND",
      "time_unit": "one_time",
      "category": "service",
      "required": false,
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Dịch vụ đón tại sân bay Incheon"
    },
    {
      "id": "monthly-living",
      "name": "Chi phí sinh hoạt hàng tháng",
      "nameVi": "Sinh hoạt phí hàng tháng",
      "nameKo": "월 생활비",
      "type": "optional",
      "base_value": 3000000,
      "currency": "VND",
      "time_unit": "month",
      "category": "other",
      "required": false,
      "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"],
      "note": "Chi phí ăn uống, đi lại, giải trí hàng tháng"
    }
  ]
}
```

## **CSV Data Mapping Examples**

### **From "Chi phí hệ D4-1.csv" → Accommodation Fees**
```csv
Tên trường,Phòng 2 người,Phòng 1 người,Ký túc xá trường,Ở ngoài tự tìm
Korea National University,800000,1200000,600000,1000000
```

**Converted to JSON:**
```json
{
  "id": "accommodation-d4-1",
  "name": "Ký túc xá",
  "type": "optional_multiple",
  "options": [
    {"label": "Phòng 2 người", "value": 800000},
    {"label": "Phòng 1 người", "value": 1200000},
    {"label": "Ký túc xá trường", "value": 600000},
    {"label": "Ở ngoài tự tìm", "value": 1000000}
  ],
  "time_unit": "month"
}
```

### **From "Thông tin chung.csv" → Fixed Fees**
```csv
Loại phí,Số tiền,Ghi chú,Áp dụng hệ
Phí tư vấn,39000000,Dịch vụ tư vấn A-Z,D4-1,D2-1,D2-2,D2-3
Phí visa,2000000,Visa du học Hàn Quốc,D4-1,D2-1,D2-2,D2-3
Bảo hiểm y tế,2000000,Bắt buộc cho người nước ngoài,D4-1,D2-1,D2-2,D2-3
```

**Converted to JSON:**
```json
[
  {
    "id": "service-fee",
    "name": "Phí tư vấn",
    "type": "fixed",
    "base_value": 39000000,
    "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
  },
  {
    "id": "visa-fee", 
    "name": "Phí visa",
    "type": "fixed",
    "base_value": 2000000,
    "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
  },
  {
    "id": "health-insurance",
    "name": "Bảo hiểm y tế",
    "type": "optional",
    "base_value": 2000000,
    "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
  }
]
```

### **From "Chi phí hệ D2-2.csv" → Multi-payment System**
```csv
Loại phí,Lần 1,Lần 2,Lần 3
Học phí,25000000,22000000,20000000
```

**Converted to JSON:**
```json
[
  {
    "id": "tuition-d22-1",
    "name": "Học phí lần 1 hệ D2-2",
    "type": "fixed",
    "base_value": 25000000,
    "applies_to": ["D2-2"]
  },
  {
    "id": "tuition-d22-2",
    "name": "Học phí lần 2 hệ D2-2", 
    "type": "fixed",
    "base_value": 22000000,
    "applies_to": ["D2-2"]
  },
  {
    "id": "tuition-d22-3",
    "name": "Học phí lần 3 hệ D2-2",
    "type": "fixed", 
    "base_value": 20000000,
    "applies_to": ["D2-2"]
  }
]
```

### **From Scholarship Data → Percentage Fees**
```csv
Điều kiện,Phần trăm,Ghi chú,Áp dụng
TOPIK 6 cấp,100,Miễn 100% học phí,D4-1,D2-1,D2-2,D2-3
TOPIK 5 cấp,70,Giảm 70% học phí,D4-1,D2-1,D2-2,D2-3
TOPIK 4 cấp,50,Giảm 50% học phí,D4-1,D2-1,D2-2,D2-3
TOPIK 3 cấp,30,Giảm 30% học phí,D4-1,D2-1,D2-2,D2-3
```

**Converted to JSON:**
```json
{
  "id": "scholarship-topik",
  "name": "Học bổng TOPIK",
  "type": "percentage",
  "base_value": 25000000,
  "conditions": [
    {"label": "TOPIK 6 cấp", "percentage": 100},
    {"label": "TOPIK 5 cấp", "percentage": 70},
    {"label": "TOPIK 4 cấp", "percentage": 50},
    {"label": "TOPIK 3 cấp", "percentage": 30}
  ],
  "applies_to": ["D4-1", "D2-1", "D2-2", "D2-3"]
}
```

## **Database Structure for Supabase**

### **Universities Table**
```sql
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  korean_name TEXT,
  country TEXT NOT NULL,
  region TEXT,
  fees JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read universities
CREATE POLICY "Universities are viewable by everyone" ON universities
  FOR SELECT USING (true);

-- Create policy for admins to update universities
CREATE POLICY "Admins can update universities" ON universities
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Create policy for admins to insert universities
CREATE POLICY "Admins can insert universities" ON universities
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### **Student Fee Selections Table**
```sql
CREATE TABLE student_fee_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  selections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tracking_code, university_id)
);

-- Enable RLS
ALTER TABLE student_fee_selections ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own selections
CREATE POLICY "Users can manage their own fee selections" ON student_fee_selections
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'trackingCode' = tracking_code
    )
  );
```

### **Real-time Subscription Setup**
```javascript
// In your React component
const channel = supabase
  .channel('fees-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'universities',
      filter: `id=eq.${universityId}`
    },
    (payload) => {
      // Update local state when fees change
      if (payload.new?.fees) {
        setFees(payload.new.fees);
      }
    }
  )
  .subscribe();
```

## **Sample Student Selection Data**
```json
{
  "tracking_code": "SACMA-20240314-ABC123",
  "university_id": "korea-national-university",
  "selections": {
    "visaType": "D4-1",
    "options": {
      "accommodation-d4-1": "room-2p",
      "air-ticket": "early-booking"
    },
    "conditions": {
      "scholarship-topik": "topik-4"
    },
    "timeValues": {
      "accommodation-d4-1": 6,
      "monthly-living": 12
    },
    "optionalFees": {
      "health-insurance": true,
      "savings-account": true,
      "airport-pickup": false,
      "monthly-living": true
    }
  }
}
```

## **Calculated Result Example**
```json
{
  "total_fees": 107700000,
  "total_discounts": 12500000,
  "final_total": 95200000,
  "currency": "VND",
  "breakdown": [
    {
      "fee_id": "tuition-d4-1",
      "fee_name": "Học phí hệ D4-1",
      "quantity": 1,
      "amount": 15000000,
      "discount": 0,
      "final_amount": 15000000
    },
    {
      "fee_id": "service-fee",
      "fee_name": "Phí tư vấn",
      "quantity": 1,
      "amount": 39000000,
      "discount": 0,
      "final_amount": 39000000
    },
    {
      "fee_id": "visa-fee",
      "fee_name": "Phí visa",
      "quantity": 1,
      "amount": 2000000,
      "discount": 0,
      "final_amount": 2000000
    },
    {
      "fee_id": "accommodation-d4-1",
      "fee_name": "Ký túc xá",
      "selected_option": "room-2p",
      "quantity": 6,
      "amount": 4800000,
      "discount": 0,
      "final_amount": 4800000
    },
    {
      "fee_id": "scholarship-topik",
      "fee_name": "Học bổng TOPIK",
      "selected_option": "topik-4",
      "amount": 25000000,
      "discount": 12500000,
      "final_amount": 12500000
    },
    {
      "fee_id": "air-ticket",
      "fee_name": "Vé máy bay",
      "selected_option": "early-booking",
      "quantity": 1,
      "amount": 4500000,
      "discount": 0,
      "final_amount": 4500000
    },
    {
      "fee_id": "health-insurance",
      "fee_name": "Bảo hiểm y tế",
      "quantity": 1,
      "amount": 2000000,
      "discount": 0,
      "final_amount": 2000000
    },
    {
      "fee_id": "savings-account",
      "fee_name": "Tài khoản tiết kiệm",
      "quantity": 1,
      "amount": 10000000,
      "discount": 0,
      "final_amount": 10000000
    },
    {
      "fee_id": "monthly-living",
      "fee_name": "Chi phí sinh hoạt hàng tháng",
      "quantity": 12,
      "amount": 36000000,
      "discount": 0,
      "final_amount": 36000000
    }
  ]
}
```

**🎯 This JSON structure provides a complete mapping from your CSV data to the flexible fee management system, ready for Supabase integration!**
