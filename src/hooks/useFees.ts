import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import type { FlexibleFee, FeeOption, FeeCondition } from '../types/fees';
import type { UniversitySystem } from '../types/university';

const LOAD_SELECTIONS_ERROR = 'Failed to load fee selections';

interface UseFeesResult {
  fees: FlexibleFee[];
  loading: boolean;
  error: string | null;
  selectedVisaType: string | null;
  setSelectedVisaType: (type: string | null) => void;
  selectedOptions: Record<string, string>;
  setSelectedOptions: (options: Record<string, string>) => void;
  selectedConditions: Record<string, string>;
  setSelectedConditions: (conditions: Record<string, string>) => void;
  timeValues: Record<string, number>;
  setTimeValues: (values: Record<string, number>) => void;
  optionalFees: Record<string, boolean>;
  setOptionalFees: (fees: Record<string, boolean>) => void;
  availableSystems: UniversitySystem[];
  calculation: {
    total_fees: number;
    total_discounts: number;
    final_total: number;
    currency: string;
    breakdown: Array<{
      fee_id: string;
      fee_name: string;
      selected_option?: string;
      quantity?: number;
      amount: number;
      discount?: number;
      final_amount: number;
    }>;
  };
  refreshFees: () => Promise<void>;
}

export function useFees(universityId?: string): UseFeesResult {
  const [fees, setFees] = useState<FlexibleFee[]>([]);
  const [availableSystems, setAvailableSystems] = useState<UniversitySystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisaType, setSelectedVisaType] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedConditions, setSelectedConditions] = useState<Record<string, string>>({});
  const [timeValues, setTimeValues] = useState<Record<string, number>>({});
  const [optionalFees, setOptionalFees] = useState<Record<string, boolean>>({});

  const fetchFees = useCallback(async () => {
    if (!universityId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await (supabase as any)
        .from('universities')
        .select('systems')
        .eq('id', universityId)
        .single() as { data: { systems: UniversitySystem[] } | null; error: { message: string } | null };

      if (fetchError) {
        throw new Error(fetchError?.message || 'Failed to fetch');
      }

      if (data?.systems && Array.isArray(data.systems)) {
        setAvailableSystems(data.systems);
        
        const allFees: FlexibleFee[] = [];
        const defaults: Record<string, any> = {};
        const timeDefaults: Record<string, number> = {};
        const optionalDefaults: Record<string, boolean> = {};
        
        data.systems.forEach((system: UniversitySystem) => {
          if (system.fees && Array.isArray(system.fees)) {
            system.fees.forEach((fee: FlexibleFee) => {
              const feeWithSystem = {
                ...fee,
                id: `${system.code}_${fee.id}`,
                originalId: fee.id,
                applies_to: [system.code],
                systemCode: system.code,
                systemName: system.name,
              };
              allFees.push(feeWithSystem);
              
              if (fee.default_selected) {
                if (fee.type === 'optional_multiple' || fee.type === 'variable_time') {
                  defaults[feeWithSystem.id] = fee.default_selected as string;
                }
              }
              
              if (fee.type === 'percentage' && fee.conditions?.length) {
                defaults[feeWithSystem.id] = fee.conditions[0].id;
              }
              
              if (fee.time_unit && fee.type !== 'percentage') {
                timeDefaults[feeWithSystem.id] = 1;
              }
              
              if (fee.type === 'optional' && fee.required) {
                optionalDefaults[feeWithSystem.id] = true;
              }
            });
          }
        });
        
        setFees(allFees);
        setSelectedOptions(defaults);
        setTimeValues(timeDefaults);
        setOptionalFees(optionalDefaults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fees');
    } finally {
      setLoading(false);
    }
  }, [universityId]);

  useEffect(() => {
    if (!universityId) return;

    const channel = supabase
      .channel(`systems-changes-${universityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'universities',
          filter: `id=eq.${universityId}`
        },
        (payload: any) => {
          if (payload.new && 'systems' in payload.new) {
            const newSystems = payload.new.systems as UniversitySystem[];
            setAvailableSystems(newSystems);
            
            const allFees: FlexibleFee[] = [];
            newSystems.forEach((system: UniversitySystem) => {
              if (system.fees && Array.isArray(system.fees)) {
                system.fees.forEach((fee: FlexibleFee) => {
                  allFees.push({
                    ...fee,
                    id: `${system.code}_${fee.id}`,
                    originalId: fee.id,
                    applies_to: [system.code],
                    systemCode: system.code,
                    systemName: system.name,
                  });
                });
              }
            });
            setFees(allFees);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [universityId]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const calculation = useCallback(() => {
    const applicableFees = fees.filter(fee => 
      !selectedVisaType || 
      !fee.applies_to || 
      fee.applies_to.includes(selectedVisaType)
    );

    let totalFees = 0;
    let totalDiscounts = 0;
    const breakdown: UseFeesResult['calculation']['breakdown'] = [];

    applicableFees.forEach(fee => {
      let feeAmount = 0;
      let discount = 0;

      switch (fee.type) {
        case 'fixed':
          feeAmount = fee.base_value;
          break;
          
        case 'optional':
          if (optionalFees[fee.id]) {
            feeAmount = fee.base_value;
          }
          break;
          
        case 'optional_multiple':
        case 'variable_time': {
          const selectedOptionId = selectedOptions[fee.id];
          const selectedOption = fee.options?.find(opt => opt.id === selectedOptionId);
          if (selectedOption) {
            feeAmount = selectedOption.value;
          }
          break;
        }
          
        case 'percentage': {
          const selectedConditionId = selectedConditions[fee.id];
          const selectedCondition = fee.conditions?.find(cond => cond.id === selectedConditionId);
          if (selectedCondition) {
            const baseAmount = fee.base_value;
            discount = (baseAmount * selectedCondition.percentage) / 100;
            feeAmount = baseAmount - discount;
          }
          break;
        }
      }

      if (fee.time_unit && timeValues[fee.id]) {
        const multiplier = timeValues[fee.id];
        feeAmount = feeAmount * multiplier;
      }

      totalFees += feeAmount;
      totalDiscounts += discount;

      breakdown.push({
        fee_id: fee.id,
        fee_name: fee.name,
        selected_option: selectedOptions[fee.id],
        quantity: timeValues[fee.id],
        amount: feeAmount + discount,
        discount,
        final_amount: feeAmount
      });
    });

    return {
      total_fees: totalFees,
      total_discounts: totalDiscounts,
      final_total: totalFees,
      currency: 'VND',
      breakdown
    };
  }, [fees, selectedVisaType, selectedOptions, selectedConditions, timeValues, optionalFees]);

  return {
    fees,
    loading,
    error,
    selectedVisaType,
    setSelectedVisaType,
    selectedOptions,
    setSelectedOptions,
    selectedConditions,
    setSelectedConditions,
    timeValues,
    setTimeValues,
    optionalFees,
    setOptionalFees,
    availableSystems,
    calculation: calculation(),
    refreshFees: fetchFees
  };
}

export async function saveFeeSelections(
  trackingCode: string,
  universityId: string,
  selections: {
    visaType: string | null;
    options: Record<string, string>;
    conditions: Record<string, string>;
    timeValues: Record<string, number>;
    optionalFees: Record<string, boolean>;
  }
) {
  try {
    const { data: existing } = await (supabase as any)
      .from('student_fee_selections')
      .select('id')
      .eq('tracking_code', trackingCode)
      .eq('university_id', universityId)
      .single();

    const recordData = {
      tracking_code: trackingCode,
      university_id: universityId,
      selections: selections,
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      const result = await (supabase as any)
        .from('student_fee_selections')
        .update(recordData)
        .eq('tracking_code', trackingCode)
        .eq('university_id', universityId);
      error = result.error;
    } else {
      const result = await (supabase as any)
        .from('student_fee_selections')
        .insert({ ...recordData, created_at: new Date().toISOString() });
      error = result.error;
    }

    if (error) {
      throw new Error(error.message || 'Failed to save');
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save selections' 
    };
  }
}

export async function loadFeeSelections(trackingCode: string, universityId: string) {
  try {
    const { data, error } = await (supabase as any)
      .from('student_fee_selections')
      .select('selections')
      .eq('tracking_code', trackingCode)
      .eq('university_id', universityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message || 'Failed to load');
    }

    return data?.selections || null;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(LOAD_SELECTIONS_ERROR, error);
    }
    return null;
  }
}
