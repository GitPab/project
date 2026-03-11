import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import type { VisaSystemCost, OptionalAddon } from '../context/AppContext';
import { 
  ArrowLeft, MapPin, DollarSign, CheckCircle, Building, Home, Shield, FileText, Lock,
  GraduationCap, Scale, Microscope, Cpu, TrendingUp, Lightbulb, Zap, Atom, BarChart3, Rocket,
  Building2, Briefcase, BookOpen, Leaf, Users, Stethoscope, Globe, TestTube, Megaphone, Award, Star,
  ChevronDown, AlertCircle, Info, Check, X, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Slider } from '../components/ui/slider';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';

// Icon mapping for academic programs
const iconMap: Record<string, React.ComponentType<any>> = {
  GraduationCap, Scale, Microscope, Cpu, TrendingUp, Lightbulb, Zap, Atom, BarChart3, Rocket,
  Building2, Briefcase, BookOpen, Leaf, Users, Stethoscope, Globe, TestTube, Megaphone, Building
};

export default function UniversityDetailKorean() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { universities, registrations, registerForUniversity, user } = useApp();
  const { currency, formatCurrency, convertAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<'overview' | 'costs' | 'academic' | 'gallery' | 'ranking'>('costs');
  
  // Korean university specific state
  const [selectedVisaType, setSelectedVisaType] = useState<'D4-1' | 'D2-2' | 'D2-3' | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, any>>({});
  const [addonValues, setAddonValues] = useState<Record<string, number>>({});

  const university = universities.find(uni => uni.id === id);
  const isRegistered = registrations.some(r => r.universityId === id && r.studentEmail === user?.email);
  const isKorean = university?.koreanData?.isKoreanUniversity;

  if (!university) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">University not found</p>
      </div>
    );
  }

  // Initialize visa type on first render
  React.useEffect(() => {
    if (isKorean && !selectedVisaType && university.koreanData?.visaSystems?.[0]) {
      setSelectedVisaType(university.koreanData.visaSystems[0].visaType);
    }
  }, [isKorean, selectedVisaType, university]);

  // Helper: convert any source currency to USD (formatCurrency expects USD input)
  const convertCurrencyAmount = (amount: number, sourceCurrency: 'USD' | 'VND' | 'KRW' | 'JPY' | 'CNY' = 'USD'): number => {
    return convertAmount(amount, 'USD', sourceCurrency as any);
  };

  // Format a USD amount in all 5 currencies for display
  const formatAllCurrencies = (amountUSD: number) => {
    return {
      vnd: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amountUSD, 'VND', 'USD')),
      krw: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amountUSD, 'KRW', 'USD')),
      usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amountUSD),
      jpy: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amountUSD, 'JPY', 'USD')),
      cny: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(convertAmount(amountUSD, 'CNY', 'USD')),
    };
  };

  // Calculate total cost for Korean universities
  const calculateKoreanTotal = useMemo(() => {
    if (!isKorean || !selectedVisaType) return 0;

    let total = 0;

    // Add fixed costs
    if (university.fixedCosts) {
      university.fixedCosts.forEach(cost => {
        const converted = convertCurrencyAmount(cost.amount, cost.currency || 'USD');
        total += converted;
      });
    }

    // Add visa system costs
    const visaSystem = university.koreanData?.visaSystems?.find(v => v.visaType === selectedVisaType);
    if (visaSystem) {
      if (visaSystem.tuitionPerTerm) {
        total += convertCurrencyAmount(visaSystem.tuitionPerTerm, 'KRW');
      }
      if (visaSystem.tuitionRange) {
        // Use max for estimate
        total += convertCurrencyAmount(visaSystem.tuitionRange.max, 'KRW');
      }
      if (visaSystem.applicationFee) {
        total += convertCurrencyAmount(visaSystem.applicationFee, 'KRW');
      }
      if (visaSystem.enrollmentFee) {
        total += convertCurrencyAmount(visaSystem.enrollmentFee, 'KRW');
      }
      if (visaSystem.baseYearlyFee) {
        total += convertCurrencyAmount(visaSystem.baseYearlyFee, 'KRW');
      }
    }

    // Add selected optional addons
    Object.entries(selectedAddons).forEach(([addonId, isSelected]) => {
      if (isSelected) {
        const addon = university.optionalAddons?.find(a => a.id === addonId);
        if (addon) {
          if (addon.type === 'scholarship') {
            // Scholarship subtracts from total
            const percentage = addonValues[addonId] || addon.percentage || 0;
            const discount = total * (percentage / 100);
            total -= discount;
          } else {
            const addonAmount = addonValues[addonId] || addon.amount || 0;
            const sourceCurrency = addon.type === 'dorm-vn' || addon.type === 'flight' ? 'VND' : 'KRW';
            total += convertCurrencyAmount(addonAmount, sourceCurrency);
          }
        }
      }
    });

    return total;
  }, [isKorean, selectedVisaType, university, selectedAddons, addonValues, currency]);

  // Calculate traditional total for non-Korean universities
  const calculateTraditionalTotal = () => {
    return university.generalTuition + university.visaFee + university.accommodationFee + 
           university.insuranceFee + university.additionalFees.reduce((sum, fee) => sum + fee.amount, 0);
  };

  const handleAddonToggle = (addonId: string, addon: OptionalAddon) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));

    // Set default value if addon has options
    if (addon.options && addon.options.length > 0 && !addonValues[addonId]) {
      setAddonValues(prev => ({
        ...prev,
        [addonId]: addon.options![0].value
      }));
    }
  };

  const handleAddonValueChange = (addonId: string, value: number) => {
    setAddonValues(prev => ({
      ...prev,
      [addonId]: value
    }));
  };

  const handleRegister = () => {
    registerForUniversity(university.id);
    toast.success(`Đã đăng ký thành công cho ${university.name}!`, {
      description: 'Bạn có thể xem và chỉnh sửa chi phí trong trang "Chi phí của tôi"'
    });
  };

  const costBreakdown = [
    { icon: Building, label: 'Học phí', labelEn: 'General Tuition', amount: university.generalTuition, color: 'bg-blue-100 text-blue-600' },
    { icon: FileText, label: 'Phí visa', labelEn: 'Visa Fee', amount: university.visaFee, color: 'bg-purple-100 text-purple-600' },
    { icon: Home, label: 'Chi phí lưu trú', labelEn: 'Accommodation', amount: university.accommodationFee, color: 'bg-green-100 text-green-600' },
    { icon: Shield, label: 'Bảo hiểm', labelEn: 'Insurance', amount: university.insuranceFee, color: 'bg-orange-100 text-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Image Section */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        <img 
          src={university.heroImage} 
          alt={university.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm text-slate-900 rounded-lg hover:bg-white transition-colors shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        {/* University Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{university.countryCode}</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{university.country}</span>
              </div>
              {isKorean && university.koreanData?.topVisa && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/90 backdrop-blur-md rounded-full">
                  <Award className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">{university.koreanData.topVisa}</span>
                </div>
              )}
            </div>
            <h1 className="text-white text-3xl md:text-4xl font-bold mb-2">{university.name}</h1>
            <p className="text-white/90 text-base md:text-lg max-w-3xl">{university.tagline}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Common Information Card (for Korean universities) */}
        {isKorean && university.koreanData && (
          <div className="mb-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Thông tin chung (General Information)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {university.koreanData.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Địa chỉ (Address)</p>
                    <p className="text-sm text-slate-800">{university.koreanData.address}</p>
                  </div>
                </div>
              )}
              {university.koreanData.koreanRanking && (
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Xếp hạng (Ranking)</p>
                    <p className="text-sm text-slate-800">{university.koreanData.koreanRanking}</p>
                  </div>
                </div>
              )}
              {university.koreanData.majorCategories && (
                <div className="col-span-1 md:col-span-2">
                  <p className="text-sm font-medium text-slate-600 mb-2">Chuyên ngành (Majors)</p>
                  <div className="space-y-2">
                    {university.koreanData.majorCategories.map((cat, idx) => (
                      <div key={idx}>
                        <p className="text-sm font-medium text-blue-600">{cat.category}:</p>
                        <p className="text-sm text-slate-700 ml-4">{cat.subjects.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 bg-white rounded-xl border border-slate-200 p-4 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Chế độ xem - Không thể chỉnh sửa</p>
                <p className="text-xs text-blue-700 mt-1">Thông tin chi phí chỉ để tham khảo. Liên hệ quản trị viên để cập nhật.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                <DollarSign className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-slate-600">Tổng chi phí</p>
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(isKorean ? calculateKoreanTotal : convertAmount(calculateTraditionalTotal(), currency))}
                  </p>
                </div>
              </div>
              
              {isRegistered ? (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Đã đăng ký</span>
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm whitespace-nowrap"
                >
                  Đăng ký ngay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex border-b border-slate-200 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'overview' 
                  ? 'border-primary text-primary bg-blue-50/50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Giới thiệu
            </button>
            <button
              onClick={() => setActiveTab('academic')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'academic' 
                  ? 'border-primary text-primary bg-blue-50/50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Định hướng học tập
            </button>
            <button
              onClick={() => setActiveTab('costs')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'costs' 
                  ? 'border-primary text-primary bg-blue-50/50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isKorean ? 'Chi phí & Chọn hệ Visa' : 'Chi phí'}
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'gallery' 
                  ? 'border-primary text-primary bg-blue-50/50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Ảnh & Cuộc sống sinh viên
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={`px-6 py-4 font-medium transition-colors border-b-2 ${
                activeTab === 'ranking' 
                  ? 'border-primary text-primary bg-blue-50/50' 
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {isKorean ? 'Hỗ trợ & Thông tin' : 'Ranking & Thông tin'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Giới thiệu chung</h2>
            <p className="text-slate-700 leading-relaxed text-base">{university.overview}</p>
          </div>
        )}

        {activeTab === 'academic' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Định hướng học tập</h2>
              <p className="text-slate-600 mb-6">Các ngành mạnh, chương trình nổi bật và cơ hội nghiên cứu</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(university.academicPrograms || []).map((program, index) => {
                  const IconComponent = iconMap[program.icon] || GraduationCap;
                  return (
                    <div key={index} className="group p-5 border-2 border-slate-200 rounded-xl hover:border-primary hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-slate-900 mb-1.5">{program.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{program.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="space-y-6">
            {isKorean ? (
              <>
                {/* Visa System Selector */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Chọn hệ tuyển sinh (Select Visa System)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {university.koreanData?.visaSystems?.map((visa) => (
                      <button
                        key={visa.visaType}
                        onClick={() => setSelectedVisaType(visa.visaType)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedVisaType === visa.visaType
                            ? 'border-primary bg-blue-50 shadow-md'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-lg text-primary">{visa.visaType}</span>
                          {selectedVisaType === visa.visaType && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{visa.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed Costs */}
                {university.fixedCosts && university.fixedCosts.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-600" />
                      Chi phí cố định (Fixed Costs - Must Pay)
                    </h2>
                    <TooltipProvider>
                      <div className="space-y-2">
                        {university.fixedCosts.map((cost, index) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-red-50 border border-red-100 rounded-lg group">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-700">{cost.type}</span>
                              {cost.description && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button className="opacity-60 hover:opacity-100 transition-opacity">
                                      <HelpCircle className="w-4 h-4 text-slate-500" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p className="text-xs">{cost.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <span className="font-bold text-slate-900">
                              {formatCurrency(convertCurrencyAmount(cost.amount, cost.currency || 'USD'))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TooltipProvider>
                  </div>
                )}

                {/* System-Specific Costs */}
                {selectedVisaType && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      Chi phí theo hệ {selectedVisaType} (System-Specific Costs)
                    </h2>
                    {(() => {
                      const visa = university.koreanData?.visaSystems?.find(v => v.visaType === selectedVisaType);
                      if (!visa) return null;

                      return (
                        <div className="space-y-2">
                          {visa.tuitionPerTerm && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Học phí mỗi kỳ (Tuition per Term)</span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(convertCurrencyAmount(visa.tuitionPerTerm, 'KRW'))}
                              </span>
                            </div>
                          )}
                          {visa.tuitionRange && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Học phí mỗi kỳ (Tuition per Term)</span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(convertCurrencyAmount(visa.tuitionRange.min, 'KRW'))} - {formatCurrency(convertCurrencyAmount(visa.tuitionRange.max, 'KRW'))}
                              </span>
                            </div>
                          )}
                          {visa.applicationFee && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Phí apply (Application Fee)</span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(convertCurrencyAmount(visa.applicationFee, 'KRW'))}
                              </span>
                            </div>
                          )}
                          {visa.enrollmentFee && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Phí nhập học (Enrollment Fee)</span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(convertCurrencyAmount(visa.enrollmentFee, 'KRW'))}
                              </span>
                            </div>
                          )}
                          {visa.baseYearlyFee && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Phí cơ bản hàng năm (Base Yearly Fee)</span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(convertCurrencyAmount(visa.baseYearlyFee, 'KRW'))}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Optional Add-ons */}
                {university.optionalAddons && university.optionalAddons.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Chi phí tùy chọn (Optional Add-ons)
                    </h2>
                    <p className="text-sm text-slate-600 mb-4">Chọn các dịch vụ bổ sung bạn muốn (Select additional services you want)</p>
                    <div className="space-y-4">
                      {university.optionalAddons.map((addon) => (
                        <div key={addon.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handleAddonToggle(addon.id, addon)}
                              className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${\n                                selectedAddons[addon.id]\n                                  ? 'bg-primary border-primary'\n                                  : 'border-slate-300 hover:border-primary'\n                              }`}\n                            >
                              {selectedAddons[addon.id] && <Check className="w-4 h-4 text-white" />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-medium text-slate-900">{addon.nameVi || addon.name}</h3>
                                  {addon.nameKr && (
                                    <p className="text-xs text-slate-500 mt-0.5">{addon.nameKr}</p>
                                  )}
                                  {addon.conditional && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {addon.conditional}
                                    </p>
                                  )}
                                </div>
                                {addon.amount !== undefined && !addon.requiresInput && !addon.amountRange && (
                                  <span className={`font-bold whitespace-nowrap ${addon.type === 'scholarship' ? 'text-green-600' : 'text-slate-900'}`}>
                                    {addon.type === 'scholarship' ? `-${addon.percentage}%` : formatCurrency(convertCurrencyAmount(addon.amount, addon.type === 'dorm-vn' || addon.type === 'flight' ? 'VND' : 'KRW'))}
                                  </span>
                                )}
                              </div>
                              
                              {/* Radio buttons for Dorm KR */}
                              {selectedAddons[addon.id] && addon.type === 'dorm-kr' && addon.options && (
                                <div className="mt-3">
                                  <RadioGroup 
                                    value={String(addonValues[addon.id] || addon.options[0].value)}
                                    onValueChange={(val) => handleAddonValueChange(addon.id, Number(val))}
                                  >
                                    <div className="space-y-2">
                                      {addon.options.map((opt) => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                          <RadioGroupItem value={String(opt.value)} id={`${addon.id}-${opt.value}`} />
                                          <Label htmlFor={`${addon.id}-${opt.value}`} className="text-sm text-slate-700 cursor-pointer">
                                            {opt.label}
                                          </Label>
                                        </div>
                                      ))}\n                                    </div>
                                  </RadioGroup>
                                </div>
                              )}\n\n                              {/* Slider for Flight */}\n                              {selectedAddons[addon.id] && addon.type === 'flight' && addon.amountRange && (\n                                <div className="mt-3">\n                                  <div className="flex items-center justify-between mb-2">\n                                    <span className="text-sm text-slate-600">Điều chỉnh giá vé (Adjust price):</span>\n                                    <span className="text-sm font-bold text-primary">\n                                      {formatCurrency(convertCurrencyAmount(addonValues[addon.id] || addon.amount || addon.amountRange.min, 'VND'))}\n                                    </span>\n                                  </div>\n                                  <Slider\n                                    value={[addonValues[addon.id] || addon.amount || addon.amountRange.min]}\n                                    onValueChange={(values) => handleAddonValueChange(addon.id, values[0])}\n                                    min={addon.amountRange.min}\n                                    max={addon.amountRange.max}\n                                    step={500000}\n                                    className="w-full"\n                                  />\n                                  <div className="flex justify-between mt-1">\n                                    <span className="text-xs text-slate-500">Sớm: {formatCurrency(convertCurrencyAmount(addon.amountRange.min, 'VND'))}</span>\n                                    <span className="text-xs text-slate-500">Muộn: {formatCurrency(convertCurrencyAmount(addon.amountRange.max, 'VND'))}</span>\n                                  </div>\n                                </div>\n                              )}\n\n                              {/* Dropdown for other options (Dorm VN, Savings, Scholarships) */}\n                              {selectedAddons[addon.id] && addon.requiresInput && addon.options && addon.type !== 'dorm-kr' && addon.type !== 'flight' && (\n                                <div className="mt-3">\n                                  <select\n                                    value={addonValues[addon.id] || addon.options[0].value}\n                                    onChange={(e) => handleAddonValueChange(addon.id, Number(e.target.value))}\n                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"\n                                  >\n                                    {addon.options.map((opt) => (\n                                      <option key={opt.value} value={opt.value}>\n                                        {opt.label}\n                                      </option>\n                                    ))}\n                                  </select>\n                                </div>\n                              )}\n                            </div>\n                          </div>\n                        </div>\n                      ))}\n                    </div>\n                  </div>\n                )}\n\n                {/* Real-time Calculator Summary */}\n                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200 p-6 shadow-lg sticky bottom-6">\n                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">\n                    <DollarSign className="w-5 h-5 text-green-600" />\n                    Tổng kết chi phí (Cost Summary)\n                  </h2>\n                  <div className="space-y-2 mb-4">\n                    <div className="flex justify-between text-sm">\n                      <span className="text-slate-600">Chi phí cố định (Fixed)</span>\n                      <span className="font-medium">\n                        {formatCurrency(\n                          (university.fixedCosts || []).reduce((sum, cost) => \n                            sum + convertCurrencyAmount(cost.amount, cost.currency || 'USD'), 0\n                          )\n                        )}\n                      </span>\n                    </div>\n                    {selectedVisaType && (\n                      <div className="flex justify-between text-sm">\n                        <span className="text-slate-600">Chi phí hệ {selectedVisaType}</span>\n                        <span className="font-medium">\n                          {(() => {\n                            const visa = university.koreanData?.visaSystems?.find(v => v.visaType === selectedVisaType);\n                            if (!visa) return formatCurrency(0);\n                            let visaTotal = 0;\n                            if (visa.tuitionPerTerm) visaTotal += convertCurrencyAmount(visa.tuitionPerTerm, 'KRW');\n                            if (visa.tuitionRange) visaTotal += convertCurrencyAmount(visa.tuitionRange.max, 'KRW');\n                            if (visa.applicationFee) visaTotal += convertCurrencyAmount(visa.applicationFee, 'KRW');\n                            if (visa.enrollmentFee) visaTotal += convertCurrencyAmount(visa.enrollmentFee, 'KRW');\n                            if (visa.baseYearlyFee) visaTotal += convertCurrencyAmount(visa.baseYearlyFee, 'KRW');\n                            return formatCurrency(visaTotal);\n                          })()}\n                        </span>\n                      </div>\n                    )}\n                    {Object.keys(selectedAddons).length > 0 && (\n                      <div className="flex justify-between text-sm">\n                        <span className="text-slate-600">Chi phí tùy chọn (Add-ons)</span>\n                        <span className="font-medium text-green-600">\n                          {(() => {\n                            let addonsTotal = 0;\n                            Object.entries(selectedAddons).forEach(([addonId, isSelected]) => {\n                              if (isSelected) {\n                                const addon = university.optionalAddons?.find(a => a.id === addonId);\n                                if (addon && addon.type !== 'scholarship') {\n                                  const amount = addonValues[addonId] || addon.amount || 0;\n                                  const sourceCurrency = addon.type === 'dorm-vn' || addon.type === 'flight' ? 'VND' : 'KRW';\n                                  addonsTotal += convertCurrencyAmount(amount, sourceCurrency);\n                                }\n                              }\n                            });\n                            return formatCurrency(addonsTotal);\n                          })()}\n                        </span>\n                      </div>\n                    )}\n                  </div>\n                  <div className="pt-4 border-t-2 border-green-300">\n                    <div className="flex justify-between items-center">\n                      <span className="text-lg font-bold text-slate-900">Tổng cộng (Total)</span>\n                      <span className="text-3xl font-bold text-primary">{formatCurrency(calculateKoreanTotal)}</span>\n                    </div>\n                    <p className="text-xs text-slate-500 mt-2 text-right">\n                      Hiển thị trong {currency} • Tỷ giá thực tế\n                    </p>\n                  </div>\n\n                  {/* Multi-currency breakdown */}\n                  {calculateKoreanTotal > 0 && (() => {\n                    const mc = formatAllCurrencies(calculateKoreanTotal); // calculateKoreanTotal is in USD\n                    return (\n                      <div className="mt-4 pt-4 border-t border-green-200">\n                        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Quy đổi tất cả đơn vị tiền tệ</p>\n                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">\n                          {[\n                            { flag: '🇻🇳', code: 'VND', val: mc.vnd },\n                            { flag: '🇰🇷', code: 'KRW', val: mc.krw },\n                            { flag: '🇺🇸', code: 'USD', val: mc.usd },\n                            { flag: '🇯🇵', code: 'JPY', val: mc.jpy },\n                            { flag: '🇨🇳', code: 'CNY', val: mc.cny },\n                          ].map(item => (\n                            <div key={item.code} className="bg-white rounded-lg border border-green-100 p-2 text-center">\n                              <div className="text-lg mb-0.5">{item.flag}</div>\n                              <div className="text-xs text-slate-500">{item.code}</div>\n                              <div className="text-xs font-bold text-slate-800 leading-tight">{item.val}</div>\n                            </div>\n                          ))}\n                        </div>\n                        <p className="text-xs text-slate-400 mt-2 text-center">\n                          Tỷ giá: 1 USD = 26,192 VND = 1,474 KRW = 157 JPY = 6.91 CNY\n                        </p>\n                      </div>\n                    );\n                  })()}\n                </div>\n              </>\n            ) : (\n              <>\n                {/* Traditional Cost Breakdown */}\n                <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">\n                  <div className="flex items-center justify-between mb-6">\n                    <h2 className="text-2xl font-bold text-slate-900">Chi tiết chi phí</h2>\n                    <Lock className="w-5 h-5 text-slate-400" />\n                  </div>\n\n                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">\n                    {costBreakdown.map((item, index) => (\n                      <div key={index} className="flex items-center gap-4 p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">\n                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color}`}>\n                          <item.icon className="w-7 h-7" />\n                        </div>\n                        <div className="flex-1">\n                          <p className="text-sm text-slate-600 mb-1">{item.label}</p>\n                          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(item.amount)}</p>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n\n                  {university.additionalFees.length > 0 && (\n                    <div className="border-t border-slate-200 pt-6">\n                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">\n                        Phí bổ sung\n                        <Lock className="w-4 h-4 text-slate-400" />\n                      </h3>\n                      <div className="space-y-2">\n                        {university.additionalFees.map((fee, index) => (\n                          <div key={index} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">\n                            <span className="text-sm text-slate-700 flex items-center gap-2">\n                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>\n                              {fee.type}\n                            </span>\n                            <span className="font-semibold text-slate-900">{formatCurrency(convertAmount(fee.amount, currency))}</span>\n                          </div>\n                        ))}\n                      </div>\n                    </div>\n                  )}\n                </div>\n\n                {/* Summary Table */}\n                <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">\n                  <div className="flex items-center justify-between mb-4">\n                    <h2 className="text-2xl font-bold text-slate-900">Tổng kết tài chính</h2>\n                    <Lock className="w-5 h-5 text-slate-400" />\n                  </div>\n                  <div className="space-y-3">\n                    <div className="flex justify-between py-3 border-b border-slate-100">\n                      <span className="text-slate-600">Học phí</span>\n                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.generalTuition, currency))}</span>\n                    </div>\n                    <div className="flex justify-between py-3 border-b border-slate-100">\n                      <span className="text-slate-600">Phí visa</span>\n                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.visaFee, currency))}</span>\n                    </div>\n                    <div className="flex justify-between py-3 border-b border-slate-100">\n                      <span className="text-slate-600">Chi phí lưu trú</span>\n                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.accommodationFee, currency))}</span>\n                    </div>\n                    <div className="flex justify-between py-3 border-b border-slate-100">\n                      <span className="text-slate-600">Bảo hiểm</span>\n                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.insuranceFee, currency))}</span>\n                    </div>\n                    {university.additionalFees.map((fee, index) => (\n                      <div key={index} className="flex justify-between py-3 border-b border-slate-100">\n                        <span className="text-slate-600">{fee.type}</span>\n                        <span className="font-medium text-slate-900">{formatCurrency(convertAmount(fee.amount, currency))}</span>\n                      </div>\n                    ))}\n                    <div className="flex justify-between py-4 pt-5 border-t-2 border-slate-300">\n                      <span className="text-lg font-bold text-slate-900">Tổng chi phí ước tính</span>\n                      <span className="text-2xl font-bold text-primary">{formatCurrency(convertAmount(calculateTraditionalTotal(), currency))}</span>\n                    </div>\n                  </div>\n                </div>\n              </>\n            )}\n          </div>\n        )}\n\n        {activeTab === 'gallery' && (\n          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">\n            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ảnh & Cuộc sống sinh viên</h2>\n            <p className="text-slate-600 mb-6">Khám phá không gian học tập và trải nghiệm sinh viên</p>\n            \n            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\n              {(university.galleryImages || []).map((image, index) => (\n                <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer">\n                  <img \n                    src={image} \n                    alt={`${university.name} - Image ${index + 1}`}n                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"\n                  />\n                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>\n                </div>\n              ))}\n            </div>\n          </div>\n        )}\n\n        {activeTab === 'ranking' && (\n          <div className="space-y-6">\n            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">\n              <h2 className="text-2xl font-bold text-slate-900 mb-6">\n                {isKorean ? 'Hỗ trợ & Thông tin thêm' : 'Ranking & Thông tin thêm'}\n              </h2>\n              \n              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">\n                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl">\n                  <div className="flex items-center gap-3 mb-3">\n                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">\n                      <Award className="w-6 h-6 text-white" />\n                    </div>\n                    <div>\n                      <p className="text-sm text-slate-600">World Ranking</p>\n                      <p className="text-3xl font-bold text-primary">#{university.worldRanking}</p>\n                    </div>\n                  </div>\n                  <p className="text-sm text-slate-700">{university.ranking}</p>\n                </div>\n\n                <div className="p-6 border-2 border-slate-200 rounded-xl">\n                  <div className="flex items-center gap-3 mb-3">\n                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">\n                      <Star className="w-6 h-6 text-yellow-600" />\n                    </div>\n                    <div>\n                      <p className="text-sm text-slate-600">Danh tiếng</p>\n                      <p className="text-2xl font-bold text-slate-900">Xuất sắc</p>\n                    </div>\n                  </div>\n                  <p className="text-sm text-slate-600">Được công nhận toàn cầu với chất lượng giáo dục hàng đầu</p>\n                </div>\n              </div>\n\n              {/* Korean-specific support information */}\n              {isKorean && university.koreanData && (\n                <>\n                  {university.koreanData.studentSupport && university.koreanData.studentSupport.length > 0 && (\n                    <div className="mb-6 p-6 bg-green-50 rounded-xl border border-green-200">\n                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">\n                        <Users className="w-5 h-5 text-green-600" />\n                        Hỗ trợ sinh viên (Student Support)\n                      </h3>\n                      <ul className="space-y-2">\n                        {university.koreanData.studentSupport.map((support, idx) => (\n                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">\n                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />\n                            <span>{support}</span>\n                          </li>\n                        ))}\n                      </ul>\n                    </div>\n                  )}\n\n                  {university.koreanData.scholarships && university.koreanData.scholarships.length > 0 && (\n                    <div className="mb-6 p-6 bg-yellow-50 rounded-xl border border-yellow-200">\n                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">\n                        <Award className="w-5 h-5 text-yellow-600" />\n                        Học bổng (Scholarships)\n                      </h3>\n                      <div className="space-y-3">\n                        {university.koreanData.scholarships.map((scholarship, idx) => (\n                          <div key={idx} className="text-sm">\n                            <p className="font-medium text-blue-600">{scholarship.visaType}:</p>\n                            <p className="text-slate-700 ml-4">{scholarship.description}</p>\n                          </div>\n                        ))}\n                      </div>\n                    </div>\n                  )}\n\n                  {university.koreanData.jobOpportunities && (\n                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">\n                      <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">\n                        <Briefcase className="w-5 h-5 text-purple-600" />\n                        Cơ hội việc làm thêm (Part-time Jobs)\n                      </h3>\n                      <p className="text-sm text-slate-700">{university.koreanData.jobOpportunities}</p>\n                    </div>\n                  )}\n                </>\n              )}\n\n              <div className="mt-6 p-6 bg-slate-50 rounded-xl">\n                <h3 className="text-lg font-semibold text-slate-900 mb-3">Thông tin liên hệ</h3>\n                <div className="space-y-2 text-sm text-slate-600">\n                  <p>• Website: www.{university.name.toLowerCase().replace(/\s+/g, '')}.edu</p>\n                  <p>• Email: admissions@{university.name.toLowerCase().replace(/\s+/g, '')}.edu</p>\n                  <p>• Địa chỉ: {isKorean && university.koreanData?.address ? university.koreanData.address : university.country}</p>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}\n      </div>\n    </div>\n  );\n}\n