import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApp, University } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { generateUniqueTrackingCode } from '../services/trackingCodeService';
import { createTrackingCode } from '../services/trackingCodeSqliteService';
import { getAllUniversities } from '../services/universityService';
import TBTLogo from '../components/TBTLogo';
import Statistics from '../components/Statistics';
import UniversityPartners from '../components/UniversityPartners';
import Testimonials from '../components/Testimonials';
import EnhancedFooter from '../components/EnhancedFooter';
import QuickSearchForm from '../components/QuickSearchForm';
import {
  GraduationCap,
  Phone,
  Search,
  ChevronRight,
  Calculator,
  Globe,
  Award,
  TrendingUp,
  CheckCircle2,
  Mail,
  Lock,
  UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { VISA_SYSTEMS } from '../../constants/visaSystems';

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

const VISA_SYSTEM_OPTIONS = VISA_SYSTEMS.map(system => ({
  value: system.key,
  label: system.label === system.name ? system.label : `${system.label} (${system.name})`
}));

export default function PublicOnboarding() {
  const navigate = useNavigate();
  const { universities, setUniversities, addStudentOnboarding, login } = useApp();
  const { formatFrom, convertAmount, currency } = useCurrency();
  const { language } = useLanguage();

  // NOTE: Removed SQLite reload - now uses live context data from AppContext
  useEffect(() => {
    // No-op: Uses universities from AppContext
  }, []);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSystem, setSelectedSystem] = useState('D2-2');
  const [topikLevel, setTopikLevel] = useState(0);
  const [desiredUniversity, setDesiredUniversity] = useState(() => {
    // Check URL parameter first
    const params = new URLSearchParams(window.location.search);
    const uniId = params.get('uni');

    if (uniId && universities.length > 0) {
      const found = universities.find(u => u.id === uniId);
      if (found) return uniId;
    }

    // Find first Korean university to set as default
    const firstKoreanUni = universities.find(u => u.country === 'South Korea' || u.koreanData?.isKoreanUniversity);
    return firstKoreanUni?.id || universities[0]?.id || '';
  });
  const [universitySearch, setUniversitySearch] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Handle URL-based university pre-selection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('uni')) {
      // Scroll to onboarding form if university is pre-selected via URL
      setTimeout(() => {
        document.getElementById('onboarding-form')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, []);

  // Filter universities for search - Korean only
  const searchableUniversities = useMemo(() => {
    return universities.filter(uni => {
      // Only show Korean universities
      const isKorean = uni.country === 'South Korea' || uni.koreanData?.isKoreanUniversity === true;
      if (!isKorean) return false;

      // Filter by search term
      return (
        uni.name.toLowerCase().includes(universitySearch.toLowerCase()) ||
        uni.country.toLowerCase().includes(universitySearch.toLowerCase()) ||
        uni.koreanName?.toLowerCase().includes(universitySearch.toLowerCase())
      );
    });
  }, [universities, universitySearch]);

  // Get selected university
  const selectedUni = universities.find(u => u.id === desiredUniversity);

  // Calculate initial costs dynamically
  const calculateInitialCost = () => {
    if (!selectedUni) return 0;

    let totalCost = 0;

    // Add fixed costs (keep as VND)
    if (selectedUni.fixedCosts) {
      totalCost += selectedUni.fixedCosts.reduce((sum, cost) => {
        const costInVND = convertAmount(cost.amount, 'VND', cost.currency || 'VND');
        return sum + costInVND;
      }, 0);
    }

    // Add language course if D4-1 (already in VND)
    if (selectedSystem === 'D4-1' && selectedUni.koreanData?.languageCourse?.available) {
      const languageCostVND = selectedUni.koreanData.languageCourse.priceVND || 13000000;
      totalCost += languageCostVND;
    }

    // Add system-specific costs (convert to VND)
    if (selectedUni.koreanData?.visaSystems) {
      const legacyCandidates: Record<string, string[]> = {
        'D4-1': ['D4-1'],
        'D2-1': ['D2-2'],
        'D2-2': ['D2-2'],
        'D2-3': ['D2-3'],
        'D2-3M': ['D2-3'],
        'D2-3P': ['D2-3'],
        'D2-6': ['D2-6', 'D2-3'],
        'D2-6E': ['D2-6', 'D2-2'],
        'D2-8': ['D2-6', 'D2-2']
      };

      const candidates = legacyCandidates[selectedSystem] || [selectedSystem];
      const visaSystem = selectedUni.koreanData.visaSystems.find(vs => candidates.includes(vs.visaType));

      if (visaSystem) {
        // Add tuition (convert from KRW to VND)
        if (visaSystem.tuitionPerTerm) {
          const tuitionVND = convertAmount(visaSystem.tuitionPerTerm, 'VND', 'KRW');
          totalCost += tuitionVND;
        } else if (visaSystem.tuitionRange) {
          const avgTuition = (visaSystem.tuitionRange.min + visaSystem.tuitionRange.max) / 2;
          const tuitionVND = convertAmount(avgTuition, 'VND', 'KRW');
          totalCost += tuitionVND;
        }

        // Add application fee (convert from KRW to VND)
        if (visaSystem.applicationFee) {
          const appFeeVND = convertAmount(visaSystem.applicationFee, 'VND', 'KRW');
          totalCost += appFeeVND;
        }

        // Add enrollment fee (convert from KRW to VND)
        if (visaSystem.enrollmentFee) {
          const enrollFeeVND = convertAmount(visaSystem.enrollmentFee, 'VND', 'KRW');
          totalCost += enrollFeeVND;
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    // Generate unique tracking code
    let trackingCode = '';
    try {
      trackingCode = await generateUniqueTrackingCode();
    } catch (err) {
      console.error('Failed to generate tracking code:', err);
      toast.error(language === 'vi' ? 'Lỗi tạo mã theo dõi' : 'Failed to generate tracking code');
      return;
    }

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

    // Save tracking code to SQLite database
    const savedCode = await createTrackingCode({
      code: trackingCode,
      student_email: generatedEmail,
      student_name: fullName,
      student_phone: phoneNumber,
      desired_university_id: desiredUniversity,
      desired_university_name: selectedUni?.name || '',
      visa_system: selectedSystem,
      topik_level: topikLevel.toString(),
      ielts_score: '',
      initial_total_cost_vnd: Math.round(initialCost),
      status: 'pending',
      notes: `TOPIK Level: ${topikLevel}, System: ${selectedSystem}`
    });

    if (!savedCode) {
      console.error('Failed to save tracking code');
      toast.error(language === 'vi' ? 'Lỗi lưu mã theo dõi' : 'Failed to save tracking code');
      return;
    }

    // Auto-login the user as a student with profile info
    login(generatedEmail, 'temp-password', 'student', {
      displayName: fullName,
      phone: phoneNumber,
      trackingCode: trackingCode
    });

    toast.success(language === 'vi' ? 'Đăng ký tư vấn thành công!' : language === 'ko' ? '상담 신청 완료!' : 'Consultation request submitted!');

    // Navigate to student home page
    navigate('/student/home');
  };

  const getLabel = (item: any, field: string) => {
    if (language === 'vi') return item[`${field}Vi`] || item[field];
    if (language === 'ko') return item[`${field}Kr`] || item[field];
    return item[field];
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed Position */}
      <div className="fixed top-0 left-0 right-0 w-full h-20 bg-white border-b border-[#558EFF] z-50">
        <div className="container mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
          {/* Logo/Brand */}
          <TBTLogo size="md" variant="full" />

          {/* Right Actions - Admin & Student Login */}
          <div className="flex items-center space-x-4">
            {/* Student Portal */}
            <button
              onClick={() => navigate('/student/home')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              title="Cổng thông tin học viên"
            >
              <UserCircle className="w-4 h-4" />
              <span className="text-sm font-medium font-['Be_Vietnam_Pro']">Học viên</span>
            </button>
            
            {/* Admin Login */}
            <button
              onClick={() => navigate('/admin-login')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#003AB7] text-white hover:bg-[#002A8F] transition-colors"
              title="Đăng nhập Admin"
            >
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium font-['Be_Vietnam_Pro']">Admin</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Hero Section with Background Image - Below Header */}
      <div className="relative w-full h-[600px] overflow-hidden mt-20">
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/837bae42c20ab2474078bc4c99a3b73de0e38775?width=3840" 
          alt="Hero Banner" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Quick Search Form - Conversion Feature */}
      <div className="relative -mt-48 mb-12 z-10" id="quick-search-section">
        <div className="container mx-auto px-4">
          <QuickSearchForm />
        </div>
      </div>

      {/* Registration Form Card - Centered on Page */}
      <div className="relative mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-[1366px] mx-auto">
            <div className="bg-white rounded-[30px] border border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] p-8 md:p-12">
              
              {/* Form Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-[#003AB7] mb-3 font-['Be_Vietnam_Pro']">
                  ĐĂNG KÝ TƯ VẤN DU HỌC
                </h2>
                <p className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                  Điền thông tin để nhận tư vấn chi tiết về chi phí và lộ trình du học
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] rounded-lg border border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full px-4 py-3 bg-[#F8F9FA] rounded-lg border transition-all font-['Be_Vietnam_Pro'] ${
                        phoneError ? 'border-red-500 focus:ring-red-500/50' : 'border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7]'
                      }`}
                      placeholder="+84 987 654 321 hoặc 0987654321"
                      required
                    />
                    {phoneError && (
                      <p className="text-red-500 text-xs mt-1 font-['Be_Vietnam_Pro']">{phoneError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* System Dropdown */}
                  <div>
                    <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                      Hệ visa / Chương trình
                    </label>
                    <select
                      value={selectedSystem}
                      onChange={(e) => setSelectedSystem(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] rounded-lg border border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                    >
                      {VISA_SYSTEM_OPTIONS.map(system => (
                        <option key={system.value} value={system.value}>
                          {getLabel(system, 'label')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* TOPIK Level */}
                  <div>
                    <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                      Trình độ TOPIK
                    </label>
                    <select
                      value={topikLevel}
                      onChange={(e) => setTopikLevel(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#F8F9FA] rounded-lg border border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                    >
                      {TOPIK_LEVELS.map(level => (
                        <option key={level.value} value={level.value}>
                          {getLabel(level, 'label')}
                        </option>
                      ))}
                    </select>
                    {topikLevel >= 5 && (
                      <p className="text-green-600 text-xs mt-1 flex items-center gap-1 font-['Be_Vietnam_Pro']">
                        <CheckCircle2 className="w-3 h-3" />
                        {language === 'vi' ? `Đủ điều kiện giảm ${topikLevel === 5 ? '40%' : '50%'} học phí!` : language === 'ko' ? `${topikLevel === 5 ? '40%' : '50%'} 장학금 자격!` : `Eligible for ${topikLevel === 5 ? '40%' : '50%'} scholarship!`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Desired University */}
                <div>
                  <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                    Trường mong muốn
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={universitySearch}
                      onChange={(e) => setUniversitySearch(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F9FA] rounded-lg border border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                      placeholder="Tìm kiếm trường..."
                    />
                    {universitySearch && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-[#558EFF] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {searchableUniversities.slice(0, 10).map(uni => (
                          <button
                            key={uni.id}
                            type="button"
                            onClick={() => {
                              setDesiredUniversity(uni.id);
                              setUniversitySearch('');
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-[#F8F9FA] transition-colors border-b border-[#558EFF]/20 last:border-0 font-['Be_Vietnam_Pro']"
                          >
                            <div className="font-bold text-[#003AB7]">{uni.name}</div>
                            <div className="text-xs text-[#4D4D4D]">{uni.country} • {uni.ranking}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected University Display */}
                  {selectedUni && (
                    <div className="mt-3 p-4 bg-[#F8F9FA] rounded-lg border border-[#558EFF]">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#003AB7] to-[#558EFF] rounded-lg flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">{selectedUni.name}</h4>
                          <p className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">{selectedUni.country} • {selectedUni.ranking}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white py-4 rounded-xl hover:from-[#002A8F] hover:to-[#447DFF] transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-['Be_Vietnam_Pro']"
                >
                  <TrendingUp className="w-5 h-5" />
                  Tra Cứu Chi Tiết
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* University Showcase Section */}
      <div className="mb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#003AB7] mb-3 font-['Be_Vietnam_Pro']">
              TRƯỜNG TOP VISA TẠI HÀN QUỐC
            </h2>
            <p className="text-sm text-[#4D4D4D] font-['Be_Vietnam_Pro']">
              Các trường đại học phổ biến được học viên Việt Nam lựa chọn
            </p>
          </div>

          {/* University Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {searchableUniversities.slice(0, 9).map((uni, index) => (
              <div 
                key={uni.id}
                className="bg-white rounded-[20px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => {
                  setDesiredUniversity(uni.id);
                  document.getElementById('onboarding-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {/* University Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-[#003AB7] to-[#558EFF] flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-white opacity-50" />
                </div>
                
                {/* University Info */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    } font-['Be_Vietnam_Pro']`}>
                      {index === 0 ? 'TOP 1' : index === 1 ? 'TOP 2' : index === 2 ? 'TOP 3' : `TOP ${index + 1}`}
                    </span>
                    <span className="text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">Seoul</span>
                  </div>
                  
                  <h3 className="font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro'] line-clamp-2">
                    {uni.name}
                  </h3>
                  
                  <p className="text-xs text-[#4D4D4D] mb-4 font-['Be_Vietnam_Pro']">
                    {uni.country} • {uni.ranking}
                  </p>
                  
                  <button className="w-full bg-[#F8F9FA] text-[#003AB7] py-2 rounded-lg hover:bg-[#003AB7] hover:text-white transition-all font-bold text-sm font-['Be_Vietnam_Pro'] group-hover:bg-[#003AB7] group-hover:text-white">
                    Tìm hiểu thêm
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <Statistics />

      {/* University Partners Section */}
      <UniversityPartners />

      {/* Testimonials Section */}
      <Testimonials />

      {/* Tracking Lookup Link */}
      <div className="container mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-[#F8F9FA] to-blue-50 rounded-xl p-6 text-center border border-[#558EFF]/30">
          <h3 className="text-lg font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro']">
            Đã đăng ký tư vấn?
          </h3>
          <p className="text-sm text-[#4D4D4D] mb-4">
            Nhập mã tra cứu để xem tiến độ hồ sơ và thông tin chi tiết
          </p>
          <button
            onClick={() => navigate('/student/tracking')}
            className="bg-[#003AB7] hover:bg-[#002A8F] text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Tra cứu hồ sơ →
          </button>
        </div>
      </div>

      {/* Enhanced Footer */}
      <EnhancedFooter />
    </div>
  );
}


