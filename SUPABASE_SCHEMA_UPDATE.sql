-- Enhanced Supabase Schema for SACMA with Per-System Fees
-- This adds systems support to existing universities table

-- 1. Update universities table to include systems
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS systems JSONB DEFAULT '[]';

-- 2. Create university_systems table for better querying
CREATE TABLE IF NOT EXISTS university_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  code TEXT NOT NULL CHECK (code IN ('D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6')),
  name TEXT NOT NULL,
  name_vi TEXT,
  name_ko TEXT,
  name_en TEXT,
  description TEXT,
  available BOOLEAN DEFAULT true,
  fees JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(university_id, code)
);

-- 3. Create student_system_selections table
CREATE TABLE IF NOT EXISTS student_system_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  system_code TEXT NOT NULL,
  selections JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tracking_code, university_id)
);

-- 4. Update student_fee_selections to include system_code
ALTER TABLE student_fee_selections 
ADD COLUMN IF NOT EXISTS system_code TEXT;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_universities_systems ON universities USING GIN (systems);
CREATE INDEX IF NOT EXISTS idx_university_systems_university_id ON university_systems(university_id);
CREATE INDEX IF NOT EXISTS idx_university_systems_code ON university_systems(code);
CREATE INDEX IF NOT EXISTS idx_university_systems_available ON university_systems(available);
CREATE INDEX IF NOT EXISTS idx_student_system_selections_tracking_code ON student_system_selections(tracking_code);
CREATE INDEX IF NOT EXISTS idx_student_system_selections_university_id ON student_system_selections(university_id);

-- 6. Enable RLS (Row Level Security)
ALTER TABLE university_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_system_selections ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for university_systems
CREATE POLICY "University systems are viewable by everyone" ON university_systems
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage university systems" ON university_systems
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- 8. RLS Policies for student_system_selections
CREATE POLICY "Users can manage their own system selections" ON student_system_selections
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'trackingCode' = tracking_code
    )
  );

-- 9. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Triggers for updated_at
CREATE TRIGGER update_university_systems_updated_at 
  BEFORE UPDATE ON university_systems 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_system_selections_updated_at 
  BEFORE UPDATE ON student_system_selections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Sample Data: Ajou University Systems
INSERT INTO university_systems (university_id, code, name, name_vi, name_ko, available, fees) VALUES
(
  (SELECT id FROM universities WHERE name = 'Ajou University' LIMIT 1),
  'D4-1',
  'Korean Language Program',
  'Chương trình tiếng Hàn',
  '한국어 프로그램',
  true,
  '[
    {
      "id": "tuition-d4-1-ajou",
      "name": "Học phí tiếng Hàn",
      "nameVi": "Học phí tiếng Hàn",
      "nameKo": "한국어 수업료",
      "type": "fixed",
      "base_value": 18000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D4-1"],
      "note": "Học phí 6 tháng tiếng Hàn tại Ajou"
    },
    {
      "id": "accommodation-d4-1-ajou",
      "name": "Ký túc xá Ajou",
      "nameVi": "Ký túc xá Ajou",
      "nameKo": "아주대 기숙사",
      "type": "optional_multiple",
      "base_value": 0,
      "currency": "VND",
      "time_unit": "month",
      "category": "accommodation",
      "required": false,
      "options": [
        {
          "id": "room-2p-ajou",
          "label": "Phòng 2 người",
          "value": 850000,
          "currency": "VND",
          "note": "Phòng ở chung 2 người tại Ajou"
        },
        {
          "id": "room-1p-ajou",
          "label": "Phòng 1 người",
          "value": 1300000,
          "currency": "VND",
          "note": "Phòng riêng 1 người tại Ajou"
        },
        {
          "id": "room-dorm-ajou",
          "label": "Ký túc xá trường",
          "value": 700000,
          "currency": "VND",
          "note": "Ký túc xá trong khuôn viên Ajou"
        }
      ],
      "default_selected": "room-2p-ajou",
      "applies_to": ["D4-1"],
      "note": "Lựa chọn chỗ ở tại Ajou"
    },
    {
      "id": "scholarship-topik-ajou",
      "name": "Học bổng TOPIK Ajou",
      "nameVi": "Học bổng TOPIK Ajou",
      "nameKo": "아주대 TOPIK 장학금",
      "type": "percentage",
      "base_value": 18000000,
      "currency": "VND",
      "category": "scholarship",
      "required": false,
      "conditions": [
        {
          "id": "topik-6-ajou",
          "label": "TOPIK 6 cấp",
          "percentage": 100,
          "note": "Miễn 100% học phí tiếng Hàn",
          "requirement": "Chứng chỉ TOPIK Level 6"
        },
        {
          "id": "topik-5-ajou",
          "label": "TOPIK 5 cấp",
          "percentage": 70,
          "note": "Giảm 70% học phí tiếng Hàn",
          "requirement": "Chứng chỉ TOPIK Level 5"
        },
        {
          "id": "topik-4-ajou",
          "label": "TOPIK 4 cấp",
          "percentage": 50,
          "note": "Giảm 50% học phí tiếng Hàn",
          "requirement": "Chứng chỉ TOPIK Level 4"
        }
      ],
      "default_selected": "no-topik-ajou",
      "applies_to": ["D4-1"],
      "note": "Học bổng dựa trên trình độ tiếng Hàn"
    }
  ]'
),
(
  (SELECT id FROM universities WHERE name = 'Ajou University' LIMIT 1),
  'D2-2',
  'Undergraduate Program',
  'Chương trình đại học',
  '학부 프로그램',
  true,
  '[
    {
      "id": "tuition-d22-1-ajou",
      "name": "Học phí đại học lần 1",
      "nameVi": "Học phí đại học lần 1",
      "nameKo": "대학교 수업료 1차",
      "type": "fixed",
      "base_value": 28000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-2"],
      "note": "Học phí học kỳ đầu tiên đại học Ajou"
    },
    {
      "id": "tuition-d22-2-ajou",
      "name": "Học phí đại học lần 2",
      "nameVi": "Học phí đại học lần 2",
      "nameKo": "대학교 수업료 2차",
      "type": "fixed",
      "base_value": 25000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-2"],
      "note": "Học phí học kỳ thứ hai đại học Ajou"
    },
    {
      "id": "tuition-d22-3-ajou",
      "name": "Học phí đại học lần 3",
      "nameVi": "Học phí đại học lần 3",
      "nameKo": "대학교 수업료 3차",
      "type": "fixed",
      "base_value": 23000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-2"],
      "note": "Học phí học kỳ thứ ba đại học Ajou"
    }
  ]'
),
(
  (SELECT id FROM universities WHERE name = 'Ajou University' LIMIT 1),
  'D2-3',
  'Graduate Program',
  'Chương trình sau đại học',
  '대학원 프로그램',
  true,
  '[
    {
      "id": "tuition-d23-1-ajou",
      "name": "Học phí sau đại học",
      "nameVi": "Học phí sau đại học",
      "nameKo": "대학원 수업료",
      "type": "fixed",
      "base_value": 32000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D2-3"],
      "note": "Học phí sau đại học tại Ajou"
    }
  ]'
) ON CONFLICT (university_id, code) DO NOTHING;

