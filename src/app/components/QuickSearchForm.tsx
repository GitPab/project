import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, GraduationCap, MapPin, Star, ChevronRight, Calculator, BookOpen, Phone, User, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import ScholarshipBanner from './ScholarshipBanner';

// VISA system options
const VISA_SYSTEMS = [
  { value: 'D4-1', label: 'D4-1 (Tiếng Hàn)', minTopik: 0, gpaRequired: false },
  { value: 'D2-1', label: 'D2-1 (Dự bị ĐH)', minTopik: 2, gpaRequired: true },
  { value: 'D2-2', label: 'D2-2 (Đại học)', minTopik: 3, gpaRequired: true },
  { value: 'D2-3', label: 'D2-3 (Sau ĐH)', minTopik: 4, gpaRequired: true },
  { value: 'D2-3P', label: 'D2-3 (Tiến sĩ)', minTopik: 5, gpaRequired: true },
];

const TOPIK_LEVELS = [
  { value: 0, label: 'Chưa có TOPIK' },
  { value: 1, label: 'TOPIK 1' },
  { value: 2, label: 'TOPIK 2' },
  { value: 3, label: 'TOPIK 3' },
  { value: 4, label: 'TOPIK 4' },
  { value: 5, label: 'TOPIK 5' },
  { value: 6, label: 'TOPIK 6' },
];

interface SearchResult {
  university: any;
  matchScore: number;
  reasons: string[];
  estimatedCost: number;
}

