// Simple cost calculation utility for AdminDashboard
// This provides basic cost calculation without external dependencies

export interface SimpleCostCalculation {
  amount: number;
  currency: string;
  minAmount?: number;
  maxAmount?: number;
  systemsIncluded: string[];
}

export function calculateSimpleUniversityCost(university: any): SimpleCostCalculation {
  // Calculate total from legacy fields
  const generalTuition = university.generalTuition || 0;
  const visaFee = university.visaFee || 0;
  const accommodationFee = university.accommodationFee || 0;
  const insuranceFee = university.insuranceFee || 0;
  
  // Calculate additional fees
  let additionalFeesTotal = 0;
  if (university.additionalFees && Array.isArray(university.additionalFees)) {
    additionalFeesTotal = university.additionalFees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);
  }
  
  // Calculate systems-based costs if available
  let systemsTotal = 0;
  let systemsIncluded: string[] = [];
  
  if (university.systems && Array.isArray(university.systems)) {
    const availableSystems = university.systems.filter((system: any) => system.available);
    systemsIncluded = availableSystems.map((system: any) => system.code);
    
    availableSystems.forEach((system: any) => {
      if (system.fees && Array.isArray(system.fees)) {
        system.fees.forEach((fee: any) => {
          let feeAmount = 0;
          
          switch (fee.type) {
            case 'fixed':
              feeAmount = fee.base_value || 0;
              break;
            case 'optional':
              if (fee.required || fee.default_selected) {
                feeAmount = fee.base_value || 0;
              }
              break;
            case 'optional_multiple':
            case 'variable_time':
              const defaultOption = fee.options?.find((opt: any) => opt.id === fee.default_selected) || fee.options?.[0];
              if (defaultOption) {
                feeAmount = defaultOption.value || 0;
              }
              break;
            case 'percentage':
              const defaultCondition = fee.conditions?.[0];
              if (defaultCondition) {
                feeAmount = -((fee.base_value || 0) * (defaultCondition.percentage || 0)) / 100;
              }
              break;
          }
          
          systemsTotal += feeAmount;
        });
      }
    });
  }
  
  // Use systems-based calculation if available, otherwise use legacy
  const totalAmount = systemsTotal > 0 ? systemsTotal : (generalTuition + visaFee + accommodationFee + insuranceFee + additionalFeesTotal);
  
  return {
    amount: totalAmount,
    currency: 'VND',
    systemsIncluded
  };
}

export function generateSimpleCostTooltip(cost: SimpleCostCalculation): string {
  let tooltip = `Estimated Total Cost: ${cost.amount.toLocaleString()} VND\n\n`;
  
  if (cost.systemsIncluded.length > 0) {
    tooltip += `Systems: ${cost.systemsIncluded.join(', ')}\n`;
  }
  
  tooltip += `Currency: ${cost.currency}`;
  
  return tooltip;
}
