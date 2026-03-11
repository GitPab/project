import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency, Currency } from '../context/CurrencyContext';
import { MultiCurrencyDisplay, TotalWithConversions } from '../components/MultiCurrencyDisplay';
import type { VisaSystemCost, OptionalAddon } from '../context/AppContext';
import { 
  ArrowLeft, MapPin, DollarSign, CheckCircle, Building, Home, Shield, FileText, Lock,
  GraduationCap, Scale, Microscope, Cpu, TrendingUp, Lightbulb, Zap, Atom, BarChart3, Rocket,
  Building2, Briefcase, BookOpen, Leaf, Users, Stethoscope, Globe, TestTube, Megaphone, Award, Star,
  ChevronDown, AlertCircle, Info, Check, X, Plus, Minus
} from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  GraduationCap, Scale, Microscope, Cpu, TrendingUp, Lightbulb, Zap, Atom, BarChart3, Rocket,
  Building2, Briefcase, BookOpen, Leaf, Users, Stethoscope, Globe, TestTube, Megaphone, Building
};

export default function UniversityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { universities, registrations, registerForUniversity, user } = useApp();
  const { currency, formatFrom, convertAmount } = useCurrency();
  
  // Korean university specific state
  const [selectedVisaType, setSelectedVisaType] = useState<'D4-1' | 'D2-2' | 'D2-3' | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [addonValues, setAddonValues] = useState<Record<string, number>>({});

  const university = universities.find(uni => uni.id === id);
  const isRegistered = registrations.some(r => r.universityId === id && r.studentEmail === user?.email);
  const isKorean = university?.koreanData?.isKoreanUniversity;

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">University not found</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Initialize visa type on first render for Korean universities
  React.useEffect(() => {
    if (isKorean && !selectedVisaType && university.koreanData?.visaSystems?.[0]) {
      setSelectedVisaType(university.koreanData.visaSystems[0].visaType);
    }
  }, [isKorean, selectedVisaType, university]);

  // NOTE: All base costs in `University` are stored in USD,
  // except Korean-specific fields that are explicitly KRW/VND in the dataset.

  // Calculate total cost
  const calculateTotal = useMemo(() => {
    let total = 0;

    if (isKorean && selectedVisaType) {
      // Korean university calculation
      
      // Add fixed costs
      if (university.fixedCosts) {
        university.fixedCosts.forEach(cost => {
          total += convertAmount(cost.amount, currency, cost.currency || 'USD');
        });
      }

      // Add visa system costs
      const visaSystem = university.koreanData?.visaSystems?.find(v => v.visaType === selectedVisaType);
      if (visaSystem) {
        if (visaSystem.tuitionPerTerm) {
          total += convertAmount(visaSystem.tuitionPerTerm, currency, 'KRW');
        }
        if (visaSystem.tuitionRange) {
          total += convertAmount(visaSystem.tuitionRange.max, currency, 'KRW');
        }
        if (visaSystem.applicationFee) {
          total += convertAmount(visaSystem.applicationFee, currency, 'KRW');
        }
        if (visaSystem.enrollmentFee) {
          total += convertAmount(visaSystem.enrollmentFee, currency, 'KRW');
        }
        if (visaSystem.baseYearlyFee) {
          total += convertAmount(visaSystem.baseYearlyFee, currency, 'KRW');
        }
      }

      // Add selected optional addons
      Object.entries(selectedAddons).forEach(([addonId, isSelected]) => {
        if (isSelected) {
          const addon = university.optionalAddons?.find(a => a.id === addonId);
          if (addon) {
            if (addon.type === 'scholarship') {
              // Scholarships reduce the tuition cost
              const percentage = addonValues[addonId] || addon.percentage || 0;
              const tuitionCost = visaSystem?.tuitionRange?.max || visaSystem?.tuitionPerTerm || 0;
              const discount = (tuitionCost * percentage) / 100;
              total -= convertAmount(discount, currency, 'KRW');
            } else {
              const value = addonValues[addonId] || addon.amount || 0;
              const addonCurrency = addon.type === 'dorm-vn' || addon.type === 'flight' ? 'VND' : 'KRW';
              total += convertAmount(value, currency, addonCurrency);
            }
          }
        }
      });
    } else {
      // Traditional university calculation
      total += convertAmount(university.generalTuition, currency);
      total += convertAmount(university.visaFee, currency);
      total += convertAmount(university.accommodationFee, currency);
      total += convertAmount(university.insuranceFee, currency);
      
      if (university.additionalFees) {
        university.additionalFees.forEach(fee => {
          if (fee.selected !== false) {
            total += convertAmount(fee.amount, currency);
          }
        });
      }
    }

    return total;
  }, [isKorean, selectedVisaType, selectedAddons, addonValues, currency, university, convertAmount]);

  const handleRegister = () => {
    registerForUniversity(university.id);
    toast.success('Đăng ký thành công!', {
      description: `Bạn đã đăng ký thành công tại ${university.name}`
    });
  };

  const toggleAddon = (addonId: string, addon: OptionalAddon) => {
    setSelectedAddons(prev => ({ ...prev, [addonId]: !prev[addonId] }));
    
    // Set default value if available
    if (!selectedAddons[addonId] && addon.options && addon.options.length > 0) {
      setAddonValues(prev => ({ ...prev, [addonId]: addon.options![0].value }));
    }
  };

  const IconComponent = (iconName: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={university.heroImage} 
          alt={university.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg transition-colors border border-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Quay lại</span>
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-white/80 mb-2">
              <span className="text-2xl">{university.countryCode}</span>
              <MapPin className="w-4 h-4" />
              <span>{university.country}</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{university.name}</h1>
            <p className="text-lg text-white/90">{university.tagline}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Common Info Section - NO COSTS HERE */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Thông tin chung</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-slate-700">Xếp hạng:</span>
              </div>
              <p className="text-slate-600 ml-7">{university.ranking}</p>
              {isKorean && university.koreanData?.koreanRanking && (
                <p className="text-sm text-slate-500 ml-7 mt-1">{university.koreanData.koreanRanking}</p>
              )}
            </div>

            {isKorean && university.koreanData?.address && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-slate-700">Địa chỉ:</span>
                </div>
                <p className="text-slate-600 ml-7">{university.koreanData.address}</p>
              </div>
            )}

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="font-semibold text-slate-700">Định hướng học thuật:</span>
              </div>
              <div className="ml-7 space-y-2">
                {university.academicPrograms.map((program, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="text-primary mt-0.5">{IconComponent(program.icon)}</div>
                    <div>
                      <p className="font-medium text-slate-800">{program.title}</p>
                      <p className="text-sm text-slate-600">{program.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-3">Giới thiệu</h3>
            <p className="text-slate-600 leading-relaxed">{university.overview}</p>
          </div>
        </div>

        {/* Cost Section - Ajou Style */}
        {isKorean && university.koreanData ? (
          <>
            {/* Visa System Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Chọn hệ thống (Visa System)</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {university.koreanData.visaSystems?.map((system) => (
                  <button
                    key={system.visaType}
                    onClick={() => setSelectedVisaType(system.visaType)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedVisaType === system.visaType
                        ? 'border-primary bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-1">{system.visaType}</div>
                    <div className="text-sm text-slate-600">{system.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cost Breakdown */}
            <Accordion type="multiple" defaultValue={['fixed', 'system', 'addons']} className="space-y-4">
              {/* Fixed Costs */}
              {university.fixedCosts && university.fixedCosts.length > 0 && (
                <AccordionItem value="fixed" className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-900">Chi phí cố định (Fixed Costs)</h3>
                        <p className="text-sm text-slate-600">Luôn được tính vào tổng chi phí</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-3">
                      {university.fixedCosts.map((cost, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-slate-700">{cost.type}</span>
                          <span className="font-semibold text-slate-900">
                            {formatFrom(cost.amount, cost.currency || 'USD')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* System-Specific Costs */}
              {selectedVisaType && (
                <AccordionItem value="system" className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-900">Chi phí theo hệ {selectedVisaType}</h3>
                        <p className="text-sm text-slate-600">Dựa trên visa system đã chọn</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    {(() => {
                      const visaSystem = university.koreanData?.visaSystems?.find(v => v.visaType === selectedVisaType);
                      if (!visaSystem) return null;

                      return (
                        <div className="space-y-3">
                          {visaSystem.applicationFee && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-700">Phí đơn (Application Fee)</span>
                              <span className="font-semibold text-slate-900">
                                {formatFrom(visaSystem.applicationFee, 'KRW')}
                              </span>
                            </div>
                          )}
                          {visaSystem.enrollmentFee && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-700">Phí nhập học (Enrollment Fee)</span>
                              <span className="font-semibold text-slate-900">
                                {formatFrom(visaSystem.enrollmentFee, 'KRW')}
                              </span>
                            </div>
                          )}
                          {visaSystem.tuitionPerTerm && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-700">Học phí mỗi kỳ (Tuition per Term)</span>
                              <span className="font-semibold text-slate-900">
                                {formatFrom(visaSystem.tuitionPerTerm, 'KRW')}
                              </span>
                            </div>
                          )}
                          {visaSystem.tuitionRange && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-700">Học phí (Tuition Range)</span>
                              <span className="font-semibold text-slate-900">
                                {formatFrom(visaSystem.tuitionRange.min, 'KRW')} - {formatFrom(visaSystem.tuitionRange.max, 'KRW')}
                              </span>
                            </div>
                          )}
                          {visaSystem.baseYearlyFee && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                              <span className="text-slate-700">Hóa đơn hàng năm (Base Yearly Fee)</span>
                              <span className="font-semibold text-slate-900">
                                {formatFrom(visaSystem.baseYearlyFee, 'KRW')}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Optional Add-ons */}
              {university.optionalAddons && university.optionalAddons.length > 0 && (
                <AccordionItem value="addons" className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Plus className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-slate-900">Chi phí tùy chọn (Optional Add-ons)</h3>
                        <p className="text-sm text-slate-600">Chọn các dịch vụ bổ sung</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-3">
                      {university.optionalAddons.map((addon) => (
                        <div key={addon.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              id={addon.id}
                              checked={selectedAddons[addon.id] || false}
                              onChange={() => toggleAddon(addon.id, addon)}
                              className="mt-1 w-5 h-5 text-primary rounded focus:ring-primary"
                            />
                            <div className="flex-1">
                              <label htmlFor={addon.id} className="font-medium text-slate-800 cursor-pointer">
                                {addon.nameVi || addon.name}
                              </label>
                              
                              {addon.requiresInput && addon.options && selectedAddons[addon.id] && (
                                <select
                                  value={addonValues[addon.id] || addon.options[0].value}
                                  onChange={(e) => setAddonValues(prev => ({ ...prev, [addon.id]: parseInt(e.target.value) }))}
                                  className="mt-2 w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                  {addon.options.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {addon.conditional && (
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                  <Info className="w-3 h-3" />
                                  {addon.conditional}
                                </p>
                              )}
                            </div>

                            {selectedAddons[addon.id] && (
                              <div className="text-right">
                                {addon.type === 'scholarship' ? (
                                  <span className="text-sm font-semibold text-green-600">
                                    -{addonValues[addon.id] || addon.percentage}% giảm
                                  </span>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-900">
                                    {formatFrom(
                                      addonValues[addon.id] || addon.amount || 0,
                                      addon.type === 'dorm-vn' || addon.type === 'flight' ? 'VND' : 'KRW',
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </>
        ) : (
          // Traditional university costs
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Chi phí</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Học phí (Tuition)</span>
                <span className="font-semibold text-slate-900">{formatFrom(university.generalTuition, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Phí visa (Visa Fee)</span>
                <span className="font-semibold text-slate-900">{formatFrom(university.visaFee, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Chỗ ở (Accommodation)</span>
                <span className="font-semibold text-slate-900">{formatFrom(university.accommodationFee, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-700">Bảo hiểm (Insurance)</span>
                <span className="font-semibold text-slate-900">{formatFrom(university.insuranceFee, 'USD')}</span>
              </div>
              {university.additionalFees && university.additionalFees.map((fee, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-700">{fee.type}</span>
                  <span className="font-semibold text-slate-900">{formatFrom(fee.amount, 'USD')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real-time Calculator - Total with Multi-Currency Display */}
        <div className="sticky bottom-6 z-10">
          <TotalWithConversions 
            amount={calculateTotal} 
            baseCurrency={currency}
            label="Tổng chi phí ước tính"
            className="shadow-xl"
          />
          
          {!isRegistered && user?.role === 'student' && (
            <button
              onClick={handleRegister}
              className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-primary to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold text-lg flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Đăng ký ngay
            </button>
          )}

          {isRegistered && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Bạn đã đăng ký chương trình này</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
