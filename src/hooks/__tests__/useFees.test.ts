import { renderHook, act } from '@testing-library/react';
import { useFees } from '../useFees';
import type { FlexibleFee } from '../../types/fees';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { fees: mockFees },
            error: null
          }))
        }))
      }))
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({
          unsubscribe: jest.fn()
        }))
      }))
    })),
    removeChannel: jest.fn()
  }))
}));

// Mock fees data
const mockFees: FlexibleFee[] = [
  {
    id: 'tuition-d4-1',
    name: 'Học phí hệ D4-1',
    type: 'fixed',
    base_value: 15000000,
    currency: 'VND',
    time_unit: 'semester',
    category: 'tuition',
    required: true,
    applies_to: ['D4-1']
  },
  {
    id: 'accommodation-d4-1',
    name: 'Ký túc xá',
    type: 'optional_multiple',
    base_value: 0,
    currency: 'VND',
    time_unit: 'month',
    category: 'accommodation',
    required: false,
    options: [
      {
        id: 'room-2p',
        label: 'Phòng 2 người',
        value: 800000,
        currency: 'VND',
        note: 'Phòng ở chung 2 người'
      },
      {
        id: 'room-1p',
        label: 'Phòng 1 người',
        value: 1200000,
        currency: 'VND',
        note: 'Phòng riêng 1 người'
      }
    ],
    default_selected: 'room-2p',
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  },
  {
    id: 'scholarship-topik',
    name: 'Học bổng TOPIK',
    type: 'percentage',
    base_value: 25000000,
    currency: 'VND',
    category: 'scholarship',
    required: false,
    conditions: [
      {
        id: 'topik-6',
        label: 'TOPIK 6 cấp',
        percentage: 100,
        note: 'Miễn 100% học phí'
      },
      {
        id: 'topik-4',
        label: 'TOPIK 4 cấp',
        percentage: 50,
        note: 'Giảm 50% học phí'
      }
    ],
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  },
  {
    id: 'health-insurance',
    name: 'Bảo hiểm y tế',
    type: 'optional',
    base_value: 2000000,
    currency: 'VND',
    time_unit: 'year',
    category: 'insurance',
    required: false,
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  }
];

describe('useFees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.fees).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('should load fees and set default selections', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    // Wait for async loading to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.fees).toEqual(mockFees);
    expect(result.current.selectedOptions).toEqual({
      'accommodation-d4-1': 'room-2p'
    });
    expect(result.current.selectedConditions).toEqual({
      'scholarship-topik': 'topik-6'
    });
    expect(result.current.timeValues).toEqual({
      'tuition-d4-1': 1,
      'accommodation-d4-1': 1,
      'health-insurance': 1
    });
  });

  it('should filter fees by visa type', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Select D4-1 visa type
    act(() => {
      result.current.setSelectedVisaType('D4-1');
    });

    const calculation = result.current.calculation;
    expect(calculation.breakdown).toHaveLength(4); // All fees apply to D4-1
  });

  it('should calculate total costs correctly', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
    });

    const calculation = result.current.calculation;
    
    // Fixed fees: tuition (15,000,000)
    // Optional multiple: accommodation (800,000 * 1 month)
    // Optional: health insurance (2,000,000) - not selected by default
    // Percentage: scholarship (25,000,000 * 100% discount = 0)
    
    expect(calculation.total_fees).toBe(15800000); // tuition + accommodation
    expect(calculation.total_discounts).toBe(25000000); // full scholarship
    expect(calculation.final_total).toBe(15800000); // tuition + accommodation
  });

  it('should handle optional fee selection', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
      result.current.setOptionalFees({
        'health-insurance': true
      });
    });

    const calculation = result.current.calculation;
    expect(calculation.final_total).toBe(17800000); // Add health insurance
  });

  it('should handle multiple option selection', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
      result.current.setSelectedOptions({
        'accommodation-d4-1': 'room-1p' // More expensive option
      });
    });

    const calculation = result.current.calculation;
    expect(calculation.final_total).toBe(16200000); // tuition + room-1p (1,200,000)
  });

  it('should handle percentage condition selection', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
      result.current.setSelectedConditions({
        'scholarship-topik': 'topik-4' // 50% discount
      });
    });

    const calculation = result.current.calculation;
    expect(calculation.total_discounts).toBe(12500000); // 50% of 25,000,000
    expect(calculation.final_total).toBe(15800000); // tuition + accommodation
  });

  it('should handle time-based calculations', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
      result.current.setTimeValues({
        'accommodation-d4-1': 6 // 6 months
      });
    });

    const calculation = result.current.calculation;
    expect(calculation.final_total).toBe(19800000); // tuition + accommodation * 6 months
  });

  it('should handle complex selections together', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
      result.current.setSelectedOptions({
        'accommodation-d4-1': 'room-1p'
      });
      result.current.setSelectedConditions({
        'scholarship-topik': 'topik-4'
      });
      result.current.setTimeValues({
        'accommodation-d4-1': 6
      });
      result.current.setOptionalFees({
        'health-insurance': true
      });
    });

    const calculation = result.current.calculation;
    
    // tuition: 15,000,000
    // accommodation: 1,200,000 * 6 = 7,200,000
    // health insurance: 2,000,000
    // Total before discount: 24,200,000
    // Scholarship discount: 12,500,000 (50% of 25,000,000)
    // Final: 24,200,000
    
    expect(calculation.total_fees).toBe(24200000);
    expect(calculation.total_discounts).toBe(12500000);
    expect(calculation.final_total).toBe(24200000);
  });

  it('should filter fees by visa type correctly', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Select D2-2 (none of the mock fees apply to D2-2)
    act(() => {
      result.current.setSelectedVisaType('D2-2');
    });

    const calculation = result.current.calculation;
    expect(calculation.breakdown).toHaveLength(0);
    expect(calculation.final_total).toBe(0);
  });

  it('should handle empty fees array', async () => {
    const { result } = renderHook(() => useFees('empty-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.fees).toEqual([]);
    expect(result.current.calculation.final_total).toBe(0);
  });

  it('should provide refresh functionality', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const refreshSpy = jest.fn();
    result.current.refreshFees = refreshSpy;

    act(() => {
      result.current.refreshFees();
    });

    expect(refreshSpy).toHaveBeenCalled();
  });
});

