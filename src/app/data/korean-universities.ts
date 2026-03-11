import { University } from '../context/AppContext';

// Korean Universities Data - Based on CSV imports
export const koreanUniversities: University[] = [
  {
    id: 'kr-ajou-1',
    name: 'ĐẠI HỌC AJOU (아주대학교)',
    country: 'South Korea',
    countryCode: '🇰🇷',
    tagline: 'Top 15 university in South Korea with strong engineering and IT programs',
    thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    heroImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600',
    overview: 'Ajou University is one of the leading universities in South Korea, ranked 15th out of 200 universities nationwide. Located in Suwon, Gyeonggi-do, Ajou offers comprehensive programs across engineering, IT, communications, natural sciences, business, law, humanities, and cybersecurity. The university provides strong support for international students with airport pickup services, foreign resident card assistance, and SIM card setup.',
    academicPrograms: [
      { icon: 'Cpu', title: 'Engineering & IT', description: 'Top programs in Engineering, Information Technology, and Communications' },
      { icon: 'Microscope', title: 'Natural Sciences', description: 'Strong research programs in natural sciences and applied sciences' },
      { icon: 'Briefcase', title: 'Business & Law', description: 'Comprehensive programs in Business Management and Law' },
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
      'https://images.unsplash.com/photo-1562774053-701939374585?w=800',
    ],
    ranking: 'Ranked 15/200 universities in South Korea',
    worldRanking: 550,
    
    // Traditional costs (will be overridden by Korean system)
    generalTuition: 0,
    visaFee: 0,
    accommodationFee: 0,
    insuranceFee: 0,
    additionalFees: [],
    
    // Fixed costs that apply to ALL students (always added - from Ajou sheet)
    fixedCosts: [
      { 
        type: 'Phí tư vấn (Consulting Fee)', 
        amount: 39000000, 
        currency: 'VND', 
        category: 'fixed',
        description: 'Chi phí tư vấn định hướng du học, hỗ trợ chọn trường và ngành học phù hợp với năng lực và nguyện vọng'
      },
      { 
        type: 'Phí môi giới (Agency Fees)', 
        amount: 11000000, 
        currency: 'VND', 
        category: 'fixed',
        description: 'Phí dịch vụ môi giới xử lý hồ sơ, liên lạc với trường, và hỗ trợ toàn bộ quá trình apply'
      },
      { 
        type: 'Khóa học tiếng Hàn (Korean Language Course)', 
        amount: 13000000, 
        currency: 'VND', 
        category: 'fixed',
        description: 'Chi phí khóa học tiếng Hàn cơ bản tại Việt Nam trước khi sang Hàn Quốc (4-6 tháng)'
      },
      { 
        type: 'Phí apply (Application Fee)', 
        amount: 100000, 
        currency: 'KRW', 
        category: 'fixed',
        description: 'Lệ phí nộp hồ sơ đăng ký nhập học do trường yêu cầu, không hoàn lại'
      },
      { 
        type: 'Phí hóa đơn (Invoice / Enrollment Fee)', 
        amount: 5800000, 
        currency: 'KRW', 
        category: 'fixed',
        description: 'Phí nhập học và xử lý hóa đơn học phí, bao gồm các thủ tục hành chính ban đầu'
      },
      { 
        type: 'Tài khoản tiết kiệm (Savings Account)', 
        amount: 10000000, 
        currency: 'KRW', 
        category: 'fixed',
        description: 'Tài khoản tiết kiệm bắt buộc để chứng minh tài chính khi xin visa (10M KRW)'
      },
    ],
    
    // Korean-specific data
    koreanData: {
      isKoreanUniversity: true,
      address: '206 Woldeukeom-ro, Woncheon-dong, Yeongtong-gu, Suwon, Gyeonggi-do, South Korea',
      topVisa: 'Top 2',
      koreanRanking: '15/200 trường đại học tại Hàn Quốc',
      
      // Visa system costs
      visaSystems: [
        {
          visaType: 'D4-1',
          tuitionPerTerm: 1450000,
          applicationFee: 100000,
          baseYearlyFee: 5800000,
          description: 'Chương trình tiếng Hàn (Korean Language Program)'
        },
        {
          visaType: 'D2-2',
          tuitionRange: { min: 3736000, max: 4845000 },
          applicationFee: 150000,
          baseYearlyFee: 5800000,
          description: 'Chương trình đại học (Undergraduate Program)'
        },
        {
          visaType: 'D2-3',
          tuitionRange: { min: 2600000, max: 4038000 },
          enrollmentFee: 900000,
          baseYearlyFee: 5800000,
          description: 'Chương trình sau đại học (Graduate Program)'
        }
      ],
      
      // Major categories
      majorCategories: [
        { 
          category: 'Thế mạnh (Strong Programs)', 
          subjects: ['Kỹ thuật (Engineering)', 'IT', 'Truyền thông (Communications)', 'Y học (Medicine - không nhận SV quốc tế)', 'Khoa học tự nhiên (Natural Sciences)'] 
        },
        { 
          category: 'Khác (Other Programs)', 
          subjects: ['QTKD (Business Management)', 'Luật (Law)', 'Nhân văn (Humanities)', 'Xã hội (Social Sciences)', 'An ninh mạng (Cybersecurity)'] 
        }
      ],
      
      // Scholarships
      scholarships: [
        { visaType: 'D4-1', description: 'Giảm 50-100% học phí cho SV xuất sắc hoặc gia đình Ajou' },
        { visaType: 'D2-2', description: 'Giảm 30-100% dựa trên TOPIK (3-6) hoặc IELTS (5.5-8.5)' },
        { visaType: 'D2-3', description: 'Giảm 40% (Thạc sĩ), 80% (Tiến sĩ) nếu có TOPIK 5+' }
      ],
      
      // Admission requirements
      admissionRequirements: [
        { visaType: 'D4-1', requirement: 'GPA ≥ 7.0, trống < 2 năm' },
        { visaType: 'D2-2', requirement: 'GPA ≥ 6.5, không giới hạn năm trống' },
        { visaType: 'D2-3', requirement: 'GPA ≥ 6.5, không giới hạn năm trống' }
      ],
      
      // Financial requirements
      financialRequirements: [
        { visaType: 'D4-1', requirement: 'Sổ 10,000 USD lùi 6 tháng' },
        { visaType: 'D2-2', requirement: 'Sổ 20,000,000 KRW lùi 3 tháng' },
        { visaType: 'D2-3', requirement: 'Sổ 20,000,000 KRW lùi 3 tháng' }
      ],
      
      // Dorm options in Korea
      dormOptions: [
        { type: 'Phòng 4 người (4-person room)', priceKRW: 747000 },
        { type: 'Phòng 2 người (2-person room)', priceKRW: 1102000 },
        { type: 'Phòng 2 người Quốc tế (International 2-person)', priceKRW: 1440000 }
      ],
      
      // Language course
      languageCourse: {
        available: true,
        priceVND: 13000000
      },
      
      // Student support services
      studentSupport: [
        'Hỗ trợ đón sinh viên Việt Nam tại sân bay về trường',
        'Hỗ trợ làm CCCD người nước ngoài',
        'Hỗ trợ thẻ SIM',
        'Chuyển đổi visa lên chuyên ngành',
        'Chính sách hoàn tiền linh hoạt'
      ],
      
      // Job opportunities
      jobOpportunities: 'Khu trung tâm, nhiều quán ăn (cách 10\' bus). Công việc: Nhà hàng, cửa hàng tiện lợi, dọn dẹp...'
    },
    
    // Optional add-ons
    optionalAddons: [
      {
        id: 'dorm-vn',
        name: 'Dormitory in Vietnam (Monthly)',
        nameVi: 'KTX tại Việt Nam (tháng)',
        nameKr: '베트남 기숙사 (월)',
        type: 'dorm-vn',
        amount: 800000,
        perMonth: true,
        selectable: true,
        requiresInput: true,
        options: [
          { label: '1 tháng', value: 800000 },
          { label: '2 tháng', value: 1600000 },
          { label: '3 tháng', value: 2400000 },
          { label: '4 tháng', value: 3200000 },
          { label: '5 tháng', value: 4000000 },
          { label: '6 tháng', value: 4800000 }
        ]
      },
      {
        id: 'dorm-kr',
        name: 'KTX Korea (Dormitory)',
        nameVi: 'KTX Hàn Quốc (Ký túc xá)',
        nameKr: 'KTX 한국 (기숙사)',
        type: 'dorm-kr',
        amount: 747000,
        selectable: true,
        requiresInput: true,
        options: [
          { label: 'Phòng 4 người (4-person) - 747K KRW', value: 747000 },
          { label: 'Phòng 2 người (2-person) - 1.1M KRW', value: 1102000 },
          { label: 'Phòng 2 người Quốc tế (Intl 2-person) - 1.44M KRW', value: 1440000 }
        ]
      },
      {
        id: 'savings-account',
        name: 'Savings Account Options',
        nameVi: 'Tùy chọn tài khoản tiết kiệm',
        nameKr: '저축 계좌 옵션',
        type: 'savings',
        amount: 10000000,
        selectable: true,
        requiresInput: true,
        options: [
          { label: '8M KRW (Minimum)', value: 8000000 },
          { label: '10M KRW (Standard)', value: 10000000 }
        ]
      },
      {
        id: 'flight-ticket',
        name: 'Flight Ticket',
        nameVi: 'Vé máy bay',
        nameKr: '항공권',
        type: 'flight',
        amountRange: { min: 8000000, max: 12000000 },
        amount: 10000000,
        selectable: true,
        requiresInput: true
      },
      {
        id: 'scholarship-topik',
        name: 'TOPIK Scholarship',
        nameVi: 'Học bổng TOPIK',
        nameKr: 'TOPIK 장학금',
        type: 'scholarship',
        percentage: 50,
        selectable: true,
        requiresInput: true,
        conditional: 'Dựa trên điểm TOPIK 3-6',
        options: [
          { label: 'TOPIK 3 → Giảm 30%', value: 30 },
          { label: 'TOPIK 4 → Giảm 50%', value: 50 },
          { label: 'TOPIK 5 → Giảm 70%', value: 70 },
          { label: 'TOPIK 6 → Giảm 100%', value: 100 }
        ]
      },
      {
        id: 'scholarship-ielts',
        name: 'IELTS Scholarship',
        nameVi: 'Học bổng IELTS',
        nameKr: 'IELTS 장학금',
        type: 'scholarship',
        percentage: 30,
        selectable: true,
        requiresInput: true,
        conditional: 'Dựa trên điểm IELTS 5.5-8.5',
        options: [
          { label: 'IELTS 5.5 → Giảm 30%', value: 30 },
          { label: 'IELTS 6.5 → Giảm 50%', value: 50 },
          { label: 'IELTS 7.5 → Giảm 70%', value: 70 },
          { label: 'IELTS 8.5+ → Giảm 100%', value: 100 }
        ]
      }
    ],
    
    majors: ['Engineering', 'IT', 'Communications', 'Natural Sciences', 'Business Management', 'Law', 'Humanities', 'Social Sciences', 'Cybersecurity']
  }
];