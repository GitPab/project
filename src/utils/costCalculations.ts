import type { University, UniversitySystem } from '../types/university';
import type { FlexibleFee } from '../types/fees';

export interface CostBreakdown {
  fixedCosts: number;
  optionalCosts: number;
  totalCosts: number;
  currency: string;
  breakdown: {
    category: string;
    amount: number;
    type: 'fixed' | 'optional';
    items: Array<{
      name: string;
      amount: number;
      currency: string;
      note?: string;
    }>;
  }[];
}

export interface EstimatedTotalCost {
  amount: number;
  currency: string;
  breakdown: CostBreakdown;
  minAmount?: number;
  maxAmount?: number;
  averageAmount?: number;
  systemsIncluded: string[];
}

/**
 * Calculate total cost for a single university system
 */
export function calculateSystemCost(system: UniversitySystem): CostBreakdown {
  let fixedCosts = 0;
  let optionalCosts = 0;
  const breakdown: CostBreakdown['breakdown'] = [];

  // Group fees by category
  const feesByCategory = system.fees.reduce((acc, fee) => {
    const category = fee.category || 'other';
    if (!acc[category]) {
      acc[category] = {
        category,
        amount: 0,
        type: fee.type === 'fixed' ? 'fixed' : 'optional',
        items: []
      };
    }
    return acc;
  }, {} as Record<string, CostBreakdown['breakdown'][0]>);

  // Calculate costs for each fee
  system.fees.forEach(fee => {
    let feeAmount = 0;
    const category = fee.category || 'other';

    switch (fee.type) {
      case 'fixed':
        feeAmount = fee.base_value;
        fixedCosts += feeAmount;
        break;

      case 'optional':
        // Include default optional fees in calculation
        if (fee.required || fee.default_selected) {
          feeAmount = fee.base_value;
          optionalCosts += feeAmount;
        }
        break;

      case 'optional_multiple':
      case 'variable_time': {
        // Use default option or first option if available
        const defaultOption = fee.options?.find(opt => opt.id === fee.default_selected) || fee.options?.[0];
        if (defaultOption) {
          feeAmount = defaultOption.value;
          optionalCosts += feeAmount;
        }
        break;
      }

      case 'percentage': {
        // Calculate discount (negative value for display)
        const defaultCondition = fee.conditions?.[0];
        if (defaultCondition) {
          feeAmount = -(fee.base_value * defaultCondition.percentage) / 100;
          optionalCosts += feeAmount; // This will be negative (discount)
        }
        break;
      }
    }

    // Apply time-based calculations
    if (fee.time_unit && fee.type !== 'percentage') {
      const defaultTime = fee.time_unit === 'month' ? 6 : fee.time_unit === 'year' ? 1 : fee.time_unit === 'semester' ? 1 : 1;
      feeAmount = feeAmount * defaultTime;
    }

    // Add to category breakdown
    if (feesByCategory[category]) {
      feesByCategory[category].amount += feeAmount;
      feesByCategory[category].items.push({
        name: fee.name,
        amount: feeAmount,
        currency: fee.currency || 'VND',
        note: fee.note
      });
    }
  });

  // Convert to array and sort by amount
  breakdown.push(...Object.values(feesByCategory).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)));

  const totalCosts = fixedCosts + optionalCosts;

  return {
    fixedCosts,
    optionalCosts,
    totalCosts,
    currency: 'VND', // Default to VND, can be converted later
    breakdown
  };
}

/**
 * Calculate estimated total cost for a university with multiple systems
 */
export function calculateUniversityEstimatedCost(university: University): EstimatedTotalCost {
  if (!university.systems || university.systems.length === 0) {
    // Fallback to legacy cost structure if no systems
    return calculateLegacyUniversityCost(university);
  }

  const availableSystems = university.systems.filter(system => system.available);
  
  if (availableSystems.length === 0) {
    return {
      amount: 0,
      currency: 'VND',
      breakdown: {
        fixedCosts: 0,
        optionalCosts: 0,
        totalCosts: 0,
        currency: 'VND',
        breakdown: []
      },
      systemsIncluded: []
    };
  }

  // Calculate costs for each available system
  const systemCosts = availableSystems.map(system => calculateSystemCost(system));
  
  // Calculate min, max, and average
  const amounts = systemCosts.map(cost => cost.totalCosts);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

  // Use the most common system for detailed breakdown
  const mostCommonSystem = availableSystems[0]; // Could be enhanced to find most popular
  const breakdown = calculateSystemCost(mostCommonSystem);

  return {
    amount: averageAmount,
    currency: breakdown.currency,
    breakdown,
    minAmount,
    maxAmount,
    averageAmount,
    systemsIncluded: availableSystems.map(s => s.code)
  };
}

/**
 * Fallback calculation for legacy university structure
 */