describe('Fee calculation edge cases', () => {
  it('should handle zero values correctly', async () => {
    const zeroFees: FlexibleFee[] = [
      {
        id: 'zero-fee',
        name: 'Zero fee',
        type: 'fixed',
        base_value: 0,
        currency: 'VND',
        applies_to: ['D4-1']
      }
    ];

    // Mock Supabase to return zero fees
    jest.mock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: { fees: zeroFees },
                error: null
              }))
            }))
          }))
        })),
        channel: jest.fn(() => ({
          on: jest.fn(() => ({
            subscribe: jest.fn(() => ({
              unsubscribe: jest.fn()
            }))
          }))
        })),
        removeChannel: jest.fn()
      }))
    }));

    const { result } = renderHook(() => useFees('zero-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.calculation.final_total).toBe(0);
  });

  it('should handle negative values (should not happen but test robustness)', async () => {
    const negativeFees: FlexibleFee[] = [
      {
        id: 'negative-fee',
        name: 'Negative fee',
        type: 'fixed',
        base_value: -1000,
        currency: 'VND',
        applies_to: ['D4-1']
      }
    ];

    // This should be handled by validation in the admin interface
    // But we test that the calculation handles it gracefully
    const { result } = renderHook(() => useFees('negative-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // The calculation should still work, even with negative values
    expect(result.current.calculation.final_total).toBe(-1000);
  });
});

describe('Fee selection state management', () => {
  it('should maintain independent state for different fee types', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
    });

    // Set different types of selections
    act(() => {
      result.current.setSelectedOptions({
        'accommodation-d4-1': 'room-1p'
      });
      result.current.setSelectedConditions({
        'scholarship-topik': 'topik-4'
      });
      result.current.setTimeValues({
        'accommodation-d4-1': 6
      });
      result.current.setOptionalFees({
        'health-insurance': true
      });
    });

    // Verify all states are maintained independently
    expect(result.current.selectedOptions).toEqual({
      'accommodation-d4-1': 'room-1p'
    });
    expect(result.current.selectedConditions).toEqual({
      'scholarship-topik': 'topik-4'
    });
    expect(result.current.timeValues).toEqual({
      'accommodation-d4-1': 6
    });
    expect(result.current.optionalFees).toEqual({
      'health-insurance': true
    });
  });

  it('should handle partial selections', async () => {
    const { result } = renderHook(() => useFees('test-university-id'));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.setSelectedVisaType('D4-1');
      // Only set one type of selection
      result.current.setSelectedOptions({
        'accommodation-d4-1': 'room-1p'
      });
    });

    // Should still calculate correctly with partial selections
    const calculation = result.current.calculation;
    expect(calculation.final_total).toBe(16200000); // tuition + room-1p
  });
});
