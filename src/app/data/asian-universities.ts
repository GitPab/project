import { University } from '../context/AppContext';

// Comprehensive Asian universities data with Ajou-style structure
export const asianUniversities: University[] = [
  // South Korea - Top universities with comprehensive Korean data
  {
    id: 'kr-snu-1',
    name: 'Seoul National University (서울대학교)',
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: '#1 university in South Korea, comprehensive research institution',
    thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    heroImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600',
    overview: 'Seoul National University is the most prestigious university in South Korea. Located in Gwanak-gu, Seoul, SNU offers world-class programs across all disciplines with strong research focus and international partnerships.',
    academicPrograms: [
      { icon: 'Microscope', title: 'Natural Sciences', description: 'Top-ranked programs in physics, chemistry, and biology' },
      { icon: 'Cpu', title: 'Engineering & IT', description: 'Leading programs in computer science and engineering' },
      { icon: 'Briefcase', title: 'Business & Economics', description: 'Prestigious business school and economics programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'],
    ranking: 'Ranked 1/200 universities in South Korea',
    worldRanking: 29,
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    fixedCosts: [
      { type: 'Phí tư vấn (Consulting Fee)', amount: 42000000, currency: 'VND' },
      { type: 'Phí môi giới (Agency Fees)', amount: 12000000, currency: 'VND' },
    ],
    koreanData: {
      isKoreanUniversity: true,
      address: '1 Gwanak-ro, Gwanak-gu, Seoul, South Korea',
      topVisa: 'Top 1',
      koreanRanking: '1/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        {
          visaType: 'D4-1',
          tuitionPerTerm: 1600000,
          applicationFee: 120000,
          baseYearlyFee: 6400000,
          description: 'Chương trình tiếng Hàn (Korean Language Program)'
        },
        {
          visaType: 'D2-2',
          tuitionRange: { min: 4200000, max: 5500000 },
          applicationFee: 180000,
          baseYearlyFee: 6400000,
          description: 'Chương trình đại học (Undergraduate Program)'
        },
        {
          visaType: 'D2-3',
          tuitionRange: { min: 3000000, max: 4800000 },
          enrollmentFee: 1000000,
          baseYearlyFee: 6400000,
          description: 'Chương trình sau đại học (Graduate Program)'
        }
      ],
      majorCategories: [
        { category: 'Thế mạnh (Strong Programs)', subjects: ['Engineering', 'Natural Sciences', 'Medicine', 'Business'] },
        { category: 'Khác (Other Programs)', subjects: ['Law', 'Humanities', 'Social Sciences', 'Agriculture'] }
      ],
      scholarships: [
        { visaType: 'D4-1', description: 'Giảm 30-100% học phí cho SV xuất sắc' },
        { visaType: 'D2-2', description: 'Giảm 50-100% dựa trên TOPIK (4-6) hoặc IELTS (6.0-8.5)' },
        { visaType: 'D2-3', description: 'Giảm 50% (Thạc sĩ), 100% (Tiến sĩ) nếu có TOPIK 5+' }
      ],
      studentSupport: ['Airport pickup', 'Visa conversion support', 'Korean buddy program', 'Housing assistance'],
      jobOpportunities: 'Seoul central area with abundant part-time opportunities in restaurants, cafes, and retail'
    },
    optionalAddons: [
      { id: 'korean-language-course', name: 'Korean Language Course', nameVi: 'Khóa học tiếng Hàn', nameKr: '한국어 코스', type: 'other', amount: 14000000, selectable: true, requiresInput: false },
      { id: 'dorm-vn', name: 'Dormitory in Vietnam', nameVi: 'KTX tại Việt Nam', nameKr: '베트남 기숙사', type: 'dorm-vn', amount: 850000, perMonth: true, selectable: true, requiresInput: true, options: [{ label: '1 tháng', value: 850000 }, { label: '3 tháng', value: 2550000 }, { label: '6 tháng', value: 5100000 }] },
      { id: 'dorm-kr-4person', name: 'KTX Korea - 4 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 4 người', nameKr: 'KTX 한국 - 4인실', type: 'dorm-kr', amount: 850000, selectable: true, requiresInput: false },
      { id: 'dorm-kr-2person', name: 'KTX Korea - 2 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 2 người', nameKr: 'KTX 한국 - 2인실', type: 'dorm-kr', amount: 1250000, selectable: true, requiresInput: false },
      { id: 'savings-account', name: 'Savings Account', nameVi: 'Tài khoản tiết kiệm', nameKr: '저축 계좌', type: 'savings', amountRange: { min: 10000000, max: 15000000 }, selectable: true, requiresInput: true, options: [{ label: '10,000,000 KRW', value: 10000000 }, { label: '12,000,000 KRW', value: 12000000 }, { label: '15,000,000 KRW', value: 15000000 }] },
      { id: 'flight-ticket', name: 'Flight Ticket', nameVi: 'Vé máy bay', nameKr: '항공권', type: 'flight', amount: 8500000, selectable: true, requiresInput: false },
      { id: 'scholarship', name: 'Scholarship', nameVi: 'Học bổng', nameKr: '장학금', type: 'scholarship', percentage: 50, selectable: true, requiresInput: true, options: [{ label: '30% giảm học phí', value: 30 }, { label: '50% giảm học phí', value: 50 }, { label: '70% giảm học phí', value: 70 }, { label: '100% giảm học phí', value: 100 }] }
    ],
    majors: ['Engineering', 'Natural Sciences', 'Medicine', 'Business', 'Law', 'Humanities']
  },
  {
    id: 'kr-kaist-1',
    name: 'KAIST (한국과학기술원)',
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: 'Korea Advanced Institute of Science and Technology - Leading STEM university',
    thumbnail: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=400',
    heroImage: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600',
    overview: 'KAIST is Korea\'s premier science and engineering university located in Daejeon. Known for cutting-edge research, innovation, and strong industry partnerships, KAIST produces leaders in technology and science.',
    academicPrograms: [
      { icon: 'Cpu', title: 'Computer Science & AI', description: 'World-class programs in AI, machine learning, and software' },
      { icon: 'Zap', title: 'Engineering', description: 'Top programs in electrical, mechanical, and aerospace engineering' },
      { icon: 'Atom', title: 'Natural Sciences', description: 'Strong physics, chemistry, and materials science programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800'],
    ranking: 'Ranked 3/200 universities in South Korea',
    worldRanking: 56,
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    fixedCosts: [
      { type: 'Phí tư vấn (Consulting Fee)', amount: 40000000, currency: 'VND' },
      { type: 'Phí môi giới (Agency Fees)', amount: 11500000, currency: 'VND' },
    ],
    koreanData: {
      isKoreanUniversity: true,
      address: '291 Daehak-ro, Yuseong-gu, Daejeon, South Korea',
      topVisa: 'Top 3',
      koreanRanking: '3/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        {
          visaType: 'D4-1',
          tuitionPerTerm: 1500000,
          applicationFee: 110000,
          baseYearlyFee: 6000000,
          description: 'Chương trình tiếng Hàn (Korean Language Program)'
        },
        {
          visaType: 'D2-2',
          tuitionRange: { min: 4000000, max: 5200000 },
          applicationFee: 170000,
          baseYearlyFee: 6000000,
          description: 'Chương trình đại học (Undergraduate Program)'
        },
        {
          visaType: 'D2-3',
          tuitionRange: { min: 2800000, max: 4500000 },
          enrollmentFee: 950000,
          baseYearlyFee: 6000000,
          description: 'Chương trình sau đại học (Graduate Program)'
        }
      ],
      majorCategories: [
        { category: 'Thế mạnh (Strong Programs)', subjects: ['Engineering', 'Computer Science', 'Physics', 'Chemistry'] },
        { category: 'Khác (Other Programs)', subjects: ['Business & Technology', 'Bio & Brain Engineering'] }
      ],
      scholarships: [
        { visaType: 'D4-1', description: 'Giảm 50-100% học phí cho SV xuất sắc' },
        { visaType: 'D2-2', description: 'Giảm 40-100% dựa trên TOPIK (4-6) hoặc IELTS (6.5-8.0)' },
        { visaType: 'D2-3', description: 'Nhiều học bổng 100% cho nghiên cứu sinh' }
      ],
      studentSupport: ['Research opportunities', 'Industry partnerships', 'Innovation hub access', 'Career support'],
      jobOpportunities: 'Daejeon tech hub with opportunities in research institutes and tech companies'
    },
    optionalAddons: [
      { id: 'korean-language-course', name: 'Korean Language Course', nameVi: 'Khóa học tiếng Hàn', nameKr: '한국어 코스', type: 'other', amount: 13500000, selectable: true, requiresInput: false },
      { id: 'dorm-kr-2person', name: 'KTX Korea - 2 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 2 người', nameKr: 'KTX 한국 - 2인실', type: 'dorm-kr', amount: 1100000, selectable: true, requiresInput: false },
      { id: 'savings-account', name: 'Savings Account', nameVi: 'Tài khoản tiết kiệm', nameKr: '저축 계좌', type: 'savings', amountRange: { min: 8000000, max: 10000000 }, selectable: true, requiresInput: true, options: [{ label: '8,000,000 KRW', value: 8000000 }, { label: '10,000,000 KRW', value: 10000000 }] },
      { id: 'flight-ticket', name: 'Flight Ticket', nameVi: 'Vé máy bay', nameKr: '항공권', type: 'flight', amount: 8000000, selectable: true, requiresInput: false },
    ],
    majors: ['Engineering', 'Computer Science', 'Physics', 'Chemistry', 'Bio Engineering']
  },
  {
    id: 'kr-korea-u-1',
    name: 'Korea University (고려대학교)',
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: 'Top 5 private university with strong liberal arts and business programs',
    thumbnail: 'https://images.unsplash.com/photo-1562774053-701939374585?w=400',
    heroImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1600',
    overview: 'Korea University is one of South Korea\'s most prestigious private universities, located in Seoul. Known for excellence in business, law, and liberal arts, KU has a vibrant campus culture and strong alumni network.',
    academicPrograms: [
      { icon: 'Briefcase', title: 'Business Administration', description: 'Top business school with strong corporate connections' },
      { icon: 'Scale', title: 'Law', description: 'Prestigious law school and legal studies programs' },
      { icon: 'BookOpen', title: 'Liberal Arts', description: 'Comprehensive humanities and social sciences programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1562774053-701939374585?w=800'],
    ranking: 'Ranked 5/200 universities in South Korea',
    worldRanking: 79,
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    fixedCosts: [
      { type: 'Phí tư vấn (Consulting Fee)', amount: 38000000, currency: 'VND' },
      { type: 'Phí môi giới (Agency Fees)', amount: 11000000, currency: 'VND' },
    ],
    koreanData: {
      isKoreanUniversity: true,
      address: '145 Anam-ro, Seongbuk-gu, Seoul, South Korea',
      topVisa: 'Top 5',
      koreanRanking: '5/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        {
          visaType: 'D4-1',
          tuitionPerTerm: 1500000,
          applicationFee: 100000,
          baseYearlyFee: 6000000,
          description: 'Chương trình tiếng Hàn (Korean Language Program)'
        },
        {
          visaType: 'D2-2',
          tuitionRange: { min: 3900000, max: 5000000 },
          applicationFee: 150000,
          baseYearlyFee: 6000000,
          description: 'Chương trình đại học (Undergraduate Program)'
        },
        {
          visaType: 'D2-3',
          tuitionRange: { min: 2700000, max: 4200000 },
          enrollmentFee: 900000,
          baseYearlyFee: 6000000,
          description: 'Chương trình sau đại học (Graduate Program)'
        }
      ],
      majorCategories: [
        { category: 'Thế mạnh (Strong Programs)', subjects: ['Business', 'Law', 'Political Science', 'Economics'] },
        { category: 'Khác (Other Programs)', subjects: ['Engineering', 'Liberal Arts', 'Life Sciences'] }
      ],
      scholarships: [
        { visaType: 'D4-1', description: 'Giảm 40-100% học phí cho SV xuất sắc' },
        { visaType: 'D2-2', description: 'Giảm 30-100% dựa trên TOPIK (3-6) hoặc IELTS (6.0-8.0)' },
        { visaType: 'D2-3', description: 'Giảm 50-100% cho sinh viên nghiên cứu' }
      ],
      studentSupport: ['Seoul location advantage', 'Strong alumni network', 'Career center', 'Exchange programs'],
      jobOpportunities: 'Seoul central with diverse opportunities in business, finance, and corporate sectors'
    },
    optionalAddons: [
      { id: 'korean-language-course', name: 'Korean Language Course', nameVi: 'Khóa học tiếng Hàn', nameKr: '한국어 코스', type: 'other', amount: 13000000, selectable: true, requiresInput: false },
      { id: 'dorm-kr-4person', name: 'KTX Korea - 4 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 4 người', nameKr: 'KTX 한국 - 4인실', type: 'dorm-kr', amount: 800000, selectable: true, requiresInput: false },
      { id: 'dorm-kr-2person', name: 'KTX Korea - 2 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 2 người', nameKr: 'KTX 한국 - 2인실', type: 'dorm-kr', amount: 1200000, selectable: true, requiresInput: false },
      { id: 'savings-account', name: 'Savings Account', nameVi: 'Tài khoản tiết kiệm', nameKr: '저축 계좌', type: 'savings', amountRange: { min: 8000000, max: 10000000 }, selectable: true, requiresInput: true, options: [{ label: '8,000,000 KRW', value: 8000000 }, { label: '10,000,000 KRW', value: 10000000 }] },
      { id: 'flight-ticket', name: 'Flight Ticket', nameVi: 'Vé máy bay', nameKr: '항공권', type: 'flight', amount: 8000000, selectable: true, requiresInput: false },
    ],
    majors: ['Business', 'Law', 'Political Science', 'Economics', 'Engineering', 'Liberal Arts']
  },
  {
    id: 'kr-yonsei-1',
    name: 'Yonsei University (연세대학교)',
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: 'Historic private university with global reputation',
    thumbnail: 'https://images.unsplash.com/photo-1566404394190-cda8c6f3b9e5?w=400',
    heroImage: 'https://images.unsplash.com/photo-1566404394190-cda8c6f3b9e5?w=1600',
    overview: 'Yonsei University is one of Korea\'s oldest and most prestigious universities, founded in 1885. Located in Seoul, Yonsei offers comprehensive programs and has a beautiful historic campus.',
    academicPrograms: [
      { icon: 'Microscope', title: 'Medicine', description: 'One of the best medical schools in Korea' },
      { icon: 'Briefcase', title: 'Business', description: 'Top business school with international programs' },
      { icon: 'Globe', title: 'International Studies', description: 'Strong programs in IR and Global Affairs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1566404394190-cda8c6f3b9e5?w=800'],
    ranking: 'Ranked 4/200 universities in South Korea',
    worldRanking: 76,
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    fixedCosts: [
      { type: 'Phí tư vấn (Consulting Fee)', amount: 39000000, currency: 'VND' },
      { type: 'Phí môi giới (Agency Fees)', amount: 11000000, currency: 'VND' },
    ],
    koreanData: {
      isKoreanUniversity: true,
      address: '50 Yonsei-ro, Seodaemun-gu, Seoul, South Korea',
      topVisa: 'Top 4',
      koreanRanking: '4/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        {
          visaType: 'D4-1',
          tuitionPerTerm: 1550000,
          applicationFee: 110000,
          baseYearlyFee: 6200000,
          description: 'Chương trình tiếng Hàn (Korean Language Program)'
        },
        {
          visaType: 'D2-2',
          tuitionRange: { min: 4000000, max: 5100000 },
          applicationFee: 160000,
          baseYearlyFee: 6200000,
          description: 'Chương trình đại học (Undergraduate Program)'
        },
        {
          visaType: 'D2-3',
          tuitionRange: { min: 2800000, max: 4300000 },
          enrollmentFee: 920000,
          baseYearlyFee: 6200000,
          description: 'Chương trình sau đại học (Graduate Program)'
        }
      ],
      majorCategories: [
        { category: 'Thế mạnh (Strong Programs)', subjects: ['Medicine', 'Business', 'Engineering', 'International Studies'] },
        { category: 'Khác (Other Programs)', subjects: ['Liberal Arts', 'Science', 'Theology'] }
      ],
      scholarships: [
        { visaType: 'D4-1', description: 'Giảm 40-100% học phí cho SV xuất sắc' },
        { visaType: 'D2-2', description: 'Giảm 30-100% dựa trên TOPIK (3-6) hoặc IELTS (6.0-8.5)' },
        { visaType: 'D2-3', description: 'Giảm 50-100% cho sinh viên nghiên cứu' }
      ],
      studentSupport: ['Historic campus', 'Global partnerships', 'Medical center access', 'Cultural programs'],
      jobOpportunities: 'Prime Seoul location with opportunities in all sectors'
    },
    optionalAddons: [
      { id: 'korean-language-course', name: 'Korean Language Course', nameVi: 'Khóa học tiếng Hàn', nameKr: '한국어 코스', type: 'other', amount: 13500000, selectable: true, requiresInput: false },
      { id: 'dorm-kr-2person', name: 'KTX Korea - 2 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 2 người', nameKr: 'KTX 한국 - 2인실', type: 'dorm-kr', amount: 1150000, selectable: true, requiresInput: false },
      { id: 'flight-ticket', name: 'Flight Ticket', nameVi: 'Vé máy bay', nameKr: '항공권', type: 'flight', amount: 8000000, selectable: true, requiresInput: false },
    ],
    majors: ['Medicine', 'Business', 'Engineering', 'International Studies', 'Liberal Arts']
  },
  {
    id: 'kr-sungkyunkwan-1',
    name: 'Sungkyunkwan University (성균관대학교)',
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: '600-year history, modern innovation - Samsung-affiliated university',
    thumbnail: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=400',
    heroImage: 'https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=1600',
    overview: 'SKKU is Korea\'s oldest university with over 600 years of history, now a modern institution with strong ties to Samsung. Offers cutting-edge programs in business, engineering, and technology.',
    academicPrograms: [
      { icon: 'Briefcase', title: 'Business', description: 'Samsung-backed business programs with industry connections' },
      { icon: 'Cpu', title: 'Engineering & IT', description: 'Strong technology and engineering programs' },
      { icon: 'BookOpen', title: 'Confucian Studies', description: 'Unique traditional Korean studies programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1576495199011-eb94736d05d6?w=800'],
    ranking: 'Ranked 6/200 universities in South Korea',
    worldRanking: 88,
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    fixedCosts: [
      { type: 'Phí tư vấn (Consulting Fee)', amount: 37000000, currency: 'VND' },
      { type: 'Phí môi giới (Agency Fees)', amount: 10500000, currency: 'VND' },
    ],
    koreanData: {
      isKoreanUniversity: true,
      address: '25-2 Sungkyunkwan-ro, Jongno-gu, Seoul, South Korea',
      topVisa: 'Top 6',
      koreanRanking: '6/200 trường đại học tại Hàn Quốc',
      visaSystems: [
        {
          visaType: 'D4-1',
          tuitionPerTerm: 1480000,
          applicationFee: 100000,
          baseYearlyFee: 5920000,
          description: 'Chương trình tiếng Hàn (Korean Language Program)'
        },
        {
          visaType: 'D2-2',
          tuitionRange: { min: 3800000, max: 4900000 },
          applicationFee: 150000,
          baseYearlyFee: 5920000,
          description: 'Chương trình đại học (Undergraduate Program)'
        },
        {
          visaType: 'D2-3',
          tuitionRange: { min: 2650000, max: 4100000 },
          enrollmentFee: 880000,
          baseYearlyFee: 5920000,
          description: 'Chương trình sau đại học (Graduate Program)'
        }
      ],
      majorCategories: [
        { category: 'Thế mạnh (Strong Programs)', subjects: ['Business', 'Engineering', 'Pharmacy', 'Medicine'] },
        { category: 'Khác (Other Programs)', subjects: ['Liberal Arts', 'Confucian Studies', 'Science'] }
      ],
      scholarships: [
        { visaType: 'D4-1', description: 'Giảm 30-100% học phí cho SV xuất sắc' },
        { visaType: 'D2-2', description: 'Giảm 30-100% dựa trên thành tích học tập' },
        { visaType: 'D2-3', description: 'Samsung scholarships available' }
      ],
      studentSupport: ['Samsung partnerships', 'Industry internships', 'Historic campus', 'Modern facilities'],
      jobOpportunities: 'Strong Samsung connections, Seoul location benefits'
    },
    optionalAddons: [
      { id: 'korean-language-course', name: 'Korean Language Course', nameVi: 'Khóa học tiếng Hàn', nameKr: '한국어 코스', type: 'other', amount: 13000000, selectable: true, requiresInput: false },
      { id: 'dorm-kr-4person', name: 'KTX Korea - 4 Person Room', nameVi: 'KTX Hàn Quốc - Phòng 4 người', nameKr: 'KTX 한국 - 4인실', type: 'dorm-kr', amount: 770000, selectable: true, requiresInput: false },
      { id: 'savings-account', name: 'Savings Account', nameVi: 'Tài khoản tiết kiệm', nameKr: '저축 계좌', type: 'savings', amountRange: { min: 8000000, max: 10000000 }, selectable: true, requiresInput: true, options: [{ label: '8,000,000 KRW', value: 8000000 }, { label: '10,000,000 KRW', value: 10000000 }] },
      { id: 'flight-ticket', name: 'Flight Ticket', nameVi: 'Vé máy bay', nameKr: '항공권', type: 'flight', amount: 8000000, selectable: true, requiresInput: false },
    ],
    majors: ['Business', 'Engineering', 'Pharmacy', 'Medicine', 'Liberal Arts', 'Confucian Studies']
  },

  // China - Top universities
  {
    id: 'cn-tsinghua-1',
    name: 'Tsinghua University (清华大学)',
    country: 'China',
    countryCode: '🇨🇳',
    tagline: '#1 university in China - MIT of China',
    thumbnail: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=400',
    heroImage: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1600',
    overview: 'Tsinghua University is China\'s top university, known as the MIT of China. Located in Beijing, it excels in engineering, computer science, and business.',
    academicPrograms: [
      { icon: 'Cpu', title: 'Computer Science', description: 'World-leading AI and computer science programs' },
      { icon: 'Zap', title: 'Engineering', description: 'Top engineering programs across all disciplines' },
      { icon: 'Briefcase', title: 'Business', description: 'Prestigious business school' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800'],
    ranking: '#1 in China, #25 globally',
    worldRanking: 25,
    generalTuition: 4500,
    visaFee: 150,
    accommodationFee: 3000,
    insuranceFee: 800,
    additionalFees: [
      { type: 'Application Fee', amount: 100 },
      { type: 'Registration Fee', amount: 400 }
    ],
    majors: ['Computer Science', 'Engineering', 'Business', 'Architecture', 'Sciences']
  },
  {
    id: 'cn-peking-1',
    name: 'Peking University (北京大学)',
    country: 'China',
    countryCode: '🇨🇳',
    tagline: '#2 in China - Harvard of China for liberal arts',
    thumbnail: 'https://images.unsplash.com/photo-1538530432881-d8f211a7ff42?w=400',
    heroImage: 'https://images.unsplash.com/photo-1538530432881-d8f211a7ff42?w=1600',
    overview: 'Peking University is China\'s most prestigious comprehensive university, known for excellence in humanities, social sciences, and natural sciences.',
    academicPrograms: [
      { icon: 'BookOpen', title: 'Liberal Arts', description: 'Top humanities and social sciences programs' },
      { icon: 'Microscope', title: 'Sciences', description: 'Strong natural sciences programs' },
      { icon: 'TrendingUp', title: 'Economics', description: 'Leading economics and finance programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1538530432881-d8f211a7ff42?w=800'],
    ranking: '#2 in China, #26 globally',
    worldRanking: 26,
    generalTuition: 4500,
    visaFee: 150,
    accommodationFee: 2800,
    insuranceFee: 800,
    additionalFees: [
      { type: 'Application Fee', amount: 100 },
      { type: 'Registration Fee', amount: 400 }
    ],
    majors: ['Liberal Arts', 'Economics', 'Sciences', 'Medicine', 'Law']
  },
  {
    id: 'cn-fudan-1',
    name: 'Fudan University (复旦大学)',
    country: 'China',
    countryCode: '🇨🇳',
    tagline: 'Premier university in Shanghai with comprehensive programs',
    thumbnail: 'https://images.unsplash.com/photo-1613250291634-eec7e60e0b0b?w=400',
    heroImage: 'https://images.unsplash.com/photo-1613250291634-eec7e60e0b0b?w=1600',
    overview: 'Fudan University is one of China\'s oldest and most selective universities, located in Shanghai. Known for strong programs across all disciplines.',
    academicPrograms: [
      { icon: 'Briefcase', title: 'Business & Management', description: 'Top business school in China' },
      { icon: 'Microscope', title: 'Medicine', description: 'Excellent medical school' },
      { icon: 'Globe', title: 'International Relations', description: 'Strong IR programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1613250291634-eec7e60e0b0b?w=800'],
    ranking: '#3 in China, #50 globally',
    worldRanking: 50,
    generalTuition: 4200,
    visaFee: 150,
    accommodationFee: 3200,
    insuranceFee: 750,
    additionalFees: [
      { type: 'Application Fee', amount: 100 },
      { type: 'Student Services', amount: 300 }
    ],
    majors: ['Business', 'Medicine', 'International Relations', 'Economics', 'Engineering']
  },
  {
    id: 'cn-sjtu-1',
    name: 'Shanghai Jiao Tong University (上海交通大学)',
    country: 'China',
    countryCode: '🇨🇳',
    tagline: 'Top engineering and technology university in Shanghai',
    thumbnail: 'https://images.unsplash.com/photo-1583309348787-838f3bd718c7?w=400',
    heroImage: 'https://images.unsplash.com/photo-1583309348787-838f3bd718c7?w=1600',
    overview: 'SJTU is a leading research university in Shanghai, known for outstanding engineering, business, and medical programs.',
    academicPrograms: [
      { icon: 'Zap', title: 'Engineering', description: 'Top engineering programs in China' },
      { icon: 'Cpu', title: 'Computer Science', description: 'Strong CS and IT programs' },
      { icon: 'Briefcase', title: 'Business', description: 'Antai College of Economics and Management' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1583309348787-838f3bd718c7?w=800'],
    ranking: '#4 in China, #46 globally',
    worldRanking: 46,
    generalTuition: 4100,
    visaFee: 150,
    accommodationFee: 3100,
    insuranceFee: 750,
    additionalFees: [
      { type: 'Application Fee', amount: 100 },
      { type: 'Facilities Fee', amount: 350 }
    ],
    majors: ['Engineering', 'Computer Science', 'Business', 'Medicine', 'Sciences']
  },
  {
    id: 'cn-zju-1',
    name: 'Zhejiang University (浙江大学)',
    country: 'China',
    countryCode: '🇨🇳',
    tagline: 'Comprehensive university in Hangzhou with tech innovation',
    thumbnail: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=400',
    heroImage: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=1600',
    overview: 'Zhejiang University in Hangzhou is a top comprehensive research university with strengths in engineering, sciences, and entrepreneurship.',
    academicPrograms: [
      { icon: 'Zap', title: 'Engineering', description: 'Strong engineering and technology programs' },
      { icon: 'Cpu', title: 'Computer Science', description: 'AI and software engineering excellence' },
      { icon: 'Rocket', title: 'Innovation', description: 'Entrepreneurship and startup programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=800'],
    ranking: '#5 in China, #52 globally',
    worldRanking: 52,
    generalTuition: 4000,
    visaFee: 150,
    accommodationFee: 2900,
    insuranceFee: 700,
    additionalFees: [
      { type: 'Application Fee', amount: 100 },
      { type: 'Student Services', amount: 300 }
    ],
    majors: ['Engineering', 'Computer Science', 'Business', 'Sciences', 'Agriculture']
  },
  {
    id: 'cn-ustc-1',
    name: 'University of Science and Technology of China (中国科学技术大学)',
    country: 'China',
    countryCode: '🇨🇳',
    tagline: 'Elite science and technology institution in Hefei',
    thumbnail: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=400',
    heroImage: 'https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=1600',
    overview: 'USTC is a premier science and technology university operated by the Chinese Academy of Sciences, known for physics, chemistry, and computing.',
    academicPrograms: [
      { icon: 'Atom', title: 'Physics', description: 'World-class physics and quantum research' },
      { icon: 'TestTube', title: 'Chemistry', description: 'Top chemistry programs' },
      { icon: 'Cpu', title: 'Computer Science', description: 'Strong CS and AI programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1580537659466-0a9bfa916a54?w=800'],
    ranking: '#6 in China, #94 globally',
    worldRanking: 94,
    generalTuition: 3900,
    visaFee: 150,
    accommodationFee: 2500,
    insuranceFee: 700,
    additionalFees: [
      { type: 'Application Fee', amount: 100 },
      { type: 'Lab Fee', amount: 400 }
    ],
    majors: ['Physics', 'Chemistry', 'Computer Science', 'Mathematics', 'Engineering']
  },

  // Japan - Top universities
  {
    id: 'jp-tokyo-1',
    name: 'University of Tokyo (東京大学)',
    country: 'Japan',
    countryCode: '🇯🇵',
    tagline: '#1 university in Japan with comprehensive excellence',
    thumbnail: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400',
    heroImage: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1600',
    overview: 'The University of Tokyo is Japan\'s most prestigious university, known for outstanding research and comprehensive programs across all disciplines.',
    academicPrograms: [
      { icon: 'Microscope', title: 'Sciences', description: 'World-class natural sciences programs' },
      { icon: 'Zap', title: 'Engineering', description: 'Top engineering programs' },
      { icon: 'BookOpen', title: 'Liberal Arts', description: 'Strong humanities and social sciences' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800'],
    ranking: '#1 in Japan, #28 globally',
    worldRanking: 28,
    generalTuition: 5400,
    visaFee: 30,
    accommodationFee: 7000,
    insuranceFee: 500,
    additionalFees: [
      { type: 'Enrollment Fee', amount: 2800 },
      { type: 'Student Services', amount: 400 }
    ],
    majors: ['Engineering', 'Sciences', 'Medicine', 'Law', 'Economics', 'Liberal Arts']
  },
  {
    id: 'jp-kyoto-1',
    name: 'Kyoto University (京都大学)',
    country: 'Japan',
    countryCode: '🇯🇵',
    tagline: '#2 in Japan - Nobel Prize powerhouse',
    thumbnail: 'https://images.unsplash.com/photo-1619224141111-2ed933b9b8f0?w=400',
    heroImage: 'https://images.unsplash.com/photo-1619224141111-2ed933b9b8f0?w=1600',
    overview: 'Kyoto University is Japan\'s second-ranked university, known for academic freedom and producing numerous Nobel laureates in sciences.',
    academicPrograms: [
      { icon: 'Atom', title: 'Physics & Chemistry', description: 'Nobel Prize-winning research' },
      { icon: 'Microscope', title: 'Medicine', description: 'Top medical and biological sciences' },
      { icon: 'Zap', title: 'Engineering', description: 'Strong engineering programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1619224141111-2ed933b9b8f0?w=800'],
    ranking: '#2 in Japan, #36 globally',
    worldRanking: 36,
    generalTuition: 5400,
    visaFee: 30,
    accommodationFee: 6500,
    insuranceFee: 500,
    additionalFees: [
      { type: 'Enrollment Fee', amount: 2800 },
      { type: 'Student Services', amount: 350 }
    ],
    majors: ['Physics', 'Chemistry', 'Medicine', 'Engineering', 'Law', 'Economics']
  },
  {
    id: 'jp-osaka-1',
    name: 'Osaka University (大阪大学)',
    country: 'Japan',
    countryCode: '🇯🇵',
    tagline: 'Leading research university in Western Japan',
    thumbnail: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400',
    heroImage: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=1600',
    overview: 'Osaka University is a top national university in Osaka, known for strong programs in engineering, medicine, and international business.',
    academicPrograms: [
      { icon: 'Microscope', title: 'Medicine', description: 'Excellent medical school and research' },
      { icon: 'Zap', title: 'Engineering', description: 'Strong applied sciences and engineering' },
      { icon: 'Globe', title: 'International Studies', description: 'Global business and relations' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800'],
    ranking: '#3 in Japan, #80 globally',
    worldRanking: 80,
    generalTuition: 5200,
    visaFee: 30,
    accommodationFee: 6200,
    insuranceFee: 480,
    additionalFees: [
      { type: 'Enrollment Fee', amount: 2800 },
      { type: 'Facilities Fee', amount: 400 }
    ],
    majors: ['Medicine', 'Engineering', 'Sciences', 'International Studies', 'Economics']
  },
  {
    id: 'jp-tohoku-1',
    name: 'Tohoku University (東北大学)',
    country: 'Japan',
    countryCode: '🇯🇵',
    tagline: 'Research-intensive university in Sendai',
    thumbnail: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400',
    heroImage: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600',
    overview: 'Tohoku University in Sendai is known for pioneering research, particularly in materials science, engineering, and physics.',
    academicPrograms: [
      { icon: 'Atom', title: 'Materials Science', description: 'World-leading materials research' },
      { icon: 'Zap', title: 'Engineering', description: 'Strong engineering programs' },
      { icon: 'Microscope', title: 'Sciences', description: 'Top natural sciences programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1528164344705-47542687000d?w=800'],
    ranking: '#4 in Japan, #113 globally',
    worldRanking: 113,
    generalTuition: 5200,
    visaFee: 30,
    accommodationFee: 5500,
    insuranceFee: 480,
    additionalFees: [
      { type: 'Enrollment Fee', amount: 2800 },
      { type: 'Student Services', amount: 350 }
    ],
    majors: ['Materials Science', 'Engineering', 'Physics', 'Chemistry', 'Medicine']
  },
  {
    id: 'jp-nagoya-1',
    name: 'Nagoya University (名古屋大学)',
    country: 'Japan',
    countryCode: '🇯🇵',
    tagline: 'Nobel Prize university in central Japan',
    thumbnail: 'https://images.unsplash.com/photo-1626125345510-4603468288da?w=400',
    heroImage: 'https://images.unsplash.com/photo-1626125345510-4603468288da?w=1600',
    overview: 'Nagoya University has produced numerous Nobel Prize winners, particularly in physics and chemistry. Strong in sciences and engineering.',
    academicPrograms: [
      { icon: 'Atom', title: 'Physics', description: 'Nobel Prize-winning physics research' },
      { icon: 'TestTube', title: 'Chemistry', description: 'Top chemistry programs' },
      { icon: 'Zap', title: 'Engineering', description: 'Strong automotive and aerospace engineering' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1626125345510-4603468288da?w=800'],
    ranking: '#5 in Japan, #118 globally',
    worldRanking: 118,
    generalTuition: 5200,
    visaFee: 30,
    accommodationFee: 5300,
    insuranceFee: 480,
    additionalFees: [
      { type: 'Enrollment Fee', amount: 2800 },
      { type: 'Research Fee', amount: 400 }
    ],
    majors: ['Physics', 'Chemistry', 'Engineering', 'Medicine', 'Law']
  },

  // Singapore - Top universities
  {
    id: 'sg-nus-1',
    name: 'National University of Singapore (NUS)',
    country: 'Singapore',
    countryCode: '🇸🇬',
    tagline: '#1 in Asia - Global university in Singapore',
    thumbnail: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400',
    heroImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600',
    overview: 'NUS is consistently ranked as Asia\'s top university, offering world-class education with strong programs across all disciplines and a global perspective.',
    academicPrograms: [
      { icon: 'Cpu', title: 'Computer Science', description: 'Top 10 globally in CS and AI' },
      { icon: 'Briefcase', title: 'Business', description: 'Top business school in Asia' },
      { icon: 'Zap', title: 'Engineering', description: 'World-class engineering programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'],
    ranking: '#1 in Asia, #8 globally',
    worldRanking: 8,
    generalTuition: 27000,
    visaFee: 90,
    accommodationFee: 8000,
    insuranceFee: 350,
    additionalFees: [
      { type: 'Student Services', amount: 500 },
      { type: 'Sports & Recreation', amount: 200 }
    ],
    majors: ['Computer Science', 'Business', 'Engineering', 'Law', 'Medicine', 'Design']
  },
  {
    id: 'sg-ntu-1',
    name: 'Nanyang Technological University (NTU)',
    country: 'Singapore',
    countryCode: '🇸🇬',
    tagline: 'Young innovative university with tech focus',
    thumbnail: 'https://images.unsplash.com/photo-1601985704034-6c71d8b13e91?w=400',
    heroImage: 'https://images.unsplash.com/photo-1601985704034-6c71d8b13e91?w=1600',
    overview: 'NTU is a young and innovative university known for cutting-edge engineering, business, and science programs with beautiful campus and smart technology.',
    academicPrograms: [
      { icon: 'Zap', title: 'Engineering', description: 'Top engineering school globally' },
      { icon: 'Cpu', title: 'Computer Science', description: 'Strong AI and data science programs' },
      { icon: 'Briefcase', title: 'Business', description: 'Nanyang Business School excellence' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1601985704034-6c71d8b13e91?w=800'],
    ranking: '#2 in Singapore, #15 globally',
    worldRanking: 15,
    generalTuition: 26000,
    visaFee: 90,
    accommodationFee: 7500,
    insuranceFee: 350,
    additionalFees: [
      { type: 'Student Activity', amount: 450 },
      { type: 'Technology Fee', amount: 250 }
    ],
    majors: ['Engineering', 'Computer Science', 'Business', 'Communication', 'Science']
  },

  // Vietnam - Top universities
  {
    id: 'vn-vnu-hanoi-1',
    name: 'Vietnam National University Hanoi (ĐHQGHN)',
    country: 'Vietnam',
    countryCode: '🇻🇳',
    tagline: 'Vietnam\'s top comprehensive research university',
    thumbnail: 'https://images.unsplash.com/photo-1555881025-ef7c4fdbbd90?w=400',
    heroImage: 'https://images.unsplash.com/photo-1555881025-ef7c4fdbbd90?w=1600',
    overview: 'VNU Hanoi is Vietnam\'s leading university system, comprising multiple member universities offering comprehensive programs across all disciplines.',
    academicPrograms: [
      { icon: 'Cpu', title: 'Information Technology', description: 'Leading CS and IT programs in Vietnam' },
      { icon: 'BookOpen', title: 'Social Sciences', description: 'Strong humanities and social sciences' },
      { icon: 'Globe', title: 'International Studies', description: 'Top international relations programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1555881025-ef7c4fdbbd90?w=800'],
    ranking: '#1 in Vietnam, #801-1000 globally',
    worldRanking: 900,
    generalTuition: 1200,
    visaFee: 25,
    accommodationFee: 1500,
    insuranceFee: 100,
    additionalFees: [
      { type: 'Registration Fee', amount: 50 },
      { type: 'Student Services', amount: 30 }
    ],
    majors: ['Information Technology', 'Economics', 'International Studies', 'Sciences', 'Engineering']
  },
  {
    id: 'vn-hcmut-1',
    name: 'Ho Chi Minh City University of Technology (HCMUT)',
    country: 'Vietnam',
    countryCode: '🇻🇳',
    tagline: 'Leading engineering and technology university in Southern Vietnam',
    thumbnail: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=400',
    heroImage: 'https://images.unsplash.com/photo-1562813733-b31f71025d54?w=1600',
    overview: 'HCMUT is Vietnam\'s premier engineering university, offering excellent programs in engineering, technology, and applied sciences.',
    academicPrograms: [
      { icon: 'Zap', title: 'Engineering', description: 'Top engineering programs in Vietnam' },
      { icon: 'Cpu', title: 'Computer Engineering', description: 'Strong CS and software engineering' },
      { icon: 'Building2', title: 'Architecture', description: 'Architecture and construction programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1562813733-b31f71025d54?w=800'],
    ranking: '#2 in Vietnam',
    worldRanking: 950,
    generalTuition: 1100,
    visaFee: 25,
    accommodationFee: 1400,
    insuranceFee: 100,
    additionalFees: [
      { type: 'Lab Fee', amount: 80 },
      { type: 'Student Services', amount: 30 }
    ],
    majors: ['Engineering', 'Computer Engineering', 'Architecture', 'Applied Sciences']
  },
  {
    id: 'vn-hust-1',
    name: 'Hanoi University of Science and Technology (HUST)',
    country: 'Vietnam',
    countryCode: '🇻🇳',
    tagline: 'Vietnam\'s first and largest technical university',
    thumbnail: 'https://images.unsplash.com/photo-1574260962699-c6c829c55e0f?w=400',
    heroImage: 'https://images.unsplash.com/photo-1574260962699-c6c829c55e0f?w=1600',
    overview: 'HUST is Vietnam\'s oldest and largest technical university, founded in 1956. Excellence in engineering and technology education.',
    academicPrograms: [
      { icon: 'Zap', title: 'Engineering', description: 'Comprehensive engineering programs' },
      { icon: 'Cpu', title: 'Information Technology', description: 'Strong IT and CS programs' },
      { icon: 'Microscope', title: 'Applied Sciences', description: 'Physics, chemistry, and mathematics' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1574260962699-c6c829c55e0f?w=800'],
    ranking: '#3 in Vietnam',
    worldRanking: 980,
    generalTuition: 1100,
    visaFee: 25,
    accommodationFee: 1300,
    insuranceFee: 100,
    additionalFees: [
      { type: 'Lab Fee', amount: 75 },
      { type: 'Registration', amount: 40 }
    ],
    majors: ['Engineering', 'Information Technology', 'Applied Sciences', 'Management']
  },

  // India - Top universities
  {
    id: 'in-iit-bombay-1',
    name: 'IIT Bombay (Indian Institute of Technology Bombay)',
    country: 'India',
    countryCode: '🇮🇳',
    tagline: 'India\'s top engineering institution',
    thumbnail: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=400',
    heroImage: 'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=1600',
    overview: 'IIT Bombay is India\'s premier engineering and technology institution, known for rigorous academics and producing tech leaders.',
    academicPrograms: [
      { icon: 'Cpu', title: 'Computer Science', description: 'Top CS program in India' },
      { icon: 'Zap', title: 'Engineering', description: 'Excellence across all engineering disciplines' },
      { icon: 'Briefcase', title: 'Management', description: 'Shailesh J. Mehta School of Management' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=800'],
    ranking: '#1 in India, #149 globally',
    worldRanking: 149,
    generalTuition: 3000,
    visaFee: 190,
    accommodationFee: 1200,
    insuranceFee: 200,
    additionalFees: [
      { type: 'Hostel Fee', amount: 400 },
      { type: 'Mess Fee', amount: 600 }
    ],
    majors: ['Computer Science', 'Engineering', 'Management', 'Design', 'Sciences']
  },
  {
    id: 'in-iit-delhi-1',
    name: 'IIT Delhi (Indian Institute of Technology Delhi)',
    country: 'India',
    countryCode: '🇮🇳',
    tagline: 'Premier technical institution in Delhi',
    thumbnail: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?w=400',
    heroImage: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?w=1600',
    overview: 'IIT Delhi is one of India\'s top engineering colleges, located in the capital city with strong industry connections.',
    academicPrograms: [
      { icon: 'Zap', title: 'Engineering', description: 'Top engineering programs' },
      { icon: 'Cpu', title: 'Computer Science', description: 'Excellent CS and IT programs' },
      { icon: 'Atom', title: 'Sciences', description: 'Strong pure sciences programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1554188248-986adbb73be4?w=800'],
    ranking: '#2 in India, #197 globally',
    worldRanking: 197,
    generalTuition: 3000,
    visaFee: 190,
    accommodationFee: 1100,
    insuranceFee: 200,
    additionalFees: [
      { type: 'Hostel Fee', amount: 400 },
      { type: 'Mess Fee', amount: 600 }
    ],
    majors: ['Engineering', 'Computer Science', 'Management', 'Design', 'Humanities']
  },
  {
    id: 'in-iisc-1',
    name: 'Indian Institute of Science (IISc Bangalore)',
    country: 'India',
    countryCode: '🇮🇳',
    tagline: 'India\'s top research institution',
    thumbnail: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400',
    heroImage: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=1600',
    overview: 'IISc is India\'s leading research university, focused on pure sciences and research-driven engineering.',
    academicPrograms: [
      { icon: 'Atom', title: 'Pure Sciences', description: 'Top physics, chemistry, mathematics' },
      { icon: 'Zap', title: 'Engineering Research', description: 'Research-focused engineering programs' },
      { icon: 'Cpu', title: 'Computational Sciences', description: 'Strong computational and AI research' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800'],
    ranking: '#3 in India, #155 globally',
    worldRanking: 155,
    generalTuition: 2800,
    visaFee: 190,
    accommodationFee: 1000,
    insuranceFee: 180,
    additionalFees: [
      { type: 'Research Fee', amount: 500 },
      { type: 'Hostel Fee', amount: 350 }
    ],
    majors: ['Pure Sciences', 'Engineering', 'Computational Sciences', 'Management']
  },

  // Thailand - Top university
  {
    id: 'th-chula-1',
    name: 'Chulalongkorn University (จุฬาลงกรณ์มหาวิทยาลัย)',
    country: 'Thailand',
    countryCode: '🇹🇭',
    tagline: 'Thailand\'s oldest and most prestigious university',
    thumbnail: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400',
    heroImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600',
    overview: 'Chulalongkorn University is Thailand\'s oldest and most prestigious university, located in central Bangkok with comprehensive programs.',
    academicPrograms: [
      { icon: 'Briefcase', title: 'Business', description: 'Top business school in Thailand' },
      { icon: 'Zap', title: 'Engineering', description: 'Strong engineering programs' },
      { icon: 'Microscope', title: 'Sciences', description: 'Excellent science programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=800'],
    ranking: '#1 in Thailand, #211 globally',
    worldRanking: 211,
    generalTuition: 4500,
    visaFee: 80,
    accommodationFee: 3500,
    insuranceFee: 300,
    additionalFees: [
      { type: 'Registration Fee', amount: 200 },
      { type: 'Student Activity', amount: 150 }
    ],
    majors: ['Business', 'Engineering', 'Sciences', 'Medicine', 'Political Science']
  },

  // Malaysia - Top university
  {
    id: 'my-um-1',
    name: 'University of Malaya (UM)',
    country: 'Malaysia',
    countryCode: '🇲🇾',
    tagline: 'Malaysia\'s top research university',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600',
    overview: 'University of Malaya is Malaysia\'s oldest and highest-ranking university, located in Kuala Lumpur with strong research programs.',
    academicPrograms: [
      { icon: 'Microscope', title: 'Medicine', description: 'Top medical school in Malaysia' },
      { icon: 'Zap', title: 'Engineering', description: 'Strong engineering programs' },
      { icon: 'BookOpen', title: 'Arts & Social Sciences', description: 'Comprehensive humanities programs' },
    ],
    galleryImages: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],
    ranking: '#1 in Malaysia, #60 globally',
    worldRanking: 60,
    generalTuition: 3500,
    visaFee: 100,
    accommodationFee: 2000,
    insuranceFee: 250,
    additionalFees: [
      { type: 'Student Services', amount: 150 },
      { type: 'Activities Fee', amount: 100 }
    ],
    majors: ['Medicine', 'Engineering', 'Computer Science', 'Business', 'Arts']
  },
];