function calculateLegacyUniversityCost(university: University): EstimatedTotalCost {
  let fixedCosts = 0;
  let optionalCosts = 0;
  const breakdown: CostBreakdown['breakdown'] = [];

  // Legacy fixed costs
  if (university.generalTuition) {
    fixedCosts += university.generalTuition;
    breakdown.push({
      category: 'tuition',
      amount: university.generalTuition,
      type: 'fixed',
      items: [{
        name: 'Học phí',
        amount: university.generalTuition,
        currency: 'VND'
      }]
    });
  }

  if (university.visaFee) {
    fixedCosts += university.visaFee;
    breakdown.push({
      category: 'visa',
      amount: university.visaFee,
      type: 'fixed',
      items: [{
        name: 'Phí visa',
        amount: university.visaFee,
        currency: 'VND'
      }]
    });
  }

  if (university.accommodationFee) {
    optionalCosts += university.accommodationFee;
    breakdown.push({
      category: 'accommodation',
      amount: university.accommodationFee,
      type: 'optional',
      items: [{
        name: 'Chi phí ở',
        amount: university.accommodationFee,
        currency: 'VND'
      }]
    });
  }

  if (university.insuranceFee) {
    optionalCosts += university.insuranceFee;
    breakdown.push({
      category: 'insurance',
      amount: university.insuranceFee,
      type: 'optional',
      items: [{
        name: 'Bảo hiểm',
        amount: university.insuranceFee,
        currency: 'VND'
      }]
    });
  }

  // Legacy additional fees
  if (university.additionalFees) {
    university.additionalFees.forEach(fee => {
      if (fee.selected) {
        optionalCosts += fee.amount;
        breakdown.push({
          category: 'additional',
          amount: fee.amount,
          type: 'optional',
          items: [{
            name: fee.type,
            amount: fee.amount,
            currency: 'VND'
          }]
        });
      }
    });
  }

  const totalCosts = fixedCosts + optionalCosts;

  return {
    amount: totalCosts,
    currency: 'VND',
    breakdown: {
      fixedCosts,
      optionalCosts,
      totalCosts,
      currency: 'VND',
      breakdown
    },
    systemsIncluded: []
  };
}

/**
 * Format cost for display with currency conversion
 */
export function formatCostDisplay(cost: EstimatedTotalCost, targetCurrency: string = 'VND'): {
  amount: string;
  minAmount?: string;
  maxAmount?: string;
  currency: string;
  hasRange: boolean;
} {
  // Simple conversion rates (in real app, use API)
  const conversionRates: Record<string, number> = {
    VND: 1,
    USD: 0.00004,
    KRW: 0.053,
    JPY: 0.0061,
    CNY: 0.00029
  };

  const rate = conversionRates[targetCurrency] || 1;
  
  const formatCurrency = (amount: number, currency: string) => {
    const converted = Math.round(amount * rate);
    
    switch (currency) {
      case 'VND':
        return `${converted.toLocaleString('vi-VN')} ₫`;
      case 'USD':
        return `$${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'KRW':
        return `${converted.toLocaleString('ko-KR')} ₩`;
      case 'JPY':
        return `¥${converted.toLocaleString('ja-JP')}`;
      case 'CNY':
        return `¥${converted.toLocaleString('zh-CN')}`;
      default:
        return `${converted.toLocaleString()} ${currency}`;
    }
  };

  const hasRange = cost.minAmount !== undefined && cost.maxAmount !== undefined && cost.minAmount !== cost.maxAmount;

  return {
    amount: formatCurrency(cost.amount, targetCurrency),
    minAmount: cost.minAmount !== undefined ? formatCurrency(cost.minAmount, targetCurrency) : undefined,
    maxAmount: cost.maxAmount !== undefined ? formatCurrency(cost.maxAmount, targetCurrency) : undefined,
    currency: targetCurrency,
    hasRange
  };
}

/**
 * Generate tooltip content for cost breakdown
 */
export function generateCostTooltip(cost: EstimatedTotalCost, language: 'vi' | 'ko' | 'en' = 'vi'): string {
  const labels = {
    vi: {
      fixed: 'Phí cố định',
      optional: 'Phí tùy chọn',
      total: 'Tổng cộng',
      systems: 'Hệ thống',
      range: 'Phạm vi',
      average: 'Trung bình'
    },
    ko: {
      fixed: '고정 수수료',
      optional: '선택적 수수료',
      total: '총계',
      systems: '시스템',
      range: '범위',
      average: '평균'
    },
    en: {
      fixed: 'Fixed Fees',
      optional: 'Optional Fees',
      total: 'Total',
      systems: 'Systems',
      range: 'Range',
      average: 'Average'
    }
  };

  const t = labels[language];

  let tooltip = `${t.total}: ${formatCostDisplay(cost, 'VND').amount}\n\n`;
  
  // Add breakdown by category
  cost.breakdown.breakdown.forEach(category => {
    const categoryLabel = category.type === 'fixed' ? t.fixed : t.optional;
    tooltip += `${categoryLabel} - ${category.category}:\n`;
    category.items.forEach(item => {
      tooltip += `  • ${item.name}: ${formatCostDisplay({ amount: item.amount, currency: item.currency, breakdown: cost.breakdown, systemsIncluded: [] }, 'VND').amount}\n`;
    });
  });

  // Add range information if available
  const hasRange = cost.minAmount !== undefined && cost.maxAmount !== undefined && cost.minAmount !== cost.maxAmount;
  if (hasRange) {
    tooltip += `\n${t.range}: ${formatCostDisplay({ amount: cost.minAmount!, currency: cost.currency, breakdown: cost.breakdown, systemsIncluded: [] }, 'VND').amount} - ${formatCostDisplay({ amount: cost.maxAmount!, currency: cost.currency, breakdown: cost.breakdown, systemsIncluded: [] }, 'VND').amount}\n`;
    tooltip += `${t.average}: ${formatCostDisplay(cost, 'VND').amount}\n`;
  }

  // Add systems information
  if (cost.systemsIncluded.length > 0) {
    tooltip += `\n${t.systems}: ${cost.systemsIncluded.join(', ')}`;
  }

  return tooltip;
}
