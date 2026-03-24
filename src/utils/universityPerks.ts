/**
 * Utility functions for extracting perk data from university information
 * Used for displaying highlights and filtering options
 */

import type { University } from '../types/university';
import { VISA_SYSTEMS } from '../constants/visaSystems';

/**
 * Get the maximum scholarship percentage available at the university
 */
export const getMaxScholarship = (university: University): number => {
  if (!university.koreanData?.visaSystemsDetail) return 0;

  let maxScholarship = 0;
  Object.values(university.koreanData.visaSystemsDetail).forEach(detail => {
    if (detail.scholarships && detail.scholarships.length > 0) {
      const maxForThisSystem = Math.max(...detail.scholarships.map(s => s.discountPct));
      maxScholarship = Math.max(maxScholarship, maxForThisSystem);
    }
  });

  return maxScholarship;
};

/**
 * Get minimum GPA requirement across all visa systems
 */
export const getMinGPA = (university: University): number => {
  if (!university.koreanData?.admission) return 9;

  let minGPA = 9;
  Object.values(university.koreanData.admission).forEach(req => {
    if (req.gpaMin) {
      minGPA = Math.min(minGPA, req.gpaMin);
    }
  });

  return minGPA === 9 ? 6.5 : minGPA;
};

/**
 * Get cheapest KTX (dormitory) option in KRW
 */
export const getCheapestKTX = (university: University): number | null => {
  if (!university.koreanData?.visaSystemsDetail) return null;

  let cheapestKTX: number | null = null;
  Object.values(university.koreanData.visaSystemsDetail).forEach(detail => {
    if (detail.ktxOptions && detail.ktxOptions.length > 0) {
      const cheapestForThisSystem = Math.min(...detail.ktxOptions.map(k => k.priceKRWPerKy));
      if (cheapestKTX === null || cheapestForThisSystem < cheapestKTX) {
        cheapestKTX = cheapestForThisSystem;
      }
    }
  });

  return cheapestKTX;
};

/**
 * Get all available perks for a university
 * Returns array of perk objects with type and label
 */
export const getPerks = (uni: University): Array<{ type: string; label: string }> => {
  const perks: Array<{ type: string; label: string }> = [];

  const maxScholarship = getMaxScholarship(uni);
  if (maxScholarship === 100) {
    perks.push({ type: 'hb', label: '🎓 HB 100%' });
  } else if (maxScholarship >= 50) {
    perks.push({ type: 'hb', label: `🎓 HB ${maxScholarship}%` });
  }

  const ktxPrice = getCheapestKTX(uni);
  if (ktxPrice !== null) {
    perks.push({ type: 'ktx', label: `🏠 KTX ${(ktxPrice / 1000).toFixed(0)}K` });
  }

  if (uni.koreanData?.jobOpportunities || uni.koreanData?.workOpportunity) {
    perks.push({ type: 'vl', label: '💼 Việc làm' });
  }

  const minGPA = getMinGPA(uni);
  if (minGPA <= 6.5) {
    perks.push({ type: 'gpa', label: `📋 GPA ≤ ${minGPA}` });
  }

  if (uni.koreanData?.topTier === 'Top3') {
    perks.push({ type: 'warn', label: '⚠ Visa hạn chế' });
  }

  const majorList = (uni.koreanData?.majors && uni.koreanData.majors.length > 0)
    ? uni.koreanData.majors
    : (uni.majors && uni.majors.length > 0 ? uni.majors : []);
  if (majorList.length > 0) {
    perks.push({ type: 'spec', label: majorList[0] });
  }

  return perks.slice(0, 4);
};

/**
 * Get lowest tuition invoice across all visa systems
 */
export const getLowestTuition = (university: University): { amount: number; visaSystem: string } | null => {
  if (!university.koreanData?.visaSystemsDetail) return null;

  let lowestTuition = Infinity;
  let lowestVisaSystem = '';

  Object.entries(university.koreanData.visaSystemsDetail).forEach(([visaCode, detail]) => {
    if (detail.available && detail.invoiceKRWPerYear < lowestTuition) {
      lowestTuition = detail.invoiceKRWPerYear;
      lowestVisaSystem = visaCode;
    }
  });

  return lowestTuition === Infinity ? null : { amount: lowestTuition, visaSystem: lowestVisaSystem };
};

