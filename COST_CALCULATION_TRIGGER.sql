-- Database Trigger for Automatic Cost Calculation
-- This trigger automatically calculates and updates estimated total costs
-- when university systems or fees are modified

-- 1. Create function to calculate university estimated cost
CREATE OR REPLACE FUNCTION calculate_university_estimated_cost(university_id UUID)
RETURNS JSONB AS $$
DECLARE
    university_data JSONB;
    systems_data JSONB;
    total_fixed NUMERIC DEFAULT 0;
    total_optional NUMERIC DEFAULT 0;
    min_cost NUMERIC;
    max_cost NUMERIC;
    avg_cost NUMERIC;
    systems_included TEXT[] DEFAULT '{}';
    cost_breakdown JSONB DEFAULT '[]';
    result JSONB;
BEGIN
    -- Get university data with systems
    SELECT jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'systems', u.systems
    ) INTO university_data
    FROM universities u
    WHERE u.id = university_id;

    -- Extract systems array
    systems_data := university_data->>'systems';
    
    -- If no systems, return default cost calculation
    IF systems_data IS NULL OR jsonb_array_length(systems_data) = 0 THEN
        -- Fallback to legacy cost structure
        SELECT 
            COALESCE(general_tuition, 0) + COALESCE(visa_fee, 0) as fixed,
            COALESCE(accommodation_fee, 0) + COALESCE(insurance_fee, 0) as optional
        INTO total_fixed, total_optional
        FROM universities
        WHERE id = university_id;
        
        avg_cost := total_fixed + total_optional;
        min_cost := avg_cost;
        max_cost := avg_cost;
        
        result := jsonb_build_object(
            'amount', avg_cost,
            'currency', 'VND',
            'min_amount', min_cost,
            'max_amount', max_cost,
            'average_amount', avg_cost,
            'systems_included', systems_included,
            'breakdown', jsonb_build_object(
                'fixed_costs', total_fixed,
                'optional_costs', total_optional,
                'total_costs', avg_cost,
                'currency', 'VND',
                'breakdown', cost_breakdown
            )
        );
        
        RETURN result;
    END IF;

    -- Calculate costs for each available system
    FOR i IN 0..jsonb_array_length(systems_data) - 1 LOOP
        DECLARE
            system_data JSONB;
            system_code TEXT;
            system_available BOOLEAN;
            system_fees JSONB;
            system_fixed NUMERIC DEFAULT 0;
            system_optional NUMERIC DEFAULT 0;
            system_total NUMERIC DEFAULT 0;
        BEGIN
            system_data := systems_data->i;
            system_code := system_data->>'code';
            system_available := (system_data->>'available')::BOOLEAN;
            system_fees := system_data->'fees';
            
            -- Skip unavailable systems
            IF NOT system_available THEN
                CONTINUE;
            END IF;
            
            -- Add system code to included systems
            systems_included := array_append(systems_included, system_code);
            
            -- Calculate costs for this system
            IF system_fees IS NOT NULL THEN
                FOR j IN 0..jsonb_array_length(system_fees) - 1 LOOP
                    DECLARE
                        fee_data JSONB;
                        fee_type TEXT;
                        fee_base_value NUMERIC;
                        fee_currency TEXT;
                        fee_time_unit TEXT;
                        fee_category TEXT;
                        fee_required BOOLEAN;
                        fee_options JSONB;
                        fee_conditions JSONB;
                        fee_default_selected TEXT;
                        fee_amount NUMERIC DEFAULT 0;
                    BEGIN
                        fee_data := system_fees->j;
                        fee_type := fee_data->>'type';
                        fee_base_value := COALESCE((fee_data->>'base_value')::NUMERIC, 0);
                        fee_currency := COALESCE(fee_data->>'currency', 'VND');
                        fee_time_unit := fee_data->>'time_unit';
                        fee_category := COALESCE(fee_data->>'category', 'other');
                        fee_required := COALESCE((fee_data->>'required')::BOOLEAN, FALSE);
                        fee_options := fee_data->'options';
                        fee_conditions := fee_data->'conditions';
                        fee_default_selected := fee_data->>'default_selected';
                        
                        -- Calculate fee amount based on type
                        CASE fee_type
                            WHEN 'fixed' THEN
                                fee_amount := fee_base_value;
                                system_fixed := system_fixed + fee_amount;
                                
                            WHEN 'optional' THEN
                                IF fee_required OR fee_default_selected IS NOT NULL THEN
                                    fee_amount := fee_base_value;
                                    system_optional := system_optional + fee_amount;
                                END IF;
                                
                            WHEN 'optional_multiple' THEN
                                IF fee_options IS NOT NULL THEN
                                    -- Find default option or first option
                                    DECLARE
                                        default_option JSONB;
                                        option_value NUMERIC;
                                    BEGIN
                                        default_option := (
                                            SELECT opt 
                                            FROM jsonb_array_elements(fee_options) opt 
                                            WHERE opt->>'id' = fee_default_selected
                                            LIMIT 1
                                        );
                                        
                                        IF default_option IS NULL THEN
                                            default_option := fee_options->0;
                                        END IF;
                                        
                                        option_value := COALESCE((default_option->>'value')::NUMERIC, 0);
                                        fee_amount := option_value;
                                        system_optional := system_optional + fee_amount;
                                    END;
                                END IF;
                                
                            WHEN 'variable_time' THEN
                                IF fee_options IS NOT NULL THEN
                                    -- Find default option or first option
                                    DECLARE
                                        default_option JSONB;
                                        option_value NUMERIC;
                                        time_multiplier NUMERIC DEFAULT 1;
                                    BEGIN
                                        default_option := (
                                            SELECT opt 
                                            FROM jsonb_array_elements(fee_options) opt 
                                            WHERE opt->>'id' = fee_default_selected
                                            LIMIT 1
                                        );
                                        
                                        IF default_option IS NULL THEN
                                            default_option := fee_options->0;
                                        END IF;
                                        
                                        option_value := COALESCE((default_option->>'value')::NUMERIC, 0);
                                        
                                        -- Apply time multiplier
                                        IF fee_time_unit = 'month' THEN
                                            time_multiplier := 6; -- Default 6 months
                                        ELSIF fee_time_unit = 'year' THEN
                                            time_multiplier := 1; -- Default 1 year
                                        ELSIF fee_time_unit = 'semester' THEN
                                            time_multiplier := 1; -- Default 1 semester
                                        END IF;
                                        
                                        fee_amount := option_value * time_multiplier;
                                        system_optional := system_optional + fee_amount;
                                    END;
                                END IF;
                                
                            WHEN 'percentage' THEN
                                IF fee_conditions IS NOT NULL THEN
                                    -- Use first condition for calculation
                                    DECLARE
                                        first_condition JSONB;
                                        percentage_value NUMERIC;
                                    BEGIN
                                        first_condition := fee_conditions->0;
                                        percentage_value := COALESCE((first_condition->>'percentage')::NUMERIC, 0);
                                        fee_amount := -(fee_base_value * percentage_value / 100);
                                        system_optional := system_optional + fee_amount; -- Negative for discount
                                    END;
                                END IF;
                        END CASE;
                        
                        -- Add to breakdown
                        cost_breakdown := cost_breakdown || jsonb_build_object(
                            'system_code', system_code,
                            'fee_id', fee_data->>'id',
                            'fee_name', fee_data->>'name',
                            'fee_type', fee_type,
                            'fee_category', fee_category,
                            'amount', fee_amount,
                            'currency', fee_currency
                        );
                        
                    END;
                END LOOP;
            END IF;
            
            system_total := system_fixed + system_optional;
            total_fixed := total_fixed + system_fixed;
            total_optional := total_optional + system_optional;
            
            -- Track min/max for range calculation
            IF i = 0 THEN
                min_cost := system_total;
                max_cost := system_total;
            ELSE
                min_cost := LEAST(min_cost, system_total);
                max_cost := GREATEST(max_cost, system_total);
            END IF;
            
        END;
    END LOOP;
    
    -- Calculate average
    IF array_length(systems_included, 1) > 0 THEN
        avg_cost := (total_fixed + total_optional) / array_length(systems_included, 1);
    ELSE
        avg_cost := total_fixed + total_optional;
        min_cost := avg_cost;
        max_cost := avg_cost;
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'amount', avg_cost,
        'currency', 'VND',
        'min_amount', min_cost,
        'max_amount', max_cost,
        'average_amount', avg_cost,
        'systems_included', systems_included,
        'fixed_costs', total_fixed,
        'optional_costs', total_optional,
        'breakdown', jsonb_build_object(
            'fixed_costs', total_fixed,
            'optional_costs', total_optional,
            'total_costs', avg_cost,
            'currency', 'VND',
            'breakdown', cost_breakdown
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Add estimated_cost column to universities table
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS estimated_cost JSONB DEFAULT NULL;

-- 3. Create trigger to automatically calculate estimated cost
CREATE OR REPLACE FUNCTION update_university_estimated_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Update estimated cost when university data changes
    NEW.estimated_cost := calculate_university_estimated_cost(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers for universities table
CREATE TRIGGER trigger_update_university_estimated_cost
    BEFORE INSERT OR UPDATE ON universities
    FOR EACH ROW
    EXECUTE FUNCTION update_university_estimated_cost();

-- 5. Create trigger for university_systems table changes
CREATE OR REPLACE FUNCTION update_university_estimated_cost_on_system_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update estimated cost when systems change
    UPDATE universities 
    SET estimated_cost = calculate_university_estimated_cost(university_id)
    WHERE id = COALESCE(NEW.university_id, OLD.university_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cost_on_system_change
    AFTER INSERT OR UPDATE OR DELETE ON university_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_university_estimated_cost_on_system_change();

-- 6. Create function to recalculate all universities costs (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_all_universities_costs()
RETURNS INTEGER AS $$
DECLARE
    university_count INTEGER := 0;
    university_record RECORD;
BEGIN
    FOR university_record IN 
        SELECT id FROM universities 
        WHERE estimated_cost IS NULL OR systems IS NOT NULL
    LOOP
        UPDATE universities 
        SET estimated_cost = calculate_university_estimated_cost(university_record.id)
        WHERE id = university_record.id;
        
        university_count := university_count + 1;
    END LOOP;
    
    RETURN university_count;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get cost breakdown for display
CREATE OR REPLACE FUNCTION get_university_cost_breakdown(university_id UUID)
RETURNS TABLE (
    system_code TEXT,
    fee_name TEXT,
    fee_type TEXT,
    fee_category TEXT,
    amount NUMERIC,
    currency TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        item->>'system_code' as system_code,
        item->>'fee_name' as fee_name,
        item->>'fee_type' as fee_type,
        item->>'fee_category' as fee_category,
        (item->>'amount')::NUMERIC as amount,
        item->>'currency' as currency
    FROM jsonb_array_elements(
        (SELECT estimated_cost->'breakdown'->'breakdown' 
         FROM universities 
         WHERE id = university_id)
    ) as item;
END;
$$ LANGUAGE plpgsql;

-- 8. Create view for universities with cost calculations
CREATE OR REPLACE VIEW universities_with_costs AS
SELECT 
    u.*,
    ec.amount as estimated_amount,
    ec.currency as estimated_currency,
    ec.min_amount as estimated_min_amount,
    ec.max_amount as estimated_max_amount,
    ec.average_amount as estimated_average_amount,
    ec.systems_included as estimated_systems_included,
    ec.fixed_costs as estimated_fixed_costs,
    ec.optional_costs as estimated_optional_costs
FROM universities u
LEFT JOIN LATERAL jsonb_to_recordset(u.estimated_cost) ec(
    amount NUMERIC,
    currency TEXT,
    min_amount NUMERIC,
    max_amount NUMERIC,
    average_amount NUMERIC,
    systems_included TEXT[],
    fixed_costs NUMERIC,
    optional_costs NUMERIC
) ON true;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_universities_estimated_cost ON universities USING GIN (estimated_cost);
CREATE INDEX IF NOT EXISTS idx_universities_estimated_amount ON universities ((estimated_cost->>'amount')::NUMERIC);
CREATE INDEX IF NOT EXISTS idx_universities_estimated_min_max ON universities (
    ((estimated_cost->>'min_amount')::NUMERIC),
    ((estimated_cost->>'max_amount')::NUMERIC)
);

-- 10. Initialize estimated costs for existing universities
-- This will be run once to populate existing data
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT recalculate_all_universities_costs() INTO updated_count;
    RAISE NOTICE 'Updated estimated costs for % universities', updated_count;
END $$;

COMMIT;
