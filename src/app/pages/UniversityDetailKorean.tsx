import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import type { OptionalAddon } from '../context/AppContext';
import {
  ArrowLeft, MapPin, DollarSign, CheckCircle, Building, Shield, FileText, Lock,
  GraduationCap, Scale, Microscope, Cpu, TrendingUp, Lightbulb, Zap, Atom, BarChart3, Rocket,
  Building2, Briefcase, BookOpen, Leaf, Users, Stethoscope, Globe, TestTube, Megaphone, Award, Star,
  AlertCircle, Info, Check, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Slider } from '../components/ui/slider';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';

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
  const [selectedVisaType, setSelectedVisaType] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
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

  // ✅ FIX: useEffect must come after early return guard in function body
  // But hooks cannot be after conditional returns — so we need to restructure.
  // We use a ref trick: move the early return after all hooks.
  React.useEffect(() => {
    if (isKorean && !selectedVisaType && university?.koreanData?.visaSystems?.[0]) {
      setSelectedVisaType(university.koreanData.visaSystems[0].visaType);
    }
  }, [isKorean, selectedVisaType, university]);

  // ✅ FIX: Helper converts from source currency to USD (since formatCurrency expects USD)
  const convertCurrencyAmount = (amount: number, sourceCurrency: string = 'USD'): number => {
    return convertAmount(amount, 'USD', sourceCurrency as any);
  };

  const formatAllCurrencies = (amountUSD: number) => ({
    vnd: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(convertAmount(amountUSD, 'VND', 'USD')),
    krw: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 }).format(convertAmount(amountUSD, 'KRW', 'USD')),
    usd: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amountUSD),
    jpy: new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0 }).format(convertAmount(amountUSD, 'JPY', 'USD')),
    cny: new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 }).format(convertAmount(amountUSD, 'CNY', 'USD')),
  });

  const calculateKoreanTotal = useMemo(() => {
    if (!isKorean || !selectedVisaType) return 0;
    let totalCost = 0;

    university?.fixedCosts?.forEach((cost: any) => {
      totalCost += convertCurrencyAmount(cost.amount, cost.currency || 'USD');
    });

    const visaSystem = university.koreanData?.visaSystems?.find((v: any) => v.visaType === selectedVisaType);
    if (visaSystem) {
      if (visaSystem.tuitionPerTerm) totalCost += convertCurrencyAmount(visaSystem.tuitionPerTerm, 'KRW');
      if (visaSystem.tuitionRange?.max) totalCost += convertCurrencyAmount(visaSystem.tuitionRange.max, 'KRW');
      if (visaSystem.applicationFee) totalCost += convertCurrencyAmount(visaSystem.applicationFee, 'KRW');
      if (visaSystem.enrollmentFee) totalCost += convertCurrencyAmount(visaSystem.enrollmentFee, 'KRW');
      if (visaSystem.baseYearlyFee) totalCost += convertCurrencyAmount(visaSystem.baseYearlyFee, 'KRW');
    }

    Object.entries(selectedAddons).forEach(([addonId, isSelected]) => {
      if (isSelected) {
        const addon = university.optionalAddons?.find((a: any) => a.id === addonId);
        if (addon) {
          if (addon.type === 'scholarship') {
            const percentage = addonValues[addonId] || addon.percentage || 0;
            const discount = totalCost * (percentage / 100);
            totalCost -= discount;
          } else {
            const addonAmount = addonValues[addonId] || addon.amount || 0;
            const src = (addon.type === 'dorm-vn' || addon.type === 'flight') ? 'VND' : 'KRW';
            totalCost += convertCurrencyAmount(addonAmount, src);
          }
        }
      }
    });

    return totalCost;
  }, [isKorean, selectedVisaType, university, selectedAddons, addonValues, currency]);

  const calculateTraditionalTotal = () => {
    return (
      university.generalTuition +
      university.visaFee +
      university.accommodationFee +
      university.insuranceFee +
      (university.additionalFees || []).reduce((sum: number, fee: any) => sum + fee.amount, 0)
    );
  };

  const handleAddonToggle = (addonId: string, addon: OptionalAddon) => {
    setSelectedAddons(prev => ({ ...prev, [addonId]: !prev[addonId] }));
    if (addon.options && addon.options.length > 0 && !addonValues[addonId]) {
      setAddonValues(prev => ({ ...prev, [addonId]: addon.options![0].value }));
    }
  };

  const handleAddonValueChange = (addonId: string, value: number) => {
    setAddonValues(prev => ({ ...prev, [addonId]: value }));
  };

  const handleRegister = () => {
    registerForUniversity(university.id);
    toast.success(`Đã đăng ký thành công cho ${university.name}!`, {
      description: 'Bạn có thể xem và chỉnh sửa chi phí trong trang "Chi phí của tôi"'
    });
  };

  const costBreakdown = [
    { icon: Building, label: 'Học phí', amount: university.generalTuition, color: 'bg-blue-100 text-blue-600' },
    { icon: FileText, label: 'Phí visa', amount: university.visaFee, color: 'bg-purple-100 text-purple-600' },
    { icon: Shield, label: 'Chi phí lưu trú', amount: university.accommodationFee, color: 'bg-green-100 text-green-600' },
    { icon: Shield, label: 'Bảo hiểm', amount: university.insuranceFee, color: 'bg-orange-100 text-orange-600' },
  ];

  const tabClass = (tab: string) =>
    `px-6 py-4 font-medium transition-colors border-b-2 ${
      activeTab === tab
        ? 'border-primary text-primary bg-blue-50/50'
        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="relative h-80 md:h-96 overflow-hidden">
        <img src={university.heroImage} alt={university.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm text-slate-900 rounded-lg hover:bg-white transition-colors shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{university.countryCode}</span>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full">
                <MapPin className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{university.country}</span>
              </div>
              {isKorean && university.koreanData?.topVisa && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/90 rounded-full">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Korean General Info */}
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
                    {university.koreanData.majorCategories.map((cat: any, idx: number) => (
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
                <p className="text-xs text-blue-700 mt-1">Thông tin chi phí chỉ để tham khảo.</p>
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

        {/* Tabs */}
        <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <div className="flex border-b border-slate-200 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={tabClass('overview')}>Giới thiệu</button>
            <button onClick={() => setActiveTab('academic')} className={tabClass('academic')}>Định hướng học tập</button>
            <button onClick={() => setActiveTab('costs')} className={tabClass('costs')}>
              {isKorean ? 'Chi phí & Chọn hệ Visa' : 'Chi phí'}
            </button>
            <button onClick={() => setActiveTab('gallery')} className={tabClass('gallery')}>Ảnh & Cuộc sống sinh viên</button>
            <button onClick={() => setActiveTab('ranking')} className={tabClass('ranking')}>
              {isKorean ? 'Hỗ trợ & Thông tin' : 'Ranking & Thông tin'}
            </button>
          </div>
        </div>

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Giới thiệu chung</h2>
            <p className="text-slate-700 leading-relaxed">{university.overview}</p>
          </div>
        )}

        {/* Tab: Academic */}
        {activeTab === 'academic' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Định hướng học tập</h2>
            <p className="text-slate-600 mb-6">Các ngành mạnh, chương trình nổi bật và cơ hội nghiên cứu</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(university.academicPrograms || []).map((program: any, index: number) => {
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
        )}

        {/* Tab: Costs */}
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
                    {university.koreanData?.visaSystems?.map((visa: any) => (
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
                          {selectedVisaType === visa.visaType && <Check className="w-5 h-5 text-primary" />}
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
                        {university.fixedCosts.map((cost: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-red-50 border border-red-100 rounded-lg">
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
                      const visa = university.koreanData?.visaSystems?.find((v: any) => v.visaType === selectedVisaType);
                      if (!visa) return null;
                      return (
                        <div className="space-y-2">
                          {visa.tuitionPerTerm && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Học phí mỗi kỳ (Tuition per Term)</span>
                              <span className="font-bold text-slate-900">{formatCurrency(convertCurrencyAmount(visa.tuitionPerTerm, 'KRW'))}</span>
                            </div>
                          )}
                          {visa.tuitionRange && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Học phí mỗi kỳ (Tuition Range)</span>
                              <span className="font-bold text-slate-900">
                                {formatCurrency(convertCurrencyAmount(visa.tuitionRange.min, 'KRW'))} - {formatCurrency(convertCurrencyAmount(visa.tuitionRange.max, 'KRW'))}
                              </span>
                            </div>
                          )}
                          {visa.applicationFee && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Phí apply (Application Fee)</span>
                              <span className="font-bold text-slate-900">{formatCurrency(convertCurrencyAmount(visa.applicationFee, 'KRW'))}</span>
                            </div>
                          )}
                          {visa.enrollmentFee && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Phí nhập học (Enrollment Fee)</span>
                              <span className="font-bold text-slate-900">{formatCurrency(convertCurrencyAmount(visa.enrollmentFee, 'KRW'))}</span>
                            </div>
                          )}
                          {visa.baseYearlyFee && (
                            <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-lg">
                              <span className="text-sm font-medium text-slate-700">Phí cơ bản hàng năm (Base Yearly Fee)</span>
                              <span className="font-bold text-slate-900">{formatCurrency(convertCurrencyAmount(visa.baseYearlyFee, 'KRW'))}</span>
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
                    <p className="text-sm text-slate-600 mb-4">Chọn các dịch vụ bổ sung bạn muốn</p>
                    <div className="space-y-4">
                      {university.optionalAddons.map((addon: OptionalAddon) => (
                        <div key={addon.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* ✅ FIX: Removed backtick template literal inside JSX className — use conditional string instead */}
                            <button
                              onClick={() => handleAddonToggle(addon.id, addon)}
                              className={[
                                'mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                                selectedAddons[addon.id]
                                  ? 'bg-primary border-primary'
                                  : 'border-slate-300 hover:border-primary'
                              ].join(' ')}
                            >
                              {selectedAddons[addon.id] && <Check className="w-4 h-4 text-white" />}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-medium text-slate-900">{addon.nameVi || addon.name}</h3>
                                  {addon.nameKr && <p className="text-xs text-slate-500 mt-0.5">{addon.nameKr}</p>}
                                  {addon.conditional && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      {addon.conditional}
                                    </p>
                                  )}
                                </div>
                                {addon.amount !== undefined && !addon.requiresInput && !addon.amountRange && (
                                  <span className={addon.type === 'scholarship' ? 'font-bold whitespace-nowrap text-green-600' : 'font-bold whitespace-nowrap text-slate-900'}>
                                    {addon.type === 'scholarship'
                                      ? `-${addon.percentage}%`
                                      : formatCurrency(convertCurrencyAmount(addon.amount, (addon.type === 'dorm-vn' || addon.type === 'flight') ? 'VND' : 'KRW'))
                                    }
                                  </span>
                                )}
                              </div>

                              {/* Dorm KR - radio buttons */}
                              {selectedAddons[addon.id] && addon.type === 'dorm-kr' && addon.options && (
                                <div className="mt-3">
                                  <RadioGroup
                                    value={String(addonValues[addon.id] || addon.options[0].value)}
                                    onValueChange={(val: string) => handleAddonValueChange(addon.id, Number(val))}
                                  >
                                    <div className="space-y-2">
                                      {addon.options.map((opt) => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                          <RadioGroupItem value={String(opt.value)} id={`${addon.id}-${opt.value}`} />
                                          <Label htmlFor={`${addon.id}-${opt.value}`} className="text-sm text-slate-700 cursor-pointer">
                                            {opt.label}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </RadioGroup>
                                </div>
                              )}

                              {/* ✅ FIX: Optional chaining on amountRange */}
                              {selectedAddons[addon.id] && addon.type === 'flight' && addon.amountRange && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-600">Điều chỉnh giá vé:</span>
                                    <span className="text-sm font-bold text-primary">
                                      {formatCurrency(convertCurrencyAmount(addonValues[addon.id] || addon.amount || addon.amountRange.min, 'VND'))}
                                    </span>
                                  </div>
                                  <Slider
                                    value={[addonValues[addon.id] || addon.amount || addon.amountRange.min]}
                                    onValueChange={(values: number[]) => handleAddonValueChange(addon.id, values[0])}
                                    min={addon.amountRange.min}
                                    max={addon.amountRange.max}
                                    step={500000}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between mt-1">
                                    <span className="text-xs text-slate-500">Sớm: {formatCurrency(convertCurrencyAmount(addon.amountRange.min, 'VND'))}</span>
                                    <span className="text-xs text-slate-500">Muộn: {formatCurrency(convertCurrencyAmount(addon.amountRange.max, 'VND'))}</span>
                                  </div>
                                </div>
                              )}

                              {/* Dropdown for other options */}
                              {selectedAddons[addon.id] && addon.requiresInput && addon.options && addon.type !== 'dorm-kr' && addon.type !== 'flight' && (
                                <div className="mt-3">
                                  <select
                                    value={addonValues[addon.id] || (addon.options?.[0]?.value ?? 0)}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleAddonValueChange(addon.id, Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                  >
                                    {addon.options.map((opt) => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cost Summary */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border-2 border-green-200 p-6 shadow-lg sticky bottom-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Tổng kết chi phí (Cost Summary)
                  </h2>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Chi phí cố định (Fixed)</span>
                      <span className="font-medium">
                        {formatCurrency(
                          (university.fixedCosts || []).reduce(
                            (sum: number, cost: any) => sum + convertCurrencyAmount(cost.amount, cost.currency || 'USD'),
                            0
                          )
                        )}
                      </span>
                    </div>
                    {selectedVisaType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Chi phí hệ {selectedVisaType}</span>
                        <span className="font-medium">
                          {(() => {
                            const visa = university.koreanData?.visaSystems?.find((v: any) => v.visaType === selectedVisaType);
                            if (!visa) return formatCurrency(0);
                            let t = 0;
                            if (visa.tuitionPerTerm) t += convertCurrencyAmount(visa.tuitionPerTerm, 'KRW');
                            if (visa.tuitionRange) t += convertCurrencyAmount(visa.tuitionRange.max, 'KRW');
                            if (visa.applicationFee) t += convertCurrencyAmount(visa.applicationFee, 'KRW');
                            if (visa.enrollmentFee) t += convertCurrencyAmount(visa.enrollmentFee, 'KRW');
                            if (visa.baseYearlyFee) t += convertCurrencyAmount(visa.baseYearlyFee, 'KRW');
                            return formatCurrency(t);
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t-2 border-green-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-900">Tổng cộng (Total)</span>
                      <span className="text-3xl font-bold text-primary">{formatCurrency(calculateKoreanTotal)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-right">Hiển thị trong {currency} • Tỷ giá thực tế</p>
                  </div>

                  {calculateKoreanTotal > 0 && (() => {
                    const mc = formatAllCurrencies(calculateKoreanTotal);
                    const items = [
                      { flag: '🇻🇳', code: 'VND', val: mc.vnd },
                      { flag: '🇰🇷', code: 'KRW', val: mc.krw },
                      { flag: '🇺🇸', code: 'USD', val: mc.usd },
                      { flag: '🇯🇵', code: 'JPY', val: mc.jpy },
                      { flag: '🇨🇳', code: 'CNY', val: mc.cny },
                    ];
                    return (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Quy đổi tất cả đơn vị tiền tệ</p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {items.map(item => (
                            <div key={item.code} className="bg-white rounded-lg border border-green-100 p-2 text-center">
                              <div className="text-lg mb-0.5">{item.flag}</div>
                              <div className="text-xs text-slate-500">{item.code}</div>
                              <div className="text-xs font-bold text-slate-800 leading-tight">{item.val}</div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 text-center">
                          Tỷ giá: 1 USD = 26,192 VND = 1,474 KRW = 157 JPY = 6.91 CNY
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                {/* Traditional Cost Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Chi tiết chi phí</h2>
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {costBreakdown.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-5 border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${item.color}`}>
                          <item.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-1">{item.label}</p>
                          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {(university.additionalFees || []).length > 0 && (
                    <div className="border-t border-slate-200 pt-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-4">Phí bổ sung</h3>
                      <div className="space-y-2">
                        {university.additionalFees.map((fee: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                            <span className="text-sm text-slate-700">{fee.type}</span>
                            <span className="font-semibold text-slate-900">{formatCurrency(convertAmount(fee.amount, currency))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Tổng kết tài chính</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-600">Học phí</span>
                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.generalTuition, currency))}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-600">Phí visa</span>
                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.visaFee, currency))}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-600">Chi phí lưu trú</span>
                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.accommodationFee, currency))}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100">
                      <span className="text-slate-600">Bảo hiểm</span>
                      <span className="font-medium text-slate-900">{formatCurrency(convertAmount(university.insuranceFee, currency))}</span>
                    </div>
                    {(university.additionalFees || []).map((fee: any, index: number) => (
                      <div key={index} className="flex justify-between py-3 border-b border-slate-100">
                        <span className="text-slate-600">{fee.type}</span>
                        <span className="font-medium text-slate-900">{formatCurrency(convertAmount(fee.amount, currency))}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-4 pt-5 border-t-2 border-slate-300">
                      <span className="text-lg font-bold text-slate-900">Tổng chi phí ước tính</span>
                      <span className="text-2xl font-bold text-primary">{formatCurrency(convertAmount(calculateTraditionalTotal(), currency))}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Gallery */}
        {activeTab === 'gallery' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ảnh & Cuộc sống sinh viên</h2>
            <p className="text-slate-600 mb-6">Khám phá không gian học tập và trải nghiệm sinh viên</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(university.galleryImages || []).map((image: string, index: number) => (
                <div key={index} className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer">
                  <img
                    src={image}
                    alt={`${university.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Ranking */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {isKorean ? 'Hỗ trợ & Thông tin thêm' : 'Ranking & Thông tin thêm'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">World Ranking</p>
                      <p className="text-3xl font-bold text-primary">#{university.worldRanking}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{university.ranking}</p>
                </div>

                <div className="p-6 border-2 border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Danh tiếng</p>
                      <p className="text-2xl font-bold text-slate-900">Xuất sắc</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">Được công nhận toàn cầu với chất lượng giáo dục hàng đầu</p>
                </div>
              </div>

              {isKorean && university.koreanData && (
                <>
                  {university.koreanData.studentSupport && university.koreanData.studentSupport.length > 0 && (
                    <div className="mb-6 p-6 bg-green-50 rounded-xl border border-green-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        Hỗ trợ sinh viên (Student Support)
                      </h3>
                      <ul className="space-y-2">
                        {university.koreanData.studentSupport.map((support: string, idx: number) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{support}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {university.koreanData.scholarships && university.koreanData.scholarships.length > 0 && (
                    <div className="mb-6 p-6 bg-yellow-50 rounded-xl border border-yellow-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-yellow-600" />
                        Học bổng (Scholarships)
                      </h3>
                      <div className="space-y-3">
                        {university.koreanData.scholarships.map((scholarship: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium text-blue-600">{scholarship.visaType}:</p>
                            <p className="text-slate-700 ml-4">{scholarship.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {university.koreanData.jobOpportunities && (
                    <div className="p-6 bg-purple-50 rounded-xl border border-purple-200">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-purple-600" />
                        Cơ hội việc làm thêm (Part-time Jobs)
                      </h3>
                      <p className="text-sm text-slate-700">{university.koreanData.jobOpportunities}</p>
                    </div>
                  )}
                </>
              )}

              <div className="mt-6 p-6 bg-slate-50 rounded-xl">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Thông tin liên hệ</h3>
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• Website: www.{university.name.toLowerCase().replace(/\s+/g, '')}.edu</p>
                  <p>• Email: admissions@{university.name.toLowerCase().replace(/\s+/g, '')}.edu</p>
                  <p>• Địa chỉ: {isKorean && university.koreanData?.address ? university.koreanData.address : university.country}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
