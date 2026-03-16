import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { useCurrency } from '../context/CurrencyContext';
import { TotalWithConversions } from '../components/MultiCurrencyDisplay';
import { 
  ArrowLeft, MapPin, Star, GraduationCap, Home, Briefcase, Award, 
  Clock, CheckCircle, Users 
} from 'lucide-react';
import { toast } from 'sonner';
import type { AcademicProgram } from '../../types/university';
import type { Currency } from '../../types/common';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { universities, registrations, registerForUniversity, user } = useApp();
  const { currency, formatFrom, convertAmount } = useCurrency();

  const university = universities.find(uni => uni.id === id);
  
  // All visa systems to render
  const ALL_VISA_SYSTEMS = ['D4-1', 'D2-1', 'D2-2', 'D2-3', 'D2-6'] as const;
  
  const VISA_LABELS = {
    'D4-1': 'Hệ tiếng',
    'D2-1': 'Dự bị ĐH',
    'D2-2': 'Đại học',
    'D2-3': 'Sau đại học',
    'D2-6': 'Nghiên cứu'
  };

  // Get available visa systems
  const availableVisaSystems = useMemo(() => {
    const systems = university?.koreanData?.visaSystems || [];
    return systems.filter((s: any) => s.available !== false);
  }, [university?.koreanData?.visaSystems]);

  // Auto-select first available visa system
  const [selectedVisaType, setSelectedVisaType] = useState<string>(() => {
    const firstAvailable = availableVisaSystems[0]?.visaType;
    return firstAvailable || 'D4-1';
  });
  
  // Update selected visa type when available systems change
  useEffect(() => {
    if (availableVisaSystems.length > 0 && !availableVisaSystems.find((s: any) => s.visaType === selectedVisaType)) {
      setSelectedVisaType(availableVisaSystems[0].visaType);
      // Reset TOPIK level when switching visa systems
      setTopikLevel(0);
    }
  }, [availableVisaSystems, selectedVisaType]);
  
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [addonValues, setAddonValues] = useState<Record<string, number>>({});
  const [topikLevel, setTopikLevel] = useState<number>(0);
  const [dormMonths, setDormMonths] = useState<number>(6);

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy trường đại học</h2>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  const isRegistered = registrations.some(r => r.universityId === id && r.studentEmail === user?.email);
  const isKorean = university.koreanData?.isKoreanUniversity ?? true;

  // Visa system hiện tại
  const currentVisaSystem = university.koreanData?.visaSystems?.find(
    (v: any) => v.visaType === selectedVisaType
  );

  // Tính tổng chi phí (đồng bộ với Edit Modal)
  // Includes: fixed costs for selected visa, visa system costs, optional addons
  // Excludes: scholarships (subtracted), costs not applicable to selected visa
  const totalCost = useMemo(() => {
    let total = 0;

    // Chi phí cố định - only include those that apply to selected visa type
    (university.fixedCosts || []).forEach((cost: any) => {
      // Check if this fee applies to the selected visa system (he_ap_dung)
      const appliesToSystems = cost.appliesToSystems || cost.visaType || [];
      const isApplicable = appliesToSystems.length === 0 || appliesToSystems.includes(selectedVisaType);
      
      if (!isApplicable) return;
      
      // Check if this is a scholarship type - should subtract
      const isScholarship = cost.category === 'scholarship' || 
                            cost.type?.toLowerCase().includes('học bổng') ||
                            cost.type?.toLowerCase().includes('scholarship');
      
      const amount = cost.amount || 0;
      if (isScholarship) {
        total -= convertAmount(amount, currency, cost.currency || 'VND');
      } else {
        total += convertAmount(amount, currency, cost.currency || 'VND');
      }
    });

    // Chi phí theo hệ visa
    if (currentVisaSystem) {
      if (currentVisaSystem.tuitionPerTerm) {
        total += convertAmount(currentVisaSystem.tuitionPerTerm, currency, 'KRW');
      }
      if (currentVisaSystem.tuitionRange?.max) {
        total += convertAmount(currentVisaSystem.tuitionRange.max, currency, 'KRW');
      }
      if (currentVisaSystem.applicationFee) {
        total += convertAmount(currentVisaSystem.applicationFee, currency, 'KRW');
      }
      if (currentVisaSystem.enrollmentFee) {
        total += convertAmount(currentVisaSystem.enrollmentFee, currency, 'KRW');
      }
    }

    // Chi phí tùy chọn - only include if applicable to selected visa
    Object.entries(selectedAddons).forEach(([addonId, isSelected]) => {
      if (!isSelected) return;

      const addon = university.optionalAddons?.find((a: any) => a.id === addonId);
      if (!addon) return;
      
      // Check if addon applies to selected visa type
      const addonVisaTypes = addon.visaType || [];
      if (addonVisaTypes.length > 0 && !addonVisaTypes.includes(selectedVisaType)) {
        return; // Skip if not applicable to current visa
      }

      let amount = addon.amount || 0;

      if (addon.type === 'scholarship' && topikLevel > 0) {
        const tuition = currentVisaSystem?.tuitionRange?.max || currentVisaSystem?.tuitionPerTerm || 0;
        const discountPercent = [0, 10, 20, 30, 50, 70, 100][topikLevel] || 0;
        amount = -Math.round((tuition * discountPercent) / 100);
      } else if (addon.type === 'dorm-vn' || addon.type === 'dorm-kr') {
        amount = (addon.amount || 800000) * dormMonths;
      } else if (addon.type === 'flight' || addon.type === 'savings') {
        amount = addonValues[addonId] || addon.amount || 0;
      }

      total += convertAmount(amount, currency, (addon.currency || 'KRW') as Currency);
    });

    return Math.max(0, total);
  }, [university, selectedVisaType, selectedAddons, addonValues, dormMonths, topikLevel, currency, currentVisaSystem]);

  const handleRegister = () => {
    registerForUniversity(university.id);
    toast.success('Đăng ký thành công!', {
      description: `Bạn đã đăng ký tư vấn tại ${university.name}`,
    });
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Section */}
      <div className="relative h-[420px] overflow-hidden">
        <img 
          src={university.heroImage || university.thumbnail || '/default-university.jpg'} 
          alt={university.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />

        <div className="absolute top-6 left-6">
          <Button 
            onClick={() => navigate(-1)}
            variant="secondary"
            className="bg-white/90 hover:bg-white text-slate-900"
          >
            ← Quay lại
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Hàn Quốc
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{university.ranking}</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-1">{university.name}</h1>
            <p className="text-xl opacity-90">{university.koreanName}</p>
            <p className="mt-2 flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" /> {university.region || university.koreanData?.address}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* Thông tin chung */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Thông tin chung</h2>
            <div className="prose text-slate-600 leading-relaxed">
              {university.overview}
            </div>

            {university.academicPrograms && (
              <div className="mt-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <GraduationCap className="text-[#003AB7]" /> Chuyên ngành tiêu biểu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {university.academicPrograms?.map((prog: AcademicProgram, i: number) => (
                    <Badge key={i} variant="outline" className="px-4 py-1.5">{prog.title}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Xếp hạng & Khu vực</h3>
              <p className="text-2xl font-bold text-[#003AB7]">{university.ranking}</p>
              <p className="text-slate-600 mt-1">{university.region}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="text-emerald-600" /> Cơ hội việc làm thêm
              </h3>
              <p className="text-sm text-slate-600">{(university.koreanData as any)?.workOpportunity || university.description || "Nhiều cơ hội tại khu vực gần trường"}</p>
            </div>
          </div>
        </div>

        {/* Chi phí chi tiết - Đồng bộ với Edit Modal */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-8">Chi phí du học chi tiết</h2>

          {/* Chọn hệ visa - All tabs visible, available clickable, non-available disabled */}
          <div className="mb-8">
            <p className="text-slate-500 mb-3">Chọn hệ du học</p>
            <div className="flex flex-wrap gap-3">
              {ALL_VISA_SYSTEMS.map(visaType => {
                const isAvailable = availableVisaSystems.some((s: any) => s.visaType === visaType);
                
                return (
                  <button
                    key={visaType}
                    onClick={() => isAvailable && setSelectedVisaType(visaType)}
                    disabled={!isAvailable}
                    className={`px-6 py-3 rounded-2xl font-medium transition-all relative ${
                      selectedVisaType === visaType
                        ? 'bg-[#003AB7] text-white border-[#003AB7] shadow-lg'
                        : isAvailable
                        ? 'bg-white border-slate-200 hover:border-[#003AB7]/50 hover:bg-slate-50'
                        : 'bg-slate-100 border-slate-200 opacity-45 cursor-not-allowed'
                    }`}
                  >
                    {/* Available tabs show green dot and sub-label */}
                    {isAvailable && (
                      <>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                        <div className="text-xs text-slate-500 mt-1">
                          {VISA_LABELS[visaType]}
                        </div>
                      </>
                    )}
                    
                    {/* Non-available tabs show strike-through and "Không có" */}
                    {!isAvailable && (
                      <>
                        <span className="line-through">{visaType}</span>
                        <div className="text-xs text-red-500 mt-1">
                          Không có
                        </div>
                      </>
                    )}
                    
                    {/* Always show visa type */}
                    <span className={isAvailable ? '' : 'opacity-60'}>
                      {visaType}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Accordion type="multiple" defaultValue={['fixed', 'system', 'optional']} className="space-y-4">
            {/* Fixed Costs */}
            <AccordionItem value="fixed">
              <AccordionTrigger className="text-lg font-semibold">Chi phí cố định</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {(university.fixedCosts || []).map((cost: any, i: number) => (
                    <div key={i} className="flex justify-between py-3 border-b last:border-none">
                      <span className="text-slate-700">{cost.type || cost.name}</span>
                      <span className="font-semibold">{formatFrom(cost.amount, cost.currency || 'VND')}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* System Cost */}
            <AccordionItem value="system">
              <AccordionTrigger className="text-lg font-semibold">
                Chi phí theo hệ {selectedVisaType}
              </AccordionTrigger>
              <AccordionContent>
                {currentVisaSystem ? (
                  <div className="space-y-4">
                    {currentVisaSystem.tuitionRange && (
                      <div className="flex justify-between">
                        <span>Học phí</span>
                        <span>{formatFrom(currentVisaSystem.tuitionRange.min, 'KRW')} - {formatFrom(currentVisaSystem.tuitionRange.max, 'KRW')}</span>
                      </div>
                    )}
                    {currentVisaSystem.tuitionPerTerm && (
                      <div className="flex justify-between">
                        <span>Học phí mỗi kỳ</span>
                        <span>{formatFrom(currentVisaSystem.tuitionPerTerm, 'KRW')}</span>
                      </div>
                    )}
                  </div>
                ) : <p className="text-slate-500">Chưa có dữ liệu chi phí cho hệ này</p>}
              </AccordionContent>
            </AccordionItem>

            {/* Optional Addons */}
            <AccordionItem value="optional">
              <AccordionTrigger className="text-lg font-semibold">Phí tùy chọn</AccordionTrigger>
              <AccordionContent>
                {/* Scholarship */}
                <div className="mb-6 p-4 bg-amber-50 rounded-2xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topikLevel > 0}
                      onChange={(e) => setTopikLevel(e.target.checked ? 3 : 0)}
                    />
                    <span className="font-medium">Áp dụng học bổng TOPIK</span>
                  </label>
                  {topikLevel > 0 && (
                    <select 
                      value={topikLevel}
                      onChange={(e) => setTopikLevel(Number(e.target.value))}
                      className="mt-3 w-full p-3 border rounded-xl"
                    >
                      {[1,2,3,4,5,6].map(l => (
                        <option key={l} value={l}>TOPIK {l} — Giảm {(l*15 > 100 ? 100 : l*15)}%</option>
                      ))}
                    </select>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Tổng chi phí */}
          <div className="mt-12 pt-8 border-t">
            <TotalWithConversions 
              amount={totalCost}
              baseCurrency={currency}
              label="Tổng chi phí ước tính"
              className="shadow-xl"
            />
          </div>
        </div>

        {/* Nút đăng ký */}
        {!isRegistered && user?.role === 'student' && (
          <Button 
            onClick={handleRegister}
            size="lg"
            className="w-full py-7 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#003AB7] to-blue-600 hover:from-[#002A8F]"
          >
            <CheckCircle className="mr-3 w-5 h-5" />
            Đăng ký tư vấn ngay
          </Button>
        )}
      </div>
    </div>
  );
}