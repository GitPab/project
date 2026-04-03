// AI Recommendation Engine for SACMA
// Uses scoring algorithms to match students with optimal universities

import { University } from '../../types';
import { CountryConfig, SUPPORTED_COUNTRIES, validateRequirements } from '../../constants/countries';

export interface StudentProfile {
  academicInfo: {
    gpa: number;
    topikLevel?: number;
    ielts?: number;
    toefl?: number;
    major: string;
    degreeLevel: 'bachelor' | 'master' | 'phd' | 'language';
  };
  preferences: {
    budget: {
      min: number;
      max: number;
      currency: string;
    };
    countries: string[];
    cities: string[];
    universityTier: 'Top1' | 'Top2' | 'Top3' | 'any';
    campusPreference: 'urban' | 'suburban' | 'any';
    scholarshipNeed: boolean;
    partTimeWork: boolean;
  };
  constraints: {
    visaHistory?: 'first-time' | 'renewal' | 'rejected-before';
    languagePreference?: 'english' | 'korean' | 'japanese' | 'chinese';
    startDate: 'spring' | 'fall' | 'any';
    duration: number;
  };
}

export interface RecommendationResult {
  university: University;
  matchScore: number;
  breakdown: {
    academic: number;
    financial: number;
    preference: number;
    probability: number;
  };
  reasons: string[];
  warnings: string[];
  suggestedActions: string[];
  scholarshipEligibility: {
    eligible: boolean;
    estimatedAmount: number;
    programs: string[];
  };
  countryInfo: CountryConfig;
}

interface ScoringWeights {
  academic: number;
  financial: number;
  preference: number;
  location: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  academic: 0.35,
  financial: 0.30,
  preference: 0.20,
  location: 0.15
};

