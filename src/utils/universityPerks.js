// University perks calculation utilities
import { VISA_SYSTEMS } from '../constants/visaSystems';

export const getMaxScholarship = (university) => {
  if (!university?.koreanData?.visaSystemsDetail) return 0;

  let maxScholarship = 0;
  Object.values(university.koreanData.visaSystemsDetail).forEach(visa => {
    if (visa?.scholarships && Array.isArray(visa.scholarships)) {
      visa.scholarships.forEach(scholarship => {
        if (scholarship?.discountPct && typeof scholarship.discountPct === 'number') {
          maxScholarship = Math.max(maxScholarship, scholarship.discountPct);
        }
      });
    }
  });

  return maxScholarship;
};

export const getMinGPA = (university) => {
  if (!university?.koreanData?.admission) return null;

  const gpas = Object.values(university.koreanData.admission)
    .map(a => parseFloat(a?.gpaMin))
    .filter(g => !isNaN(g) && isFinite(g) && g > 0);

  if (!gpas.length) return null;
  return Math.min(...gpas);
};

export const getCheapestKTX = (university) => {
  if (!university?.koreanData?.visaSystemsDetail) return null;

  let cheapestKTX = null;
  Object.values(university.koreanData.visaSystemsDetail).forEach(visa => {
    if (visa?.ktxOptions && Array.isArray(visa.ktxOptions)) {
      visa.ktxOptions.forEach(ktx => {
        const price = ktx?.priceKRWPerKy ?? 0;
        if (price > 0) {
          if (!cheapestKTX || price < cheapestKTX.priceKRWPerKy) {
            cheapestKTX = ktx;
          }
        }
      });
    }
  });

  return cheapestKTX;
};

export const getPerks = (university) => {
  if (!university) return [];
  const perks = [];

  // Scholarship perk
  const maxHB = getMaxScholarship(university);
  if (maxHB >= 100) perks.push({ type: 'hb', label: '🎓 HB 100%', style: 'p-hb' });
  else if (maxHB >= 50) perks.push({ type: 'hb', label: `🎓 HB ${maxHB}%`, style: 'p-hb' });

  // KTX perk
  const allKtx = Object.values(university.koreanData?.visaSystemsDetail ?? {})
    .flatMap(s => s?.ktxOptions ?? [])
    .map(k => k?.priceKRWPerKy ?? 0)
    .filter(p => p > 0);
  if (allKtx.length) {
    const min = Math.min(...allKtx);
    perks.push({ type: 'ktx', label: `🏠 KTX ${(min/1000).toFixed(0)}K`, style: 'p-ktx' });
  }

  // Part time job perk
  if (university?.koreanData?.jobOpportunities)
    perks.push({ type: 'vl', label: '💼 Việc làm', style: 'p-vl' });

  // Low GPA perk
  const minGpa = getMinGPA(university);
  if (minGpa !== null && minGpa <= 6.5)
    perks.push({ type: 'gpa', label: `📋 GPA ${minGpa}`, style: 'p-gpa' });

  // Top 3 warning
  if (university?.koreanData?.topTier === 'Top3')
    perks.push({ type: 'warn', label: '⚠ Visa hạn chế', style: 'p-warn' });

  return perks.slice(0, 4);
};

export const getLowestFee = (university) => {
  const rootVisaSystems = university?.visa_systems ?? {};
  if (rootVisaSystems && typeof rootVisaSystems === 'object') {
    let lowest = null;
    Object.entries(rootVisaSystems).forEach(([key, sys]) => {
      if (!sys?.available) return;
      const fee = Number(sys?.invoice_krw ?? 0);
      if (fee > 0 && (lowest === null || fee < lowest.amount)) {
        lowest = { amount: fee, visaSystem: key };
      }
    });
    if (lowest) return lowest;
  }

  if (!university?.koreanData?.visaSystemsDetail) return null;

  const entries = Object.entries(university.koreanData.visaSystemsDetail);
  const available = entries.filter(([_, sys]) => sys?.available === true);
  if (!available.length) return null;

  let lowest = null;
  available.forEach(([key, sys]) => {
    const fee = sys?.invoiceKRWPerYear ?? 0;
    if (fee > 0 && (lowest === null || fee < lowest.amount)) {
      lowest = { amount: fee, visaSystem: key };
    }
  });
  return lowest;
};

export const getBestScholarshipSystem = (university) => {
  if (!university?.koreanData?.visaSystemsDetail) return null;

  let bestSystem = null;
  let maxScholarship = 0;

  Object.entries(university.koreanData.visaSystemsDetail).forEach(([key, sys]) => {
    if (sys?.scholarships && Array.isArray(sys.scholarships)) {
      sys.scholarships.forEach(scholarship => {
        if ((scholarship?.discountPct || 0) > maxScholarship) {
          maxScholarship = scholarship.discountPct;
          bestSystem = key;
        }
      });
    }
  });

  return bestSystem ? { system: bestSystem, discount: maxScholarship } : null;
};

export const getBestTopikLevel = (university) => {
  if (!university?.koreanData?.visaSystemsDetail) return 'N/A';

  let bestTopik = 0;
  Object.values(university.koreanData.visaSystemsDetail).forEach(sys => {
    if (sys?.scholarships && Array.isArray(sys.scholarships)) {
      sys.scholarships.forEach(scholarship => {
        if (scholarship?.topikLevel && scholarship.topikLevel > bestTopik) {
          bestTopik = scholarship.topikLevel;
        }
      });
    }
  });

  return bestTopik > 0 ? bestTopik : 'N/A';
};

export const getVisaSystemLabel = (visaSystem) => {
  if (!visaSystem) return '';

  const visaLabels = VISA_SYSTEMS.reduce((acc, visa) => {
    acc[visa.key] = visa.name;
    return acc;
  }, {});
  // Legacy support
  visaLabels['D2-3'] = 'Sau dai hoc';

  return visaLabels[visaSystem] || visaSystem;
};

export const getScholarshipTierString = (university) => {
  if (!university?.koreanData?.visaSystemsDetail) return '';

  let best = { pct: 0, system: '', scholarships: [] };
  Object.entries(university.koreanData.visaSystemsDetail).forEach(([key, sys]) => {
    if (!sys?.scholarships || !Array.isArray(sys.scholarships)) return;
    const max = Math.max(...sys.scholarships.map(s => s?.discountPct ?? 0));
    if (max > best.pct) best = { pct: max, system: key, scholarships: sys.scholarships };
  });

  if (!best.scholarships.length) return '';
  const sorted = [...best.scholarships].sort((a, b) => a.topikLevel - b.topikLevel);
  const levels = sorted.map(s => s.topikLevel);
  const pcts = sorted.map(s => s.discountPct + '%');
  return `TOPIK ${levels[0]}→${levels[levels.length-1]}: ${pcts.join('/')}`;
};

