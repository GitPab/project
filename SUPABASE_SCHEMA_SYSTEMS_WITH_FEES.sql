-- ============================================================================
-- SACMA: Flexible Visa Systems Schema Update with Per-System Fees
-- ============================================================================
-- This migration adds a 'systems' JSONB array to the universities table
-- Each system has: code, name, available, fees[] with unique prices per system
-- ============================================================================

-- 1. Add systems column to universities table if not exists
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS systems JSONB DEFAULT '[]'::jsonb;

-- 2. Add estimated_cost column for caching calculated totals
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS estimated_cost JSONB DEFAULT NULL;

-- 3. Create index for systems queries
CREATE INDEX IF NOT EXISTS idx_universities_systems 
ON universities USING GIN (systems);

-- 4. Create index for estimated_cost
CREATE INDEX IF NOT EXISTS idx_universities_estimated_cost 
ON universities ((estimated_cost->>'amount'));

-- ============================================================================
-- Function: Calculate estimated cost from systems/fees
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_estimated_cost(systems_data JSONB)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  system JSONB;
  fee JSONB;
  fee_amount NUMERIC := 0;
  total_amount NUMERIC := 0;
  systems_included TEXT[] := '{}';
  fee_breakdown JSONB := '[]'::jsonb;
BEGIN
  -- Loop through each system
  FOR system IN SELECT * FROM jsonb_array_elements(systems_data)
  LOOP
    -- Only include available systems
    IF (system->>'available')::boolean = true THEN
      systems_included := array_append(systems_included, system->>'code');
      
      -- Loop through fees in this system
      FOR fee IN SELECT * FROM jsonb_array_elements(system->'fees')
      LOOP
        fee_amount := 0;
        
        -- Calculate fee based on type
        CASE fee->>'type'
          WHEN 'fixed' THEN
            fee_amount := (fee->>'base_value')::numeric;
            
          WHEN 'optional' THEN
            IF (fee->>'required')::boolean = true OR (fee->>'default_selected')::boolean = true THEN
              fee_amount := (fee->>'base_value')::numeric;
            END IF;
            
          WHEN 'optional_multiple', 'variable_time' THEN
            -- Find default option or first option
            DECLARE
              default_opt JSONB;
            BEGIN
              SELECT opt INTO default_opt
              FROM jsonb_array_elements(fee->'options') opt
              WHERE opt->>'id' = fee->>'default_selected'
              LIMIT 1;
              
              IF default_opt IS NULL THEN
                SELECT opt INTO default_opt
                FROM jsonb_array_elements(fee->'options') opt
                LIMIT 1;
              END IF;
              
              IF default_opt IS NOT NULL THEN
                fee_amount := (default_opt->>'value')::numeric;
              END IF;
            END;
            
          WHEN 'percentage' THEN
            DECLARE
              default_cond JSONB;
            BEGIN
              SELECT cond INTO default_cond
              FROM jsonb_array_elements(fee->'conditions') cond
              LIMIT 1;
              
              IF default_cond IS NOT NULL THEN
                fee_amount := -((fee->>'base_value')::numeric * (default_cond->>'percentage')::numeric) / 100;
              END IF;
            END;
        END CASE;
        
        total_amount := total_amount + fee_amount;
        
        -- Add to breakdown
        fee_breakdown := fee_breakdown || jsonb_build_object(
          'name', fee->>'name',
          'amount', fee_amount,
          'system', system->>'code',
          'type', fee->>'type'
        );
      END LOOP;
    END IF;
  END LOOP;
  
  -- Build result
  result := jsonb_build_object(
    'amount', total_amount,
    'currency', 'VND',
    'systems_included', systems_included,
    'breakdown', fee_breakdown
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Trigger: Auto-update estimated_cost when systems change
-- ============================================================================
CREATE OR REPLACE FUNCTION update_university_estimated_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and store estimated cost
  NEW.estimated_cost := calculate_estimated_cost(NEW.systems);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS tr_update_estimated_cost ON universities;

-- Create trigger
CREATE TRIGGER tr_update_estimated_cost
  BEFORE INSERT OR UPDATE ON universities
  FOR EACH ROW
  EXECUTE FUNCTION update_university_estimated_cost();

-- ============================================================================
-- Seed Data: Ajou University with Different Prices per System
-- ============================================================================

-- Insert or update Ajou University with complete systems data
INSERT INTO universities (
  id, 
  name, 
  korean_name,
  country, 
  region,
  description,
  logo_url,
  systems,
  created_at,
  updated_at
)
VALUES (
  'ajou-university',
  'Ajou University',
  '아주대학교',
  'South Korea',
  'Suwon',
  'Leading university in Suwon with strong engineering and business programs',
  '/logos/ajou.svg',
  '[
    {
      "code": "D4-1",
      "name": "D4-1 (Thẳng lên - 4 năm đại học)",
      "available": true,
      "description": "Chương trình đại học 4 năm trực tiếp",
      "fees": [
        {
          "id": "d4-1-tuition",
          "name": "Học phí năm 1",
          "type": "fixed",
          "base_value": 52000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true,
          "description": "Học phí năm học đầu tiên"
        },
        {
          "id": "d4-1-visa",
          "name": "Phí visa D4-1",
          "type": "fixed",
          "base_value": 1200000,
          "currency": "VND",
          "category": "visa",
          "required": true,
          "description": "Phí xin visa D4-1"
        },
        {
          "id": "d4-1-dorm",
          "name": "Phí ký túc xá",
          "type": "optional_multiple",
          "base_value": 0,
          "currency": "KRW",
          "category": "accommodation",
          "required": false,
          "default_selected": "2-person",
          "description": "Phí ở ký túc xá",
          "options": [
            {"id": "2-person", "name": "Phòng 2 người", "value": 15000000},
            {"id": "4-person", "name": "Phòng 4 người", "value": 10000000}
          ]
        },
        {
          "id": "d4-1-insurance",
          "name": "Bảo hiểm y tế",
          "type": "fixed",
          "base_value": 600000,
          "currency": "VND",
          "category": "insurance",
          "required": true,
          "description": "Bảo hiểm y tế bắt buộc"
        }
      ]
    },
    {
      "code": "D2-2",
      "name": "D2-2 (Chuẩn bị - 2 năm tiếng Hàn)",
      "available": true,
      "description": "Chương trình học tiếng Hàn 2 năm trước khi vào đại học",
      "fees": [
        {
          "id": "d2-2-tuition-1",
          "name": "Học phí năm tiếng Hàn 1",
          "type": "fixed",
          "base_value": 32000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true,
          "description": "Học phí năm học tiếng Hàn đầu tiên"
        },
        {
          "id": "d2-2-tuition-2",
          "name": "Học phí năm tiếng Hàn 2",
          "type": "fixed",
          "base_value": 32000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true,
          "description": "Học phí năm học tiếng Hàn thứ hai"
        },
        {
          "id": "d2-2-visa",
          "name": "Phí visa D2-2",
          "type": "fixed",
          "base_value": 1200000,
          "currency": "VND",
          "category": "visa",
          "required": true,
          "description": "Phí xin visa D2-2"
        },
        {
          "id": "d2-2-dorm",
          "name": "Phí ký túc xá",
          "type": "optional_multiple",
          "base_value": 0,
          "currency": "KRW",
          "category": "accommodation",
          "required": false,
          "default_selected": "4-person",
          "description": "Phí ở ký túc xá (thường chọn phòng 4 người để tiết kiệm)",
          "options": [
            {"id": "2-person", "name": "Phòng 2 người", "value": 15000000},
            {"id": "4-person", "name": "Phòng 4 người", "value": 10000000}
          ]
        },
        {
          "id": "d2-2-insurance",
          "name": "Bảo hiểm y tế",
          "type": "fixed",
          "base_value": 600000,
          "currency": "VND",
          "category": "insurance",
          "required": true,
          "description": "Bảo hiểm y tế bắt buộc"
        }
      ]
    },
    {
      "code": "D2-1",
      "name": "D2-1 (Thẳng lên đại học)",
      "available": false,
      "description": "Chương trình đại học trực tiếp (tạm ngưng)",
      "fees": []
    },
    {
      "code": "D2-3",
      "name": "D2-3 (Cao đẳng)",
      "available": true,
      "description": "Chương trình cao đẳng 2-3 năm",
      "fees": [
        {
          "id": "d2-3-tuition",
          "name": "Học phí cao đẳng năm 1",
          "type": "fixed",
          "base_value": 28000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true,
          "description": "Học phí năm học cao đẳng đầu tiên"
        },
        {
          "id": "d2-3-visa",
          "name": "Phí visa D2-3",
          "type": "fixed",
          "base_value": 1200000,
          "currency": "VND",
          "category": "visa",
          "required": true,
          "description": "Phí xin visa D2-3"
        }
      ]
    },
    {
      "code": "D2-6",
      "name": "D2-6 (Thạc sĩ)",
      "available": true,
      "description": "Chương trình thạc sĩ",
      "fees": [
        {
          "id": "d2-6-tuition",
          "name": "Học phí thạc sĩ năm 1",
          "type": "fixed",
          "base_value": 58000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true,
          "description": "Học phí năm học thạc sĩ đầu tiên"
        },
        {
          "id": "d2-6-visa",
          "name": "Phí visa D2-6",
          "type": "fixed",
          "base_value": 1200000,
          "currency": "VND",
          "category": "visa",
          "required": true,
          "description": "Phí xin visa D2-6"
        }
      ]
    }
  ]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  systems = EXCLUDED.systems,
  estimated_cost = calculate_estimated_cost(EXCLUDED.systems),
  updated_at = NOW();

-- ============================================================================
-- Seed Data: Konkuk University
-- ============================================================================

INSERT INTO universities (
  id, 
  name, 
  korean_name,
  country, 
  region,
  description,
  systems,
  created_at,
  updated_at
)
VALUES (
  'konkuk-university',
  'Konkuk University',
  '건국대학교',
  'South Korea',
  'Seoul',
  'Top university in Seoul with excellent veterinary and business programs',
  '[
    {
      "code": "D4-1",
      "name": "D4-1 (Thẳng lên - 4 năm đại học)",
      "available": true,
      "fees": [
        {
          "id": "konkuk-d4-1-tuition",
          "name": "Học phí năm 1",
          "type": "fixed",
          "base_value": 58000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true
        },
        {
          "id": "konkuk-d4-1-visa",
          "name": "Phí visa",
          "type": "fixed",
          "base_value": 1200000,
          "currency": "VND",
          "category": "visa",
          "required": true
        },
        {
          "id": "konkuk-d4-1-dorm",
          "name": "Phí ký túc xá",
          "type": "optional_multiple",
          "currency": "KRW",
          "category": "accommodation",
          "default_selected": "2-person",
          "options": [
            {"id": "2-person", "name": "Phòng 2 người", "value": 18000000},
            {"id": "4-person", "name": "Phòng 4 người", "value": 12000000}
          ]
        }
      ]
    },
    {
      "code": "D2-2",
      "name": "D2-2 (Chuẩn bị - 2 năm tiếng Hàn)",
      "available": true,
      "fees": [
        {
          "id": "konkuk-d2-2-tuition-1",
          "name": "Học phí năm tiếng Hàn 1",
          "type": "fixed",
          "base_value": 36000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true
        },
        {
          "id": "konkuk-d2-2-tuition-2",
          "name": "Học phí năm tiếng Hàn 2",
          "type": "fixed",
          "base_value": 36000000,
          "currency": "KRW",
          "category": "tuition",
          "required": true
        }
      ]
    }
  ]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  systems = EXCLUDED.systems,
  estimated_cost = calculate_estimated_cost(EXCLUDED.systems),
  updated_at = NOW();

-- ============================================================================
-- Update all existing universities to have empty systems array if null
-- ============================================================================

UPDATE universities 
SET systems = '[]'::jsonb 
WHERE systems IS NULL;

-- Calculate estimated_cost for all universities
UPDATE universities
SET estimated_cost = calculate_estimated_cost(systems)
WHERE estimated_cost IS NULL;

-- ============================================================================
-- RLS Policies for systems
-- ============================================================================

-- Allow admins to update systems
CREATE POLICY IF NOT EXISTS "Admins can update university systems"
ON universities
FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow all users to view systems
CREATE POLICY IF NOT EXISTS "All users can view university systems"
ON universities
FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous users to view systems (for public pages)
CREATE POLICY IF NOT EXISTS "Anonymous users can view university systems"
ON universities
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- Enable Realtime for universities table
-- ============================================================================

-- Add universities table to realtime publication
BEGIN;
  -- Drop if exists to avoid errors
  DROP PUBLICATION IF EXISTS supabase_realtime;
  -- Create new publication
  CREATE PUBLICATION supabase_realtime;
  -- Add universities table
  ALTER PUBLICATION supabase_realtime ADD TABLE universities;
COMMIT;

-- ============================================================================
-- CSV Import Helper Function
-- ============================================================================

CREATE OR REPLACE FUNCTION import_university_systems_from_csv(
  university_id TEXT,
  csv_data TEXT
)
RETURNS JSONB AS $$
DECLARE
  lines TEXT[];
  line TEXT;
  parts TEXT[];
  system_code TEXT;
  fee_name TEXT;
  fee_type TEXT;
  fee_value NUMERIC;
  fee_currency TEXT;
  current_system JSONB;
  all_systems JSONB := '[]'::jsonb;
BEGIN
  -- Split CSV into lines
  lines := string_to_array(csv_data, E'\n');
  
  -- Process each line
  FOREACH line IN ARRAY lines
  LOOP
    -- Skip empty lines and headers
    IF line = '' OR line LIKE 'System Code%' THEN
      CONTINUE;
    END IF;
    
    -- Parse CSV line
    parts := string_to_array(line, ',');
    
    IF array_length(parts, 1) >= 5 THEN
      system_code := trim(parts[1]);
      fee_name := trim(parts[2]);
      fee_type := trim(parts[3]);
      fee_value := (trim(parts[4]))::numeric;
      fee_currency := trim(parts[5]);
      
      -- Build fee object
      current_system := jsonb_build_object(
        'code', system_code,
        'name', fee_name,
        'available', true,
        'fees', jsonb_build_array(
          jsonb_build_object(
            'id', system_code || '-' || lower(replace(fee_name, ' ', '-')),
            'name', fee_name,
            'type', fee_type,
            'base_value', fee_value,
            'currency', fee_currency,
            'required', true
          )
        )
      );
      
      all_systems := all_systems || current_system;
    END IF;
  END LOOP;
  
  -- Update university with new systems
  UPDATE universities
  SET systems = all_systems,
      estimated_cost = calculate_estimated_cost(all_systems),
      updated_at = NOW()
  WHERE id = university_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'systems_added', jsonb_array_length(all_systems),
    'message', 'Systems imported successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_estimated_cost(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION import_university_systems_from_csv(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_university_estimated_cost() TO authenticated;

-- ============================================================================
-- End of migration
-- ============================================================================
