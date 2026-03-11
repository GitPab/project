import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp, University } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import {
  GraduationCap,
  Phone,
  User,
  Search,
  ChevronRight,
  Calculator,
  Globe,
  Award,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  PhoneCall,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

// Visa system options
const VISA_SYSTEMS = [
  { value: 'D4-1', label: 'D4-1 (Language Course)', labelVi: 'D4-1 (Khóa học tiếng Hàn)', labelKr: 'D4-1 (한국어 과정)' },
  { value: 'D2-1', label: 'D2-1 (Pre-Undergraduate)', labelVi: 'D2-1 (Tiền đại học)', labelKr: 'D2-1 (학부 예비과정)' },
  { value: 'D2-2', label: 'D2-2 (Undergraduate)', labelVi: 'D2-2 (Đại học)', labelKr: 'D2-2 (학부)' },
  { value: 'D2-3', label: 'D2-3 (Graduate)', labelVi: 'D2-3 (Sau đại học)', labelKr: 'D2-3 (대학원)' },
  { value: 'D2-6', label: 'D2-6 (Advanced)', labelVi: 'D2-6 (Nâng cao)', labelKr: 'D2-6 (고급)' },
];

// TOPIK level options
const TOPIK_LEVELS = [
  { value: 0, label: 'TOPIK 0 (No certification)', labelVi: 'TOPIK 0 (Chưa có chứng chỉ)', labelKr: 'TOPIK 0 (자격증 없음)' },
  { value: 1, label: 'TOPIK 1', labelVi: 'TOPIK 1', labelKr: 'TOPIK 1' },
  { value: 2, label: 'TOPIK 2', labelVi: 'TOPIK 2', labelKr: 'TOPIK 2' },
  { value: 3, label: 'TOPIK 3', labelVi: 'TOPIK 3', labelKr: 'TOPIK 3' },
  { value: 4, label: 'TOPIK 4', labelVi: 'TOPIK 4', labelKr: 'TOPIK 4' },
  { value: 5, label: 'TOPIK 5 (40% scholarship)', labelVi: 'TOPIK 5 (Giảm 40% học phí)', labelKr: 'TOPIK 5 (40% 장학금)' },
  { value: 6, label: 'TOPIK 6 (50% scholarship)', labelVi: 'TOPIK 6 (Giảm 50% học phí)', labelKr: 'TOPIK 6 (50% 장학금)' },
];

// Featured recommended universities
const FEATURED_UNIVERSITIES = [
  { id: 'kr-ajou-1', icon: '🏛️', strength: 'Engineering & IT', strengthVi: 'Kỹ thuật & CNTT', strengthKr: '공학 및 IT' },
  { id: 'kr-kaist-1', icon: '🔬', strength: 'Science & Tech', strengthVi: 'Khoa học & Công nghệ', strengthKr: '과학 및 기술' },
  { id: 'kr-snu-1', icon: '🎓', strength: 'Business & Law', strengthVi: 'Kinh doanh & Luật', strengthKr: '경영 및 법' },
  { id: 'jp-tokyo-1', icon: '🗾', strength: 'Research Excellence', strengthVi: 'Nghiên cứu xuất sắc', strengthKr: '연구 우수성' },
  { id: 'sg-nus-1', icon: '🌏', strength: 'International Hub', strengthVi: 'Trung tâm quốc tế', strengthKr: '국제 허브' },
  { id: 'cn-tsinghua-1', icon: '🏯', strength: 'Innovation Leader', strengthVi: 'Tiên phong đổi mới', strengthKr: '혁신 리더' },
];

export default function PublicOnboarding() {
  const navigate = useNavigate();
  const { universities, addStudentOnboarding, login } = useApp();
  const { formatFrom, convertAmount, currency } = useCurrency();
  const { language } = useLanguage();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('D2-2');
  const [topikLevel, setTopikLevel] = useState(0);
  const [desiredUniversity, setDesiredUniversity] = useState('kr-ajou-1');
  const [universitySearch, setUniversitySearch] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Filter universities for search
  const searchableUniversities = useMemo(() => {
    return universities.filter(uni => 
      uni.name.toLowerCase().includes(universitySearch.toLowerCase()) ||
      uni.country.toLowerCase().includes(universitySearch.toLowerCase())
    );
  }, [universities, universitySearch]);

  // Get selected university
  const selectedUni = universities.find(u => u.id === desiredUniversity);

  // Calculate initial costs dynamically
  const calculateInitialCost = () => {
    if (!selectedUni) return 0;

    let totalCost = 0;

    // Add fixed costs
    if (selectedUni.fixedCosts) {
      totalCost += selectedUni.fixedCosts.reduce((sum, cost) => {
        const costInUSD = convertAmount(cost.amount, 'USD', cost.currency || 'VND');
        return sum + costInUSD;
      }, 0);
    }

    // Add language course if D4-1
    if (selectedSystem === 'D4-1' && selectedUni.koreanData?.languageCourse?.available) {
      const languageCostVND = selectedUni.koreanData.languageCourse.priceVND || 13000000;
      const languageCostUSD = convertAmount(languageCostVND, 'USD', 'VND');
      totalCost += languageCostUSD;
    }

    // Add system-specific costs
    if (selectedUni.koreanData?.visaSystems) {
      const visaSystem = selectedUni.koreanData.visaSystems.find(vs => {
        if (selectedSystem === 'D4-1') return vs.visaType === 'D4-1';
        if (selectedSystem === 'D2-1' || selectedSystem === 'D2-2') return vs.visaType === 'D2-2';
        if (selectedSystem === 'D2-3' || selectedSystem === 'D2-6') return vs.visaType === 'D2-3';
        return false;
      });

      if (visaSystem) {
        // Add tuition
        if (visaSystem.tuitionPerTerm) {
          const tuitionUSD = convertAmount(visaSystem.tuitionPerTerm, 'USD', 'KRW');
          totalCost += tuitionUSD;
        } else if (visaSystem.tuitionRange) {
          const avgTuition = (visaSystem.tuitionRange.min + visaSystem.tuitionRange.max) / 2;
          const tuitionUSD = convertAmount(avgTuition, 'USD', 'KRW');
          totalCost += tuitionUSD;
        }

        // Add application fee
        if (visaSystem.applicationFee) {
          const appFeeUSD = convertAmount(visaSystem.applicationFee, 'USD', 'KRW');
          totalCost += appFeeUSD;
        }

        // Add enrollment fee
        if (visaSystem.enrollmentFee) {
          const enrollFeeUSD = convertAmount(visaSystem.enrollmentFee, 'USD', 'KRW');
          totalCost += enrollFeeUSD;
        }
      }
    }

    // Apply TOPIK scholarship discount
    if (topikLevel === 5) {
      totalCost *= 0.6; // 40% discount
    } else if (topikLevel === 6) {
      totalCost *= 0.5; // 50% discount
    }

    return totalCost;
  };

  const initialCost = calculateInitialCost();

  // Validate Vietnamese phone number
  const validatePhone = (phone: string): boolean => {
    // Remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, '');
    
    // Check if it starts with +84 or 0 and has 10 digits total (excluding country code)
    const vietnamesePattern = /^(\+84|84|0)[0-9]{9}$/;
    
    return vietnamesePattern.test(cleanPhone);
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    
    if (value && !validatePhone(value)) {
      setPhoneError(language === 'vi' ? 'Số điện thoại không hợp lệ' : language === 'ko' ? '유효하지 않은 전화번호' : 'Invalid phone number');
    } else {
      setPhoneError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!fullName.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập họ tên' : language === 'ko' ? '이름을 입력하세요' : 'Please enter your name');
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error(language === 'vi' ? 'Vui lòng nhập số điện thoại' : language === 'ko' ? '전화번호를 입력하세요' : 'Please enter your phone number');
      return;
    }

    if (!validatePhone(phoneNumber)) {
      toast.error(language === 'vi' ? 'Số điện thoại không hợp lệ' : language === 'ko' ? '유효하지 않은 전화번호' : 'Invalid phone number');
      return;
    }

    // Generate email from name
    const generatedEmail = `${fullName.toLowerCase().replace(/\s+/g, '')}@student.temp`;

    // Save onboarding data
    addStudentOnboarding({
      name: fullName,
      phone: phoneNumber,
      email: generatedEmail,
      desiredUniversity,
      visaSystem: selectedSystem,
      topikLevel: topikLevel.toString(),
      ieltsScore: '',
      initialTotalCost: initialCost,
      notes: `TOPIK Level: ${topikLevel}, System: ${selectedSystem}`
    });

    // Auto-login the user as a student
    login(generatedEmail, 'temp-password', 'student');

    toast.success(language === 'vi' ? 'Đăng ký tư vấn thành công!' : language === 'ko' ? '상담 신청 완료!' : 'Consultation request submitted!');

    // Navigate to university detail page
    navigate(`/student/university/${desiredUniversity}`);
  };

  const getLabel = (item: any, field: string) => {
    if (language === 'vi') return item[`${field}Vi`] || item[field];
    if (language === 'ko') return item[`${field}Kr`] || item[field];
    return item[field];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Marketing Banner */}
      <div className="relative w-full bg-gradient-to-r from-primary to-blue-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Award className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {language === 'vi' ? '🇰🇷 Du Học Hàn Quốc - Cơ Hội Vàng!' : language === 'ko' ? '🇰🇷 한국 유학 - 황금 기회!' : '🇰🇷 Study in Korea - Golden Opportunity!'}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">
                {language === 'vi' ? 'Du Học Châu Á - Tương Lai Của Bạn Bắt Đầu Tại Đây!' : language === 'ko' ? '아시아 유학 - 당신의 미래는 여기서 시작됩니다!' : 'Study in Asia - Your Future Starts Here!'}
              </h1>
              <p className="text-lg text-blue-100 mb-4">
                {language === 'vi' ? 'Ajou University & 50+ trường hàng đầu Châu Á' : language === 'ko' ? 'Ajou 대학교 및 아시아 상위 50개 이상의 대학' : 'Ajou University & 50+ Top Asian Universities'}
              </p>
              <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start text-sm">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  <span className="font-semibold">0123-456-789</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>contact@duhoc.vn</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('onboarding-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <PhoneCall className="w-5 h-5" />
              {language === 'vi' ? 'Tư Vấn Miễn Phí' : language === 'ko' ? '무료 상담' : 'Free Consultation'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Main Form Section */}
          <div id="onboarding-form" className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-10 mb-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-blue-700 rounded-2xl mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {language === 'vi' ? 'Đăng Ký Tư Vấn Du Học' : language === 'ko' ? '유학 상담 신청' : 'Register for Study Abroad Consultation'}
              </h2>
              <p className="text-slate-600">
                {language === 'vi' ? 'Điền thông tin để nhận tư vấn chi tiết về chi phí và lộ trình du học' : language === 'ko' ? '비용 및 유학 과정에 대한 자세한 상담을 받으려면 정보를 입력하세요' : 'Fill in your information to receive detailed consultation on costs and study abroad roadmap'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700">
                    <User className="w-4 h-4 inline mr-2" />
                    {language === 'vi' ? 'Họ và tên' : language === 'ko' ? '이름' : 'Full Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder={language === 'vi' ? 'Nguyễn Văn A' : language === 'ko' ? '홍길동' : 'John Doe'}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700">
                    <Phone className="w-4 h-4 inline mr-2" />
                    {language === 'vi' ? 'Số điện thoại' : language === 'ko' ? '전화번호' : 'Phone Number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-50 rounded-lg border transition-all ${
                      phoneError ? 'border-red-500 focus:ring-red-500/50' : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
                    }`}
                    placeholder="+84 987 654 321 hoặc 0987654321"
                    required
                  />
                  {phoneError && (
                    <p className="text-red-500 text-xs mt-1">{phoneError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Dropdown */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700">
                    <Globe className="w-4 h-4 inline mr-2" />
                    {language === 'vi' ? 'Hệ visa / Chương trình' : language === 'ko' ? '비자 시스템 / 프로그램' : 'Visa System / Program'}
                  </label>
                  <select
                    value={selectedSystem}
                    onChange={(e) => setSelectedSystem(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    {VISA_SYSTEMS.map(system => (
                      <option key={system.value} value={system.value}>
                        {getLabel(system, 'label')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* TOPIK Level */}
                <div>
                  <label className="block mb-2 text-sm font-semibold text-slate-700">
                    <Award className="w-4 h-4 inline mr-2" />
                    {language === 'vi' ? 'Trình độ TOPIK' : language === 'ko' ? 'TOPIK 레벨' : 'TOPIK Level'}
                  </label>
                  <select
                    value={topikLevel}
                    onChange={(e) => setTopikLevel(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  >
                    {TOPIK_LEVELS.map(level => (
                      <option key={level.value} value={level.value}>
                        {getLabel(level, 'label')}
                      </option>
                    ))}
                  </select>
                  {topikLevel >= 5 && (
                    <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {language === 'vi' ? `Đủ điều kiện giảm ${topikLevel === 5 ? '40%' : '50%'} học phí!` : language === 'ko' ? `${topikLevel === 5 ? '40%' : '50%'} 장학금 자격!` : `Eligible for ${topikLevel === 5 ? '40%' : '50%'} scholarship!`}
                    </p>
                  )}
                </div>
              </div>

              {/* Desired University */}
              <div>
                <label className="block mb-2 text-sm font-semibold text-slate-700">
                  <Search className="w-4 h-4 inline mr-2" />
                  {language === 'vi' ? 'Trường mong muốn' : language === 'ko' ? '희망 대학' : 'Desired University'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={universitySearch}
                    onChange={(e) => setUniversitySearch(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    placeholder={language === 'vi' ? 'Tìm kiếm trường...' : language === 'ko' ? '대학 검색...' : 'Search university...'}
                  />
                  {universitySearch && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      {searchableUniversities.slice(0, 10).map(uni => (
                        <button
                          key={uni.id}
                          type="button"
                          onClick={() => {
                            setDesiredUniversity(uni.id);
                            setUniversitySearch('');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
                        >
                          <div className="font-semibold text-slate-900">{uni.name}</div>
                          <div className="text-xs text-slate-600">{uni.country} • {uni.ranking}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected University Display */}
                {selectedUni && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900">{selectedUni.name}</h4>
                        <p className="text-sm text-slate-600">{selectedUni.country} • {selectedUni.ranking}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Initial Costs Section */}
              {initialCost > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-lg font-bold text-emerald-900">
                      {language === 'vi' ? 'Chi Phí Ước Tính Ban Đầu' : language === 'ko' ? '초기 예상 비용' : 'Initial Estimated Costs'}
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Common Costs */}
                    {selectedSystem === 'D4-1' && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-700">
                          {language === 'vi' ? '📚 Khóa học tiếng Hàn' : language === 'ko' ? '📚 한국어 코스' : '📚 Korean Language Course'}
                        </span>
                        <span className="font-semibold text-slate-900">~13,000,000 VND</span>
                      </div>
                    )}
                    
                    {/* System Costs */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">
                        {language === 'vi' ? '🎓 Chi phí hệ thống' : language === 'ko' ? '🎓 시스템 비용' : '🎓 System Costs'}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {selectedSystem === 'D2-2' ? (language === 'vi' ? 'Học phí đại học' : language === 'ko' ? '학부 등록금' : 'Undergraduate Tuition') : 
                         selectedSystem === 'D2-3' ? (language === 'vi' ? 'Học phí sau đại học' : language === 'ko' ? '대학원 등록금' : 'Graduate Tuition') :
                         (language === 'vi' ? 'Học phí khóa học' : language === 'ko' ? '과정 수업료' : 'Course Tuition')}
                      </span>
                    </div>

                    {/* Scholarship Discount */}
                    {topikLevel >= 5 && (
                      <div className="flex justify-between items-center text-sm text-green-700">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {language === 'vi' ? `Học bổng TOPIK ${topikLevel}` : language === 'ko' ? `TOPIK ${topikLevel} 장학금` : `TOPIK ${topikLevel} Scholarship`}
                        </span>
                        <span className="font-semibold">-{topikLevel === 5 ? '40%' : '50%'}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-emerald-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-900">
                          {language === 'vi' ? 'Tổng Chi Phí Ban Đầu:' : language === 'ko' ? '초기 총 비용:' : 'Initial Total Cost:'}
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-700">
                            {formatFrom(initialCost, 'USD')}
                          </div>
                          {currency !== 'VND' && (
                            <div className="text-xs text-emerald-600">
                              ≈ {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(convertAmount(initialCost, 'VND', 'USD'))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 italic">
                    {language === 'vi' ? '* Chưa bao gồm chi phí bổ sung (KTX, vé máy bay, v.v.). Xem chi tiết đầy đủ sau khi Tra Cứu.' : 
                     language === 'ko' ? '* 추가 비용(기숙사, 항공권 등) 미포함. 조회 후 전체 세부정보를 확인하세요.' : 
                     '* Does not include additional costs (dorm, flight, etc.). See full details after查询.'}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                {language === 'vi' ? 'Tra Cứu Chi Tiết' : language === 'ko' ? '세부 정보 조회' : 'View Full Details'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* Recommended Universities Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {language === 'vi' ? '🌟 Gợi Ý Trường Hàng Đầu' : language === 'ko' ? '🌟 추천 상위 대학' : '🌟 Recommended Top Universities'}
              </h3>
              <p className="text-slate-600">
                {language === 'vi' ? 'Các trường đại học phổ biến được học viên Việt Nam lựa chọn' : language === 'ko' ? '베트남 학생들이 선택하는 인기 대학' : 'Popular universities chosen by Vietnamese students'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURED_UNIVERSITIES.map(featured => {
                const uni = universities.find(u => u.id === featured.id);
                if (!uni) return null;

                return (
                  <button
                    key={uni.id}
                    onClick={() => {
                      setDesiredUniversity(uni.id);
                      document.getElementById('onboarding-form')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-left p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border-2 border-slate-200 hover:border-primary hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">{featured.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                          {uni.name}
                        </h4>
                        <p className="text-xs text-slate-600">{uni.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold">
                        {getLabel(featured, 'strength')}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>🏆 {uni.ranking}</span>
                      <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Admin Access Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-slate-500 hover:text-primary transition-colors underline"
            >
              {language === 'vi' ? '🔐 Truy cập quản trị viên / sinh viên' : language === 'ko' ? '🔐 관리자 / 학생 액세스' : '🔐 Admin / Student Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}