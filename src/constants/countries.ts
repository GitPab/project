// Multi-country support constants for SACMA expansion

export interface CountryConfig {
  code: string;
  name: string;
  nameVi: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  exchangeRateToVND: number; // 1 unit of currency = X VND
  popularCities: string[];
  visaTypes: string[];
  requirements: {
    minGPA: number;
    minIELTS: number;
    minTOEFL: number;
    financialProof: number; // in USD
  };
  scholarships: {
    government: string[];
    university: string[];
  };
  avgLivingCost: {
    accommodation: number; // monthly in USD
    food: number;
    transport: number;
    other: number;
  };
}

export const SUPPORTED_COUNTRIES: CountryConfig[] = [
  {
    code: 'KR',
    name: 'South Korea',
    nameVi: 'Hàn Quốc',
    flag: '🇰🇷',
    currency: 'KRW',
    currencySymbol: '₩',
    exchangeRateToVND: 18.5, // 1 KRW = 18.5 VND (approximate)
    popularCities: ['Seoul', 'Busan', 'Daegu', 'Incheon', 'Daejeon'],
    visaTypes: ['D2-1', 'D2-2', 'D2-3', 'D2-6', 'D4-1'],
    requirements: {
      minGPA: 2.5,
      minIELTS: 5.5,
      minTOEFL: 70,
      financialProof: 20000
    },
    scholarships: {
      government: ['GKS', 'Korean Government Scholarship'],
      university: ['TOPIK 5-6: 40-50%', 'KNU President Scholarship']
    },
    avgLivingCost: {
      accommodation: 400,
      food: 300,
      transport: 50,
      other: 150
    }
  },
  {
    code: 'JP',
    name: 'Japan',
    nameVi: 'Nhật Bản',
    flag: '🇯🇵',
    currency: 'JPY',
    currencySymbol: '¥',
    exchangeRateToVND: 170, // 1 JPY = 170 VND (approximate)
    popularCities: ['Tokyo', 'Osaka', 'Kyoto', 'Fukuoka', 'Sapporo'],
    visaTypes: ['Student Visa', 'Research Visa', 'College Student'],
    requirements: {
      minGPA: 3.0,
      minIELTS: 6.0,
      minTOEFL: 80,
      financialProof: 25000
    },
    scholarships: {
      government: ['MEXT', 'JASSO'],
      university: ['University of Tokyo Scholarship', 'Kyoto University Scholarship']
    },
    avgLivingCost: {
      accommodation: 600,
      food: 400,
      transport: 100,
      other: 200
    }
  },
  {
    code: 'TW',
    name: 'Taiwan',
    nameVi: 'Đài Loan',
    flag: '🇹🇼',
    currency: 'TWD',
    currencySymbol: 'NT$',
    exchangeRateToVND: 780, // 1 TWD = 780 VND (approximate)
    popularCities: ['Taipei', 'Taichung', 'Kaohsiung', 'Tainan', 'Hsinchu'],
    visaTypes: ['Student Resident Visa', 'Visitor Visa'],
    requirements: {
      minGPA: 2.8,
      minIELTS: 5.5,
      minTOEFL: 72,
      financialProof: 15000
    },
    scholarships: {
      government: ['Taiwan Scholarship', 'Huayu Enrichment Scholarship'],
      university: ['NTU Scholarship', 'NTHU Scholarship']
    },
    avgLivingCost: {
      accommodation: 350,
      food: 250,
      transport: 40,
      other: 100
    }
  },
  {
    code: 'SG',
    name: 'Singapore',
    nameVi: 'Singapore',
    flag: '🇸🇬',
    currency: 'SGD',
    currencySymbol: 'S$',
    exchangeRateToVND: 18500, // 1 SGD = 18500 VND (approximate)
    popularCities: ['Singapore'],
    visaTypes: ['Student Pass', 'Student Visa'],
    requirements: {
      minGPA: 3.2,
      minIELTS: 6.5,
      minTOEFL: 90,
      financialProof: 30000
    },
    scholarships: {
      government: ['Singapore Government Scholarship', 'ASEAN Scholarship'],
      university: ['NUS Scholarship', 'NTU Scholarship', 'SMU Scholarship']
    },
    avgLivingCost: {
      accommodation: 800,
      food: 400,
      transport: 100,
      other: 300
    }
  },
  {
    code: 'AU',
    name: 'Australia',
    nameVi: 'Úc',
    flag: '🇦🇺',
    currency: 'AUD',
    currencySymbol: 'A$',
    exchangeRateToVND: 16500, // 1 AUD = 16500 VND (approximate)
    popularCities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    visaTypes: ['Student Visa (Subclass 500)'],
    requirements: {
      minGPA: 2.8,
      minIELTS: 6.0,
      minTOEFL: 80,
      financialProof: 35000
    },
    scholarships: {
      government: ['Australia Awards', 'Destination Australia'],
      university: ['Melbourne Scholarship', 'ANU Scholarship']
    },
    avgLivingCost: {
      accommodation: 900,
      food: 500,
      transport: 150,
      other: 350
    }
  },
  {
    code: 'UK',
    name: 'United Kingdom',
    nameVi: 'Anh Quốc',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    exchangeRateToVND: 31000, // 1 GBP = 31000 VND (approximate)
    popularCities: ['London', 'Manchester', 'Edinburgh', 'Birmingham', 'Glasgow'],
    visaTypes: ['Student Route (formerly Tier 4)'],
    requirements: {
      minGPA: 3.0,
      minIELTS: 6.5,
      minTOEFL: 90,
      financialProof: 40000
    },
    scholarships: {
      government: ['Chevening', 'Commonwealth Scholarship'],
      university: ['Cambridge Scholarship', 'Oxford Scholarship']
    },
    avgLivingCost: {
      accommodation: 1000,
      food: 500,
      transport: 200,
      other: 400
    }
  }
];