export default function QuickSearchForm() {
  const navigate = useNavigate();
  const { universities } = useApp();
  const { formatFrom } = useCurrency();
  const { language } = useLanguage();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gpa, setGpa] = useState('');
  const [topik, setTopik] = useState(0);
  const [visaSystem, setVisaSystem] = useState('D4-1');
  const [showResults, setShowResults] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate match score for each university
  const searchResults: SearchResult[] = useMemo(() => {
    if (!showResults) return [];

    const gpaNum = parseFloat(gpa) || 0;
    const selectedVisa = VISA_SYSTEMS.find(v => v.value === visaSystem);

    return universities.map(uni => {
      let score = 0;
      const reasons: string[] = [];

      // Check visa system availability
      const hasVisaSystem = uni.koreanData?.visaSystemsDetail?.[visaSystem]?.available;
      if (hasVisaSystem) {
        score += 40;
        reasons.push(`Có hệ ${visaSystem}`);
      }

      // TOPIK level match
      const requiredTopik = selectedVisa?.minTopik || 0;
      if (topik >= requiredTopik) {
        score += 30;
        reasons.push(topik >= 5 ? 'Đủ điều kiện học bổng 40-50%' : 'Đủ TOPIK yêu cầu');
      } else if (topik > 0) {
        score += 10;
        reasons.push('Cần bổ sung TOPIK');
      }

      // GPA check
      if (selectedVisa?.gpaRequired && gpaNum >= 2.5) {
        score += 20;
        reasons.push(gpaNum >= 3.0 ? 'GPA tốt' : 'Đủ GPA yêu cầu');
      } else if (!selectedVisa?.gpaRequired) {
        score += 20;
        reasons.push('Không yêu cầu GPA');
      }

      // Ranking bonus
      if (uni.ranking?.includes('TOP')) {
        score += 10;
      }

      // Calculate estimated cost
      const baseCost = uni.koreanData?.visaSystemsDetail?.[visaSystem]?.invoiceKRWPerYear || 0;
      const exchangeRate = 22; // 1 KRW = 22 VND (approximate)
      const estimatedCost = baseCost * exchangeRate;

      return {
        university: uni,
        matchScore: score,
        reasons,
        estimatedCost
      };
    })
    .filter(r => r.matchScore > 30) // Only show good matches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6); // Top 6 results
  }, [universities, showResults, gpa, topik, visaSystem]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }

    setIsSubmitting(true);

    try {
      // Call backend API to save quick search
      const response = await fetch('/api/public/quick-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          gpa: parseFloat(gpa) || 0,
          topik,
          visaSystem
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Save tracking code and search data
        sessionStorage.setItem('trackingCode', data.trackingCode);
        sessionStorage.setItem('quickSearch', JSON.stringify({
          fullName,
          phone,
          gpa,
          topik,
          visaSystem,
          trackingCode: data.trackingCode,
          timestamp: Date.now()
        }));
        
        setShowResults(true);
        toast.success(`Tìm thấy ${searchResults.length} trường phù hợp! Mã tra cứu: ${data.trackingCode}`);
      } else {
        // Fallback: still show results even if API fails
        sessionStorage.setItem('quickSearch', JSON.stringify({
          fullName,
          phone,
          gpa,
          topik,
          visaSystem,
          timestamp: Date.now()
        }));
        setShowResults(true);
        toast.success(`Tìm thấy ${searchResults.length} trường phù hợp!`);
      }
    } catch (error) {
      console.error('Quick search API error:', error);
      // Fallback: still show results
      sessionStorage.setItem('quickSearch', JSON.stringify({
        fullName,
        phone,
        gpa,
        topik,
        visaSystem,
        timestamp: Date.now()
      }));
      setShowResults(true);
      toast.success(`Tìm thấy ${searchResults.length} trường phù hợp!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (uniId: string) => {
    // Navigate with search params preserved
    navigate(`/university/${uniId}?from=search`);
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  return (
    <div className="w-full max-w-[1366px] mx-auto">
      {/* Search Form Card */}
      <div id="quick-search" className="bg-white rounded-[30px] border-2 border-[#558EFF] shadow-[14px_22px_25px_-9px_rgba(85,142,255,0.25)] p-6 md:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#003AB7] to-[#558EFF] text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Calculator className="w-4 h-4" />
            CÔNG CỤ TƯ VẤN TỰ ĐỘNG
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#003AB7] mb-2 font-['Be_Vietnam_Pro']">
            TRA CỨU TRƯỜNG PHÙ HỢP
          </h2>
          <p className="text-[#4D4D4D] font-['Be_Vietnam_Pro']">
            Nhập thông tin của bạn để tìm trường và chi phí phù hợp nhất
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-5">
          {/* Row 1: Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                <User className="w-4 h-4 inline mr-1" />
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl border-2 border-[#558EFF] focus:outline-none focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            <div className="relative">
              <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                <Phone className="w-4 h-4 inline mr-1" />
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl border-2 border-[#558EFF] focus:outline-none focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                placeholder="0987654321"
                required
              />
            </div>
          </div>

          {/* Row 2: GPA, TOPIK, Visa */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                <BookOpen className="w-4 h-4 inline mr-1" />
                GPA (Thang 4.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="4"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl border-2 border-[#558EFF] focus:outline-none focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
                placeholder="VD: 3.2"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                <Award className="w-4 h-4 inline mr-1" />
                Trình độ TOPIK
              </label>
              <select
                value={topik}
                onChange={(e) => setTopik(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl border-2 border-[#558EFF] focus:outline-none focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
              >
                {TOPIK_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-bold text-[#4D4D4D] font-['Be_Vietnam_Pro']">
                <GraduationCap className="w-4 h-4 inline mr-1" />
                Hệ visa mong muốn
              </label>
              <select
                value={visaSystem}
                onChange={(e) => setVisaSystem(e.target.value)}
                className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl border-2 border-[#558EFF] focus:outline-none focus:border-[#003AB7] transition-all font-['Be_Vietnam_Pro']"
              >
                {VISA_SYSTEMS.map(sys => (
                  <option key={sys.value} value={sys.value}>
                    {sys.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scholarship Banner */}
          {topik >= 5 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-orange-800 font-['Be_Vietnam_Pro']">
                  🎉 Bạn đủ điều kiện Học bổng {topik === 5 ? '40%' : '50%'}
                </h4>
                <p className="text-sm text-orange-700 font-['Be_Vietnam_Pro']">
                  Với TOPIK {topik}, bạn có thể nhận học bổng lên đến {topik === 5 ? '39 triệu' : '48 triệ'} VNĐ
                </p>
              </div>
            </div>
          )}

          {/* Scholarship Banner */}
          {topik >= 3 && (
            <ScholarshipBanner 
              variant="inline" 
              topikLevel={topik}
              className="my-4"
            />
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#003AB7] to-[#558EFF] hover:from-[#002A8F] hover:to-[#447DFF] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all font-['Be_Vietnam_Pro'] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Search className="w-5 h-5 mr-2" />
            )}
            {isSubmitting ? 'ĐANG XỬ LÝ...' : 'TÌM TRƯỜNG PHÙ HỢP'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <div className="mt-8 pt-8 border-t-2 border-[#558EFF]/20">
            <h3 className="text-xl font-bold text-[#003AB7] mb-6 font-['Be_Vietnam_Pro'] flex items-center gap-2">
              <Star className="w-5 h-5" />
              {searchResults.length} TRƯỜNG PHÙ HỢP VỚI BẠN
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((result, index) => (
                <Card 
                  key={result.university.id}
                  className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 ${
                    index === 0 ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-[#558EFF]/30'
                  }`}
                  onClick={() => handleViewDetail(result.university.id)}
                >
                  {/* Rank Badge */}
                  {index === 0 && (
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold px-3 py-1 text-center">
                      🏆 PHÙ HỢP NHẤT
                    </div>
                  )}

                  <CardContent className="p-5">
                    {/* Match Score */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${getMatchColor(result.matchScore)}`}>
                        Match: {result.matchScore}%
                      </span>
                      <span className="text-xs text-[#4D4D4D]">
                        {result.university.ranking}
                      </span>
                    </div>

                    {/* University Name */}
                    <h4 className="font-bold text-[#003AB7] mb-1 font-['Be_Vietnam_Pro'] line-clamp-1">
                      {result.university.name}
                    </h4>
                    <p className="text-xs text-[#4D4D4D] mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {result.university.region || 'Seoul, Hàn Quốc'}
                    </p>

                    {/* Reasons */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {result.reasons.slice(0, 2).map((reason, i) => (
                        <span key={i} className="text-[10px] bg-[#F8F9FA] text-[#003AB7] px-2 py-0.5 rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>

                    {/* Cost */}
                    {result.estimatedCost > 0 && (
                      <div className="bg-[#F8F9FA] rounded-lg p-2 mb-3">
                        <p className="text-xs text-[#4D4D4D]">Chi phí ước tính/năm:</p>
                        <p className="font-bold text-[#003AB7] font-['Be_Vietnam_Pro']">
                          {formatFrom(result.estimatedCost, 'VND')}
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    <Button 
                      size="sm" 
                      className="w-full bg-[#003AB7] hover:bg-[#002A8F] text-white"
                    >
                      Xem chi tiết
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Consultation CTA */}
            <div className="mt-6 bg-gradient-to-r from-[#003AB7] to-[#558EFF] rounded-xl p-4 text-white text-center">
              <p className="font-medium mb-2 font-['Be_Vietnam_Pro']">
                Muốn biết thêm chi tiết về các trường này?
              </p>
              <Button 
                variant="secondary" 
                className="bg-white text-[#003AB7] hover:bg-gray-100 font-bold"
                onClick={() => navigate('/register')}
              >
                ĐĂNG KÝ TƯ VẤN MIỄN PHÍ
              </Button>
            </div>
          </div>
        )}

        {showResults && searchResults.length === 0 && (
          <div className="mt-8 p-6 bg-gray-50 rounded-xl text-center">
            <p className="text-[#4D4D4D] font-['Be_Vietnam_Pro']">
              Chưa tìm thấy trường phù hợp với tiêu chí của bạn.
            </p>
            <p className="text-sm text-[#4D4D4D]/70 mt-2">
              Vui lòng điều chỉnh GPA, TOPIK hoặc hệ visa và thử lại.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
