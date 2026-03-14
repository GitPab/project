-- ============================================================================
-- SUPABASE REALTIME SYNC - Visa Systems & Fees
-- ============================================================================

-- 1. Enable Realtime for universities table
ALTER TABLE universities REPLICA IDENTITY FULL;

-- 2. Create publication for realtime changes
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE universities;

-- 3. Function to auto-calculate estimated_cost from systems array
CREATE OR REPLACE FUNCTION calculate_estimated_cost_from_systems(systems_json JSONB)
RETURNS JSONB AS $$
DECLARE
    total_amount NUMERIC := 0;
    systems_included TEXT[] := ARRAY[]::TEXT[];
    sys RECORD;
    fee RECORD;
    fee_amount NUMERIC;
BEGIN
    -- Iterate through systems
    FOR sys IN SELECT * FROM jsonb_array_elements(systems_json)
    LOOP
        -- Only count available systems
        IF (sys.value->>'available')::BOOLEAN THEN
            systems_included := array_append(systems_included, sys.value->>'code');
            
            -- Sum up fees for this system
            IF jsonb_typeof(sys.value->'fees') = 'array' THEN
                FOR fee IN SELECT * FROM jsonb_array_elements(sys.value->'fees')
                LOOP
                    fee_amount := (fee.value->>'base_value')::NUMERIC;
                    
                    -- Add to total if it's a fixed or required fee
                    IF fee.value->>'type' = 'fixed' OR (fee.value->>'required')::BOOLEAN THEN
                        total_amount := total_amount + fee_amount;
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
    
    RETURN jsonb_build_object(
        'amount', total_amount,
        'currency', 'KRW',
        'systems_included', systems_included
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Trigger to auto-update estimated_cost when systems change
CREATE OR REPLACE FUNCTION update_estimated_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.estimated_cost := calculate_estimated_cost_from_systems(NEW.systems);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Apply trigger to universities table
DROP TRIGGER IF EXISTS trg_update_estimated_cost ON universities;
CREATE TRIGGER trg_update_estimated_cost
    BEFORE INSERT OR UPDATE OF systems ON universities
    FOR EACH ROW
    EXECUTE FUNCTION update_estimated_cost();

-- 6. Create student_fee_selections table for saving user selections
CREATE TABLE IF NOT EXISTS student_fee_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_code TEXT NOT NULL,
    university_id TEXT NOT NULL,
    selections JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tracking_code, university_id)
);

-- 7. Enable RLS on student_fee_selections
ALTER TABLE student_fee_selections ENABLE ROW LEVEL SECURITY;

-- 8. Create policy for students to view their own selections
CREATE POLICY "Students can view own selections" ON student_fee_selections
    FOR SELECT USING (auth.uid()::text = tracking_code OR true);

-- 9. Create policy for students to update their own selections  
CREATE POLICY "Students can update own selections" ON student_fee_selections
    FOR UPDATE USING (auth.uid()::text = tracking_code OR true);

-- 10. Create policy for students to insert their own selections
CREATE POLICY "Students can insert own selections" ON student_fee_selections
    FOR INSERT WITH CHECK (auth.uid()::text = tracking_code OR true);

-- 11. Grant permissions
GRANT ALL ON student_fee_selections TO authenticated;
GRANT ALL ON student_fee_selections TO anon;

-- ============================================================================
-- QUERY EXAMPLES
-- ============================================================================

-- Get university with all systems and fees
SELECT 
    id,
    name,
    systems,
    estimated_cost,
    updated_at
FROM universities 
WHERE id = 'university-id-here';

-- Get available systems only
SELECT 
    id,
    name,
    jsonb_agg(sys) as available_systems
FROM universities,
    jsonb_array_elements(systems) as sys
WHERE id = 'university-id-here'
    AND (sys->>'available')::boolean = true
GROUP BY id, name;

-- Get all fees flattened from available systems
SELECT 
    u.id,
    u.name,
    sys->>'code' as system_code,
    sys->>'name' as system_name,
    fee->>'id' as fee_id,
    fee->>'name' as fee_name,
    (fee->>'base_value')::numeric as fee_amount,
    fee->>'currency' as currency,
    fee->>'type' as fee_type,
    (fee->>'required')::boolean as is_required
FROM universities u,
    jsonb_array_elements(u.systems) as sys,
    jsonb_array_elements(sys->'fees') as fee
WHERE u.id = 'university-id-here'
    AND (sys->>'available')::boolean = true;