/**
 * Get lowest fee across all visa systems
 */
export const getLowestFee = (university: University): { amount: number; visaSystem: string } | null => {
  const rootVisaSystems = (university as any)?.visa_systems ?? {};
  if (rootVisaSystems && typeof rootVisaSystems === 'object') {
    let lowestFee: number | null = null;
    let lowestVisaSystem = '';

    Object.entries(rootVisaSystems).forEach(([visaCode, detail]) => {
      if (!(detail as any)?.available) return;
      const fee = Number((detail as any)?.invoice_krw ?? 0);
      if (fee > 0 && (lowestFee === null || fee < lowestFee)) {
        lowestFee = fee;
        lowestVisaSystem = visaCode;
      }
    });

    if (lowestFee !== null) {
      return { amount: lowestFee, visaSystem: lowestVisaSystem };
    }
  }

  if (university.koreanData?.visaSystemsDetail) {
    let lowestFee = Infinity;
    let lowestVisaSystem = '';

    Object.entries(university.koreanData.visaSystemsDetail).forEach(([visaCode, detail]) => {
      if (detail.available && detail.invoiceKRWPerYear > 0 && detail.invoiceKRWPerYear < lowestFee) {
        lowestFee = detail.invoiceKRWPerYear;
        lowestVisaSystem = visaCode;
      }
    });

    return lowestFee === Infinity ? null : { amount: lowestFee, visaSystem: lowestVisaSystem };
  }

  if (university.koreanData?.visaSystems && university.koreanData.visaSystems.length > 0) {
    let lowestFee = Infinity;
    let lowestVisaSystem = '';

    university.koreanData.visaSystems.forEach((system: any) => {
      const fee = system.baseYearlyFee ?? system.tuitionRange?.min ?? 0;
      if (fee > 0 && fee < lowestFee) {
        lowestFee = fee;
        lowestVisaSystem = system.visaType ?? system.code ?? '';
      }
    });

    return lowestFee === Infinity ? null : { amount: lowestFee, visaSystem: lowestVisaSystem };
  }

  return null;
};

/**
 * Get best scholarship system
 */
export const getBestScholarshipSystem = (university: University): { system: string; discount: number } | null => {
  if (!university.koreanData?.visaSystemsDetail) return null;

  let bestDiscount = 0;
  let bestSystem = '';

  Object.entries(university.koreanData.visaSystemsDetail).forEach(([visaCode, detail]) => {
    if (detail.scholarships && detail.scholarships.length > 0) {
      const maxForThisSystem = Math.max(...detail.scholarships.map(s => s.discountPct));
      if (maxForThisSystem > bestDiscount) {
        bestDiscount = maxForThisSystem;
        bestSystem = visaCode;
      }
    }
  });

  return bestDiscount === 0 ? null : { system: bestSystem, discount: bestDiscount };
};

/**
 * Get best TOPIK level requirement
 */
export const getBestTopikLevel = (university: University): string | null => {
  if (!university.koreanData?.admission) return null;

  let bestLevel = '6.0';
  Object.values(university.koreanData.admission).forEach(req => {
    if (req.gpaMin && req.gpaMin < parseFloat(bestLevel)) {
      bestLevel = req.gpaMin.toString();
    }
  });

  return bestLevel;
};

/**
 * Get visa system label from code (e.g., "D4-1" -> "Hệ tiếng")
 */
export const getVisaSystemLabel = (code: string): string => {
  const labels = VISA_SYSTEMS.reduce<Record<string, string>>((acc, visa) => {
    acc[visa.key] = visa.name;
    return acc;
  }, {});
  // Legacy support
  labels['D2-3'] = 'Sau dai hoc';
  return labels[code] || code;
};

/**
 * Get scholarship tier string
 */
export const getScholarshipTierString = (university: University): string => {
  const maxScholarship = getMaxScholarship(university);
  if (maxScholarship === 100) return '100%';
  if (maxScholarship >= 70) return '70%+';
  if (maxScholarship >= 50) return '50%+';
  if (maxScholarship >= 30) return '30%+';
  return `${maxScholarship}%`;
};