-- 12. Sample Data: KonKuk University Systems
INSERT INTO university_systems (university_id, code, name, name_vi, name_ko, available, fees) VALUES
(
  (SELECT id FROM universities WHERE name = 'KonKuk University' LIMIT 1),
  'D4-1',
  'Korean Language Program',
  'Chương trình tiếng Hàn',
  '한국어 프로그램',
  true,
  '[
    {
      "id": "tuition-d4-1-konkuk",
      "name": "Học phí tiếng Hàn KonKuk",
      "nameVi": "Học phí tiếng Hàn KonKuk",
      "nameKo": "건국대 한국어 수업료",
      "type": "fixed",
      "base_value": 17000000,
      "currency": "VND",
      "time_unit": "semester",
      "category": "tuition",
      "required": true,
      "applies_to": ["D4-1"],
      "note": "Học phí 6 tháng tiếng Hàn tại KonKuk"
    },
    {
      "id": "service-fee-konkuk",
      "name": "Phí tư vấn KonKuk",
      "nameVi": "Phí tư vấn KonKuk",
      "nameKo": "건국대 상담 수수료",
      "type": "fixed",
      "base_value": 39000000,
      "currency": "VND",
      "time_unit": "one_time",
      "category": "service",
      "required": true,
      "applies_to": ["D4-1"],
      "note": "Phí tư vấn toàn diện từ A-Z cho KonKuk"
    },
    {
      "id": "accommodation-d4-1-konkuk",
      "name": "Ký túc xá KonKuk",
      "nameVi": "Ký túc xá KonKuk",
      "nameKo": "건국대 기숙사",
      "type": "optional_multiple",
      "base_value": 0,
      "currency": "VND",
      "time_unit": "month",
      "category": "accommodation",
      "required": false,
      "options": [
        {
          "id": "room-2p-konkuk",
          "label": "Phòng 2 người",
          "value": 800000,
          "currency": "VND",
          "note": "Phòng ở chung 2 người tại KonKuk"
        },
        {
          "id": "room-1p-konkuk",
          "label": "Phòng 1 người",
          "value": 1200000,
          "currency": "VND",
          "note": "Phòng riêng 1 người tại KonKuk"
        }
      ],
      "default_selected": "room-2p-konkuk",
      "applies_to": ["D4-1"],
      "note": "Lựa chọn chỗ ở tại KonKuk"
    }
  ]'
)
ON CONFLICT (university_id, code) DO NOTHING;

-- 13. Update universities table with systems array
UPDATE universities 
SET systems = (
  SELECT JSON_AGG(
    json_build_object(
      'id', id,
      'code', code,
      'name', name,
      'nameVi', name_vi,
      'nameKo', name_ko,
      'description', description,
      'available', available,
      'fees', fees,
      'createdAt', created_at,
      'updatedAt', updated_at
    )
  )
  FROM university_systems 
  WHERE university_systems.university_id = universities.id
)
WHERE EXISTS (
  SELECT 1 FROM university_systems 
  WHERE university_systems.university_id = universities.id
);

-- 14. Function to sync systems array when university_systems changes
CREATE OR REPLACE FUNCTION sync_university_systems()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE universities 
  SET systems = (
    SELECT JSON_AGG(
      json_build_object(
        'id', id,
        'code', code,
        'name', name,
        'nameVi', name_vi,
        'nameKo', name_ko,
        'description', description,
        'available', available,
        'fees', fees,
        'createdAt', created_at,
        'updatedAt', updated_at
      )
    )
    FROM university_systems 
    WHERE university_systems.university_id = COALESCE(NEW.university_id, OLD.university_id)
  )
  WHERE id = COALESCE(NEW.university_id, OLD.university_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 15. Triggers for automatic systems sync
CREATE TRIGGER sync_systems_on_insert
  AFTER INSERT ON university_systems
  FOR EACH ROW EXECUTE FUNCTION sync_university_systems();

CREATE TRIGGER sync_systems_on_update
  AFTER UPDATE ON university_systems
  FOR EACH ROW EXECUTE FUNCTION sync_university_systems();

CREATE TRIGGER sync_systems_on_delete
  AFTER DELETE ON university_systems
  FOR EACH ROW EXECUTE FUNCTION sync_university_systems();

COMMIT;
