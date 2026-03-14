import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp, University } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import TBTLogo from '../components/TBTLogo';
import Statistics from '../components/Statistics';
import UniversityPartners from '../components/UniversityPartners';
import Testimonials from '../components/Testimonials';
import EnhancedFooter from '../components/EnhancedFooter';
import StudentInfoCard from '../components/StudentInfoCard';
import {
  GraduationCap,
  Search,
  MapPin,
  Users,
  BookOpen,
  Globe,
  TrendingUp,
  Award
} from 'lucide-react';

export default function UniversityInfo() {
  const navigate = useNavigate();
  const { universities } = useApp();
  const { language } = useLanguage();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Filter universities - Korean only
  const koreanUniversities = useMemo(() => {
    return universities.filter(uni => {
      const isKorean = uni.country === 'South Korea' || uni.koreanData?.isKoreanUniversity === true;
      if (!isKorean) return false;

      // Filter by search term
      const matchesSearch = uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          uni.koreanName?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter by region
      const matchesRegion = selectedRegion === 'all' || 
                           (selectedRegion === 'seoul' && uni.name.toLowerCase().includes('seoul')) ||
                           (selectedRegion === 'busan' && uni.name.toLowerCase().includes('busan'));

      return matchesSearch && matchesRegion;
    });
  }, [universities, searchTerm, selectedRegion]);

  const regions = [
    { value: 'all', label: 'Tất cả khu vực', labelEn: 'All Regions', labelKr: '모든 지역' },
    { value: 'seoul', label: 'Seoul', labelEn: 'Seoul', labelKr: '서울' },
    { value: 'busan', label: 'Busan', labelEn: 'Busan', labelKr: '부산' },
  ];

  const getLabel = (item: any, field: string) => {
    if (language === 'vi') return item[`${field}Vi`] || item[field];
    if (language === 'ko') return item[`${field}Kr`] || item[field];
    return item[field];
  };

  const getTopBadge = (index: number) => {
    if (index === 0) return { text: 'TOP 1', class: 'bg-yellow-100 text-yellow-800' };
    if (index === 1) return { text: 'TOP 2', class: 'bg-gray-100 text-gray-800' };
    if (index === 2) return { text: 'TOP 3', class: 'bg-orange-100 text-orange-800' };
    return { text: `TOP ${index + 1}`, class: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed Position */}
      <div className="fixed top-0 left-0 right-0 w-full h-20 bg-white border-b border-[#558EFF] z-50">
        <div className="container mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
          {/* Logo/Brand */}
          <TBTLogo size="md" variant="full" />

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors border border-[#558EFF]">
                <Globe className="w-5 h-5 text-[#003AB7]" />
                <span className="text-sm font-medium text-[#003AB7] font-['Be_Vietnam_Pro']">
                  🇻🇳 VI
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Section with Background Image - Below Header */}
      <div className="relative w-full h-[313px] overflow-hidden mt-20">
        <img 
          src="https://api.builder.io/api/v1/image/assets/TEMP/309457b4b560197b4a34a7cc59dac89fd8175825?width=3840" 
          alt="University Information" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#003AB7]/80"></div>
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 font-['Be_Vietnam_Pro']">
              Thông tin trường
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Search and Filter Section */}
          <div className="bg-white rounded-[20px] border border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] p-6 md:p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Bar */}
              <div>
                <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                  Tìm kiếm trường
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#558EFF] w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#F8F9FA] rounded-lg border border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                    placeholder="Nhập tên trường..."
                  />
                </div>
              </div>

              {/* Region Filter */}
              <div>
                <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                  Khu vực
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F9FA] rounded-lg border border-[#558EFF] focus:outline-none focus:ring-2 focus:ring-[#558EFF]/50 focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                >
                  {regions.map(region => (
                    <option key={region.value} value={region.value}>
                      {getLabel(region, 'label')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* University Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {koreanUniversities.slice(0, 6).map((uni, index) => {
              const topBadge = getTopBadge(index);
              return (
                <div 
                  key={uni.id}
                  className="bg-white rounded-[20px] border border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/university/${uni.id}`)}
                >
                  {/* University Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-[#003AB7] to-[#558EFF] flex items-center justify-center relative">
                    <GraduationCap className="w-16 h-16 text-white opacity-50" />
                    <div className="absolute top-4 right-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${topBadge.class} font-['Be_Vietnam_Pro']`}>
                        {topBadge.text}
                      </span>
                    </div>
                  </div>
                  
                  {/* University Info */}
                  <div className="p-6">
                    <h3 className="font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro'] text-lg line-clamp-2">
                      {uni.name}
                    </h3>
                    
                    <p className="text-sm text-[#4D4D4D] mb-4 font-['Be_Vietnam_Pro'] line-clamp-2">
                      {uni.koreanName && `${uni.koreanName} • `}
                      {uni.country}
                    </p>
                    
                    {/* University Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                        <MapPin className="w-3 h-3" />
                        <span>Seoul</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                        <Users className="w-3 h-3" />
                        <span>15,000+ SV</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                        <BookOpen className="w-3 h-3" />
                        <span>200+ Chuyên ngành</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                        <Award className="w-3 h-3" />
                        <span>Top 100</span>
                      </div>
                    </div>
                    
                    {/* Key Features */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#003AB7] rounded-full"></div>
                        <span className="text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                          Học bổng TOPIK lên đến 50%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#003AB7] rounded-full"></div>
                        <span className="text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                          KTX cho sinh viên quốc tế
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#003AB7] rounded-full"></div>
                        <span className="text-xs text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                          Hỗ trợ việc làm thêm
                        </span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-white text-[#003AB7] py-3 rounded-lg hover:bg-[#003AB7] hover:text-white active:bg-[#002A8F] active:text-white transition-all duration-200 font-bold text-sm font-['Be_Vietnam_Pro'] group-hover:bg-[#003AB7] group-hover:text-white border border-[#003AB7] shadow-sm hover:shadow-md active:shadow-inner">
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* No Results Message */}
          {koreanUniversities.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#F8F9FA] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-[#558EFF]" />
              </div>
              <h3 className="text-xl font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro']">
                {language === 'vi' ? 'Không tìm thấy trường phù hợp' : language === 'ko' ? '적합한 대학을 찾을 수 없습니다' : 'No suitable universities found'}
              </h3>
              <p className="text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                {language === 'vi' ? 'Vui lòng thử lại với từ khóa khác' : language === 'ko' ? '다른 키워드로 다시 시도해주세요' : 'Please try again with different keywords'}
              </p>
            </div>
          )}

          {/* Student Info Cards Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#003AB7] mb-4 font-['Be_Vietnam_Pro']">
                Sinh Viên Tiêu Biểu
              </h2>
              <p className="text-lg text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                Những gương mặt thành công trong chương trình du học
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <StudentInfoCard
                name="Nguyễn Thị An"
                university="Konkuk University"
                program="Du học D4-1"
                startDate="09/2023"
                status="active"
                phone="+82-10-1234-5678"
                email="an.nguyen@email.com"
              />
              
              <StudentInfoCard
                name="Trần Minh Hoàng"
                university="Korea University"
                program="Thạc sĩ Kinh tế"
                startDate="03/2023"
                status="active"
                phone="+82-10-9876-5432"
                email="hoang.tran@email.com"
              />
              
              <StudentInfoCard
                name="Lê Thuỳ Trang"
                university="Yonsei University"
                program="Du học D2-2"
                startDate="09/2022"
                status="completed"
                phone="+82-10-5555-6666"
                email="trang.le@email.com"
              />
            </div>
          </div>

          {/* Back to Home Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white px-8 py-3 rounded-xl hover:from-[#002A8F] hover:to-[#447DFF] active:from-[#001F70] active:to-[#003580] transition-all duration-200 font-bold font-['Be_Vietnam_Pro'] shadow-md hover:shadow-lg active:shadow-inner"
            >
              <TrendingUp className="w-5 h-5" />
              Quay lại trang chủ
            </button>
          </div>

          {/* Statistics Section */}
          <Statistics />

          {/* University Partners Section */}
          <UniversityPartners />

          {/* Testimonials Section */}
          <Testimonials />

          {/* Enhanced Footer */}
          <EnhancedFooter />
        </div>
      </div>
    </div>
  );
}
