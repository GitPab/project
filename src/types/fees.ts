// Types for flexible fee management system

export type FeeType = 'fixed' | 'optional' | 'optional_multiple' | 'percentage' | 'variable_time';

export type TimeUnit = 'month' | 'year' | 'semester' | 'one_time';

export interface FeeOption {
  id: string;
  label: string;
  value: number;
  currency: string;
  note?: string;
  condition?: string;
}

export interface FeeCondition {
  id: string;
  label: string;
  percentage: number;
  note?: string;
  requirement?: string;
}

export interface FlexibleFee {
  id: string;
  name: string;
  nameVi?: string;
  nameKo?: string;
  type: FeeType;
  base_value: number;
  currency: string;
  time_unit?: TimeUnit;
  options?: FeeOption[];
  conditions?: FeeCondition[];
  default_selected?: string | string[];
  note?: string;
  category?: string;
  required?: boolean;
  min_value?: number;
  max_value?: number;
  applies_to?: string[]; // visa types this fee applies to
  created_at?: string;
  updated_at?: string;
  // System context properties (added at runtime)
  originalId?: string;
  systemCode?: string;
  systemName?: string;
}

export interface FeeGroup {
  id: string;
  name: string;
  nameVi?: string;
  nameKo?: string;
  order: number;
  fees: FlexibleFee[];
}

export interface CostCalculation {
  total_fees: number;
  total_discounts: number;
  final_total: number;
  currency: string;
  breakdown: {
    fee_id: string;
    fee_name: string;
    selected_option?: string;
    quantity?: number;
    amount: number;
    discount?: number;
    final_amount: number;
  }[];
}

// Example fee structures from CSV data
export const EXAMPLE_FEE_STRUCTURES = {
  // Ký túc xá (Accommodation) - optional_multiple with room options
  accommodation: {
    id: 'accommodation-d4-1',
    name: 'Ký túc xá',
    nameVi: 'Ký túc xá',
    nameKo: '기숙사',
    type: 'optional_multiple' as FeeType,
    base_value: 0,
    currency: 'VND',
    time_unit: 'month' as TimeUnit,
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
    category: 'accommodation',
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  },

  // Học bổng (Scholarship) - percentage with TOPIK conditions
  scholarship: {
    id: 'scholarship-topik',
    name: 'Học bổng TOPIK',
    nameVi: 'Học bổng TOPIK',
    nameKo: 'TOPIK 장학금',
    type: 'percentage' as FeeType,
    base_value: 0,
    currency: 'VND',
    conditions: [
      {
        id: 'topik-6',
        label: 'TOPIK 6 cấp',
        percentage: 100,
        note: 'Miễn 100% học phí'
      },
      {
        id: 'topik-5',
        label: 'TOPIK 5 cấp',
        percentage: 70,
        note: 'Giảm 70% học phí'
      },
      {
        id: 'topik-4',
        label: 'TOPIK 4 cấp',
        percentage: 50,
        note: 'Giảm 50% học phí'
      },
      {
        id: 'topik-3',
        label: 'TOPIK 3 cấp',
        percentage: 30,
        note: 'Giảm 30% học phí'
      }
    ],
    category: 'scholarship',
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  },

  // Vé máy bay (Air ticket) - variable_time based on booking time
  air_ticket: {
    id: 'air-ticket-variable',
    name: 'Vé máy bay',
    nameVi: 'Vé máy bay',
    nameKo: '항공권',
    type: 'variable_time' as FeeType,
    base_value: 5000000,
    currency: 'VND',
    time_unit: 'one_time' as TimeUnit,
    options: [
      {
        id: 'early-booking',
        label: 'Đặt sớm (trước 3 tháng)',
        value: 4500000,
        currency: 'VND',
        note: 'Giảm 10% khi đặt vé sớm'
      },
      {
        id: 'standard-booking',
        label: 'Đặt vé tiêu chuẩn',
        value: 5000000,
        currency: 'VND',
        note: 'Giá vé thông thường'
      },
      {
        id: 'last-minute',
        label: 'Đặt gấp (dưới 1 tháng)',
        value: 6000000,
        currency: 'VND',
        note: 'Phụ thu 20% khi đặt gấp'
      }
    ],
    default_selected: 'standard-booking',
    category: 'travel',
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  },

  // Bảo hiểm y tế (Health Insurance) - fixed but optional
  health_insurance: {
    id: 'health-insurance',
    name: 'Bảo hiểm y tế',
    nameVi: 'Bảo hiểm y tế',
    nameKo: '건강보험',
    type: 'optional' as FeeType,
    base_value: 2000000,
    currency: 'VND',
    time_unit: 'year' as TimeUnit,
    required: false,
    category: 'insurance',
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  },

  // Phí dịch vụ (Service Fee) - fixed and required
  service_fee: {
    id: 'service-fee',
    name: 'Phí dịch vụ',
    nameVi: 'Phí dịch vụ tư vấn',
    nameKo: '서비스 수수료',
    type: 'fixed' as FeeType,
    base_value: 1500000,
    currency: 'VND',
    time_unit: 'one_time' as TimeUnit,
    required: true,
    category: 'service',
    applies_to: ['D4-1', 'D2-1', 'D2-2', 'D2-3']
  }
};