export function getRecommendations(
  profile: StudentProfile,
  universities: University[],
  limit: number = 10
): RecommendationResult[] {
  const results: RecommendationResult[] = [];

  for (const university of universities) {
    const result = calculateMatchScore(profile, university);
    if (result.matchScore > 30) {
      results.push(result);
    }
  }

  return results
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

function calculateMatchScore(profile: StudentProfile, university: University): RecommendationResult {
  const weights = DEFAULT_WEIGHTS;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const suggestedActions: string[] = [];

  const country = SUPPORTED_COUNTRIES.find((c: CountryConfig) => 
    university.country?.includes(c.name) || university.koreanData?.isKoreanUniversity
  ) || SUPPORTED_COUNTRIES[0];

  // Academic Score (0-100)
  let academicScore = 50;
  
  if (profile.academicInfo.gpa >= 3.5) {
    academicScore += 20;
    reasons.push('GPA xuat sac (3.5+)');
  } else if (profile.academicInfo.gpa >= 3.0) {
    academicScore += 15;
    reasons.push('GPA tot (3.0+)');
  } else if (profile.academicInfo.gpa >= 2.5) {
    academicScore += 10;
  } else {
    warnings.push('GPA thap co the anh huong den hoc bong');
    suggestedActions.push('Can cai thien GPA truoc khi nop don');
  }

  if (country.code === 'KR' && profile.academicInfo.topikLevel) {
    if (profile.academicInfo.topikLevel >= 5) {
      academicScore += 25;
      reasons.push(`TOPIK ${profile.academicInfo.topikLevel} - Du dieu kien giam 40-50% hoc phi`);
    } else if (profile.academicInfo.topikLevel >= 3) {
      academicScore += 15;
      reasons.push(`TOPIK ${profile.academicInfo.topikLevel} - Du dieu kien nhap hoc`);
    } else if (profile.academicInfo.topikLevel < 2) {
      warnings.push('Can co TOPIK 2 de nhap hoc');
      suggestedActions.push('Dang ky hoc tieng Han tai TBT truoc khi du hoc');
    }
  }

  academicScore = Math.min(100, academicScore);

  // Financial Score (0-100)
  let financialScore = 50;
  
  const avgTuition = 15000;
  const yearlyCost = avgTuition + (country.avgLivingCost.accommodation * 12);
  const budgetMaxUSD = profile.preferences.budget.max / 
    (country.currency === 'KRW' ? 18500 : country.currency === 'JPY' ? 170 : 1);

  if (budgetMaxUSD >= yearlyCost * 1.5) {
    financialScore += 30;
    reasons.push('Du tai chinh thoai mai');
  } else if (budgetMaxUSD >= yearlyCost) {
    financialScore += 20;
    reasons.push('Du tai chinh cho chi phi co ban');
  } else if (budgetMaxUSD >= yearlyCost * 0.7) {
    financialScore += 10;
    warnings.push('Can hoc bong hoac lam them de bu dap chi phi');
    suggestedActions.push('Ung tuyen hoc bong TOPIK hoac Government Scholarship');
  } else {
    financialScore -= 20;
    warnings.push('Tai chinh han che, can ke hoach chi tiet');
    suggestedActions.push('Can tim them nguon tai tro hoac chon truong co hoc phi thap hon');
  }

  financialScore = Math.min(100, Math.max(0, financialScore));

  // Preference Score (0-100)
  let preferenceScore = 50;

  if (profile.preferences.countries.includes(country.code)) {
    preferenceScore += 20;
    reasons.push(`${country.nameVi} nam trong danh sach ua thich`);
  }

  if (profile.preferences.cities.some(city => 
    university.region?.toLowerCase().includes(city.toLowerCase()) ||
    country.popularCities.some((pc: string) => pc.toLowerCase().includes(city.toLowerCase()))
  )) {
    preferenceScore += 15;
    reasons.push('Khu vuc phu hop voi so thich');
  }

  if (profile.preferences.universityTier !== 'any') {
    const uniTier = university.top_tier || university.koreanData?.topTier;
    if (uniTier === profile.preferences.universityTier) {
      preferenceScore += 15;
      reasons.push(`Hang ${uniTier} dung nhu mong muon`);
    }
  }

  if (profile.preferences.scholarshipNeed && profile.academicInfo.topikLevel && profile.academicInfo.topikLevel >= 5) {
    preferenceScore += 10;
    reasons.push('Co co hoi nhan hoc bong cao');
  }

  preferenceScore = Math.min(100, preferenceScore);

  // Calculate final score
  const matchScore = Math.round(
    academicScore * weights.academic +
    financialScore * weights.financial +
    preferenceScore * weights.preference +
    70 * weights.location // Location score simplified
  );

  // Scholarship eligibility
  const scholarshipEligible = profile.academicInfo.topikLevel ? profile.academicInfo.topikLevel >= 5 : profile.academicInfo.gpa >= 3.5;
  
  return {
    university,
    matchScore,
    breakdown: {
      academic: academicScore,
      financial: financialScore,
      preference: preferenceScore,
      probability: Math.round(matchScore * 0.9)
    },
    reasons,
    warnings,
    suggestedActions,
    scholarshipEligibility: {
      eligible: scholarshipEligible,
      estimatedAmount: scholarshipEligible ? 500000000 : 0, // 500M VND for full scholarship
      programs: country.scholarships.university.slice(0, 2)
    },
    countryInfo: country
  };
}

export function quickMatch(
  gpa: number,
  topikLevel: number | undefined,
  budgetVND: number,
  targetCountry: string = 'KR'
): { tier: string; confidence: string; advice: string } {
  if (gpa >= 3.5 && (topikLevel && topikLevel >= 5)) {
    return {
      tier: 'Top1',
      confidence: 'Cao',
      advice: 'Ban co the ung tuyen cac truong Top 1 voi hoc bong 40-50%'
    };
  } else if (gpa >= 3.0 && (topikLevel && topikLevel >= 3)) {
    return {
      tier: 'Top2',
      confidence: 'Trung binh-cao',
      advice: 'Top 2 la lua chon phu hop, can co gang TOPIK 5 de nhan hoc bong'
    };
  } else if (gpa >= 2.5 || (topikLevel && topikLevel >= 2)) {
    return {
      tier: 'Top3',
      confidence: 'Trung binh',
      advice: 'Top 3 la khoi dau tot, sau do co the chuyen tiep len Top 2'
    };
  }
  
  return {
    tier: 'Top3',
    confidence: 'Thap',
    advice: 'Can cai thien GPA hoac TOPIK de tang co hoi trung tuyen va hoc bong'
  };
}
