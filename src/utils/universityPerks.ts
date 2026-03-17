/**
 * Utility functions for extracting perk data from university information
 * Used for displaying highlights and filtering options
 */

import type { University } from '../types/university';

/**
 * Get the maximum scholarship percentage available at the university
 */
export const getMaxScholarship = (university: University): number => {
  if (!university.koreanData?.visaSystemsDetail) return 0;

  let maxScholarship = 0;
  Object.values(university.koreanData.visaSystemsDetail).forEach(detail => {
    if (detail.scholarships) {
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

  // Check for 100% scholarship
  const maxScholarship = getMaxScholarship(uni);
  if (maxScholarship === 100) {
    perks.push({ type: 'hb', label: '🎓 HB 100%' });
  } else if (maxScholarship >= 50) {
    perks.push({ type: 'hb', label: `🎓 HB ${maxScholarship}%` });
  }

  // Check for cheap KTX
  const ktxPrice = getCheapestKTX(uni);
  if (ktxPrice !== null) {
    perks.push({ type: 'ktx', label: `🏠 KTX ${(ktxPrice / 1000).toFixed(0)}K` });
  }

  // Check for part-time work info
  if (uni.koreanData?.jobOpportunities || uni.koreanData?.workOpportunity) {
    perks.push({ type: 'vl', label: '💼 Việc làm thêm' });
  }

  // Check for low GPA requirement
  const minGPA = getMinGPA(uni);
  if (minGPA <= 6.5) {
    perks.push({ type: 'gpa', label: `📋 GPA chỉ ${minGPA}` });
  }

  // Add visa restriction warning for Top 3
  if (uni.koreanData?.topTier === 'Top3') {
    perks.push({ type: 'warn', label: '⚠ Visa hạn chế' });
  }

  // Add first major/specialty if available
  if (uni.koreanData?.majors && uni.koreanData.majors.length > 0) {
    const specialty = uni.koreanData.majors[0];
    perks.push({ type: 'spec', label: specialty });
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
 * Get visa system label from code (e.g., "D4-1" -> "Korean Language")
 */
export const getVisaSystemLabel = (code: string): string => {
  const labels: Record<string, string> = {
    'D4-1': 'Hệ tiếng',
    'D4-2': 'Dự bị',
    'D2-1': 'Dự bị ĐH',
    'D2-2': 'Đại học',
    'D2-3': 'Thạc sĩ',
    'D2-4': 'Tiến sĩ',
    'D2-5': 'Nghiên cứu',
    'D2-6': 'Trao đổi',
    'D2-7': 'Ngắn hạn'
  };
  return labels[code] || code;
};