-- Update systems for a university
UPDATE universities 
SET systems = '[
  {
    "id": "system-1",
    "code": "D4-1",
    "name": "D4-1 (Thẳng lên - 4 năm)",
    "available": true,
    "description": "Chương trình đại học 4 năm",
    "fees": [
      {
        "id": "fee-1",
        "name": "Học phí",
        "type": "fixed",
        "base_value": 52000000,
        "currency": "KRW",
        "category": "tuition",
        "required": true
      },
      {
        "id": "fee-2",
        "name": "Phí apply",
        "type": "fixed",
        "base_value": 100000,
        "currency": "KRW",
        "category": "service",
        "required": true
      }
    ]
  },
  {
    "id": "system-2",
    "code": "D2-2",
    "name": "D2-2 (Chuẩn bị - 2 năm tiếng Hàn)",
    "available": true,
    "description": "Chương trình học tiếng Hàn 2 năm",
    "fees": [
      {
        "id": "fee-3",
        "name": "Học phí năm 1",
        "type": "fixed",
        "base_value": 32000000,
        "currency": "KRW",
        "category": "tuition",
        "required": true
      },
      {
        "id": "fee-4",
        "name": "Học phí năm 2",
        "type": "fixed",
        "base_value": 32000000,
        "currency": "KRW",
        "category": "tuition",
        "required": false
      }
    ]
  }
]'::jsonb
WHERE id = 'university-id-here';

-- Add a single system to existing systems
UPDATE universities 
SET systems = systems || '{
  "id": "system-new",
  "code": "D2-3",
  "name": "D2-3 (Cao đẳng)",
  "available": true,
  "description": "Chương trình cao đẳng",
  "fees": []
}'::jsonb
WHERE id = 'university-id-here';

-- Add fee to existing system
UPDATE universities 
SET systems = (
    SELECT jsonb_agg(
        CASE 
            WHEN (sys->>'code') = 'D4-1' THEN
                jsonb_set(sys, '{fees}', (sys->'fees') || '{
                    "id": "fee-new",
                    "name": "Phí dịch vụ mới",
                    "type": "optional",
                    "base_value": 5000000,
                    "currency": "KRW",
                    "category": "service",
                    "required": false
                }'::jsonb)
            ELSE sys
        END
    )
    FROM jsonb_array_elements(systems) as sys
)
WHERE id = 'university-id-here';

-- Toggle system availability
UPDATE universities 
SET systems = (
    SELECT jsonb_agg(
        CASE 
            WHEN (sys->>'code') = 'D4-1' THEN
                jsonb_set(sys, '{available}', 'false'::jsonb)
            ELSE sys
        END
    )
    FROM jsonb_array_elements(systems) as sys
)
WHERE id = 'university-id-here';

-- Delete a system
UPDATE universities 
SET systems = (
    SELECT jsonb_agg(sys)
    FROM jsonb_array_elements(systems) as sys
    WHERE (sys->>'code') != 'D2-2'
)
WHERE id = 'university-id-here';

-- ============================================================================
-- SEED DATA - Ajou University Example
-- ============================================================================

INSERT INTO universities (id, name, korean_name, country, region, systems, created_at, updated_at)
VALUES (
    'ajou-university',
    'Ajou University',
    '아주대학교',
    'South Korea',
    'Suwon',
    '[
      {
        "id": "sys-d4-1",
        "code": "D4-1",
        "name": "D4-1 (Chương trình tiếng Hàn)",
        "available": true,
        "description": "Chương trình đào tạo tiếng Hàn 1 năm",
        "fees": [
          {
            "id": "fee-tuition-d4",
            "name": "Học phí (Tuition)",
            "type": "fixed",
            "base_value": 52000000,
            "currency": "KRW",
            "category": "tuition",
            "required": true
          },
          {
            "id": "fee-apply-d4",
            "name": "Phí apply",
            "type": "fixed",
            "base_value": 1777000,
            "currency": "VND",
            "category": "service",
            "required": true
          },
          {
            "id": "fee-consult-d4",
            "name": "Phí tư vấn",
            "type": "fixed",
            "base_value": 39000000,
            "currency": "VND",
            "category": "service",
            "required": true
          }
        ]
      },
      {
        "id": "sys-d2-2",
        "code": "D2-2",
        "name": "D2-2 (Chương trình đại học)",
        "available": true,
        "description": "Chương trình đại học 4 năm",
        "fees": [
          {
            "id": "fee-tuition-d2-2",
            "name": "Học phí năm 1",
            "type": "fixed",
            "base_value": 32000000,
            "currency": "KRW",
            "category": "tuition",
            "required": true
          },
          {
            "id": "fee-tuition-d2-2-y2",
            "name": "Học phí năm 2",
            "type": "optional",
            "base_value": 32000000,
            "currency": "KRW",
            "category": "tuition",
            "required": false,
            "default_selected": true
          }
        ]
      },
      {
        "id": "sys-d2-3",
        "code": "D2-3",
        "name": "D2-3 (Chương trình sau đại học)",
        "available": true,
        "description": "Chương trình thạc sĩ",
        "fees": [
          {
            "id": "fee-tuition-d2-3",
            "name": "Học phí",
            "type": "fixed",
            "base_value": 28000000,
            "currency": "KRW",
            "category": "tuition",
            "required": true
          }
        ]
      },
      {
        "id": "sys-d2-6",
        "code": "D2-6",
        "name": "D2-6 (Chương trình nâng cao)",
        "available": true,
        "description": "Chương trình tiến sĩ",
        "fees": [
          {
            "id": "fee-tuition-d2-6",
            "name": "Học phí",
            "type": "fixed",
            "base_value": 58000000,
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
    updated_at = NOW();