// Helper functions
export const getCountryByCode = (code: string): CountryConfig | undefined => {
  return SUPPORTED_COUNTRIES.find(c => c.code === code);
};

export const getDefaultCountry = (): CountryConfig => SUPPORTED_COUNTRIES[0];

export const convertToVND = (amount: number, currency: string): number => {
  const country = SUPPORTED_COUNTRIES.find(c => c.currency === currency);
  if (!country) return amount;
  return amount * country.exchangeRateToVND;
};

export const formatCurrency = (amount: number, currency: string): string => {
  const country = SUPPORTED_COUNTRIES.find(c => c.currency === currency);
  if (!country) return `${amount}`;
  
  const symbols: Record<string, string> = {
    'KRW': '₩',
    'JPY': '¥',
    'TWD': 'NT$',
    'SGD': 'S$',
    'AUD': 'A$',
    'GBP': '£',
    'VND': '₫'
  };
  
  return `${symbols[currency] || ''}${amount.toLocaleString()}`;
};

// Country-specific validation
export const validateRequirements = (
  countryCode: string,
  profile: {
    gpa: number;
    ielts?: number;
    toefl?: number;
    budgetUSD: number;
  }
): { valid: boolean; missing: string[] } => {
  const country = getCountryByCode(countryCode);
  if (!country) return { valid: false, missing: ['Invalid country'] };
  
  const missing: string[] = [];
  
  if (profile.gpa < country.requirements.minGPA) {
    missing.push(`GPA tối thiểu ${country.requirements.minGPA}`);
  }
  
  const hasEnglishScore = (profile.ielts && profile.ielts >= country.requirements.minIELTS) ||
                         (profile.toefl && profile.toefl >= country.requirements.minTOEFL);
  if (!hasEnglishScore) {
    missing.push(`IELTS ${country.requirements.minIELTS}+ hoặc TOEFL ${country.requirements.minTOEFL}+`);
  }
  
  if (profile.budgetUSD < country.requirements.financialProof) {
    missing.push(`Chứng minh tài chính $${country.requirements.financialProof.toLocaleString()}`);
  }
  
  return { valid: missing.length === 0, missing };
};
